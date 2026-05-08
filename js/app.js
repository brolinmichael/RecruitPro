document.addEventListener('DOMContentLoaded', () => {
    // --- Theme & Accent persistence (apply BEFORE first paint completes) ---
    const ACCENT_LABELS = { cyan: 'Cyan', purple: 'Purple', green: 'Green', blue: 'Blue', orange: 'Orange' };
    const savedTheme  = localStorage.getItem('rh-theme')  || 'dark';
    const savedAccent = localStorage.getItem('rh-accent') || 'cyan';
    document.body.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-accent', savedAccent);

    const setTheme = (theme) => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('rh-theme', theme);
        document.querySelectorAll('.theme-option').forEach(b => {
            const isActive = b.dataset.theme === theme;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    };

    const setAccent = (accent) => {
        document.body.setAttribute('data-accent', accent);
        localStorage.setItem('rh-accent', accent);
        document.querySelectorAll('.accent-swatch').forEach(b => {
            b.classList.toggle('active', b.dataset.accent === accent);
        });
        const label = document.getElementById('accent-label');
        if (label) label.textContent = ACCENT_LABELS[accent] || accent;
    };

    // Wire up controls
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    document.querySelectorAll('.accent-swatch').forEach(btn => {
        btn.addEventListener('click', () => setAccent(btn.dataset.accent));
    });

    // Reflect saved state in the UI on load
    setTheme(savedTheme);
    setAccent(savedAccent);

    // --- Mobile sidebar drawer ---
    const sidebarEl = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle');

    const closeSidebar = () => {
        if (!sidebarEl) return;
        sidebarEl.classList.remove('is-open');
        document.body.classList.remove('sidebar-open');
    };
    const openSidebar = () => {
        if (!sidebarEl) return;
        sidebarEl.classList.add('is-open');
        document.body.classList.add('sidebar-open');
    };
    if (menuToggle && sidebarEl) {
        menuToggle.addEventListener('click', () => {
            sidebarEl.classList.contains('is-open') ? closeSidebar() : openSidebar();
        });

        // Click on the dimmed overlay (body::before) closes the drawer.
        // The pseudo-element doesn't receive events directly, so we listen
        // on the body and check that the click landed outside the sidebar.
        document.body.addEventListener('click', (e) => {
            if (!document.body.classList.contains('sidebar-open')) return;
            if (sidebarEl.contains(e.target)) return;
            if (menuToggle.contains(e.target)) return;
            closeSidebar();
        });

        // Tapping a nav item also closes the drawer (matches mobile expectations)
        sidebarEl.querySelectorAll('.nav-item[data-target]').forEach(item => {
            item.addEventListener('click', () => {
                if (window.matchMedia('(max-width: 768px)').matches) closeSidebar();
            });
        });

        // If the viewport widens past mobile, drop the open state
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeSidebar();
        });
    }

    // --- Login Logic ---
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const showError = (inputElement, errorId) => {
        const formGroup = inputElement.closest('.form-group');
        formGroup.classList.add('error');
        // Remove animation class after it completes so it can be re-triggered
        setTimeout(() => {
            formGroup.classList.remove('error');
            // Keep the border red, just remove the shake animation class if we had separated them,
            // but here we toggle the whole class. Let's just remove shake manually or keep it simple.
        }, 400);
    };

    const clearErrors = () => {
        document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        let isValid = true;

        if (!validateEmail(emailInput.value)) {
            showError(emailInput);
            isValid = false;
        }

        if (passwordInput.value.length < 6) {
            showError(passwordInput);
            isValid = false;
        }

        if (isValid) {
            // Simulate API call and success
            const btn = loginForm.querySelector('.btn-primary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Authenticating...';
            lucide.createIcons();

            setTimeout(() => {
                loginScreen.classList.remove('active');
                setTimeout(() => {
                    loginScreen.style.display = 'none';
                    appContainer.style.display = 'flex';
                    // Trigger reflow
                    void appContainer.offsetWidth;
                    appContainer.classList.add('active');
                    
                    // Start KPI animations when the dashboard first appears
                    runKPICounters();
                }, 400); // Wait for fade out
            }, 1000);
        }
    });

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const pageViews = document.querySelectorAll('.page-view');
    const pageTitle = document.getElementById('page-title');
    const backButton = document.getElementById('back-button');
    
    let navHistory = [];

    const titles = {
        'dashboard-screen': 'Main Dashboard',
        'candidates-screen': 'Candidates',
        'jobs-screen': 'Jobs & Reports',
        'calendar-screen': 'Calendar',
        'pipeline-screen': 'Job Pipeline',
        'candidate-details-screen': 'Candidate Profile',
        'settings-screen': 'Settings'
    };

    const navigateTo = (targetId, isBack = false) => {
        const currentActive = document.querySelector('.page-view.active');
        const currentId = currentActive ? currentActive.id : null;

        if (!isBack && currentId && currentId !== targetId) {
            navHistory.push(currentId);
        }

        // Show/Hide Back Button
        if (targetId === 'dashboard-screen') {
            backButton.style.display = 'none';
            navHistory = []; // Reset history on dashboard
        } else {
            backButton.style.display = 'flex';
        }

        // Remove active from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Find and activate the corresponding nav item if it exists
        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        }

        // Hide all pages
        pageViews.forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });

        // Show target page
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.style.display = 'block';
            // Trigger reflow for animation
            void targetPage.offsetWidth;
            targetPage.classList.add('active');

            // Re-run counters if entering dashboard
            if (targetId === 'dashboard-screen') {
                runKPICounters();
            }
        }

        // Update title
        pageTitle.textContent = titles[targetId] || 'RecruitHub';
        
        // Ensure icons are rendered
        if (window.lucide) {
            lucide.createIcons();
        }
    };

    backButton.addEventListener('click', () => {
        if (navHistory.length > 0) {
            const previousPage = navHistory.pop();
            navigateTo(previousPage, true);
        } else {
            navigateTo('dashboard-screen');
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.getAttribute('data-target'));
        });
    });

    // --- Action Buttons Navigation ---
    const manageButtons = document.querySelectorAll('.btn-manage');
    manageButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent double triggering if we also bind to row
            navigateTo('pipeline-screen');
        });
    });

    const jobRows = document.querySelectorAll('.job-row');
    jobRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            navigateTo('pipeline-screen');
        });
    });

    // --- Candidate Cards Navigation ---
    const candidateCards = document.querySelectorAll('.candidate-card');
    candidateCards.forEach(card => {
        card.addEventListener('click', () => {
            navigateTo('candidate-details-screen');
        });
    });

    // --- Pipeline: Drag & Drop ---
    const kanbanBoard = document.querySelector('#pipeline-screen .kanban-board');
    let draggingCard = null;
    let dragOriginColumn = null;

    const getDragAfterElement = (column, y) => {
        const cards = [...column.querySelectorAll('.candidate-card:not(.is-dragging)')];
        return cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: -Infinity, element: null }).element;
    };

    const updateColumnCount = (col, animate) => {
        const countEl = col.querySelector('.col-count');
        if (!countEl) return;
        const count = col.querySelectorAll('.candidate-card').length;
        if (countEl.textContent !== String(count)) {
            countEl.textContent = count;
            if (animate) {
                countEl.classList.remove('is-changed');
                void countEl.offsetWidth;
                countEl.classList.add('is-changed');
                setTimeout(() => countEl.classList.remove('is-changed'), 600);
            }
        }
    };

    const initDraggableCard = (card) => {
        if (card.dataset.dragInit === '1') return;
        card.dataset.dragInit = '1';
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', (e) => {
            draggingCard = card;
            dragOriginColumn = card.closest('.kanban-column');
            card.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            try { e.dataTransfer.setData('text/plain', 'card'); } catch (_) {}
        });

        card.addEventListener('dragend', () => {
            // Defensive sweep — any card left in a transient state from a
            // previous interrupted drag gets cleaned up here.
            if (kanbanBoard) {
                kanbanBoard.querySelectorAll('.candidate-card.is-dragging')
                    .forEach(c => c.classList.remove('is-dragging'));
                kanbanBoard.querySelectorAll('.candidate-card.is-landing')
                    .forEach(c => c.classList.remove('is-landing'));
            }
            card.classList.remove('is-dragging');
            const landed = draggingCard;
            const finalCol = landed && landed.closest('.kanban-column');
            const moved = finalCol && dragOriginColumn && finalCol !== dragOriginColumn;

            if (landed && moved) {
                landed.classList.add('is-landing');
                setTimeout(() => landed.classList.remove('is-landing'), 600);
            }

            // Refresh counts on every column (animate the two affected ones)
            if (kanbanBoard) {
                kanbanBoard.querySelectorAll('.kanban-column').forEach(col => {
                    const isAffected = moved && (col === dragOriginColumn || col === finalCol);
                    updateColumnCount(col, isAffected);
                });
                kanbanBoard.querySelectorAll('.kanban-column.is-drop-target')
                    .forEach(c => c.classList.remove('is-drop-target'));
            }
            draggingCard = null;
            dragOriginColumn = null;
        });
    };

    if (kanbanBoard) {
        kanbanBoard.querySelectorAll('.candidate-card').forEach(initDraggableCard);

        kanbanBoard.querySelectorAll('.kanban-column').forEach(col => {
            col.addEventListener('dragenter', () => {
                if (draggingCard) col.classList.add('is-drop-target');
            });

            col.addEventListener('dragover', (e) => {
                if (!draggingCard) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                col.classList.add('is-drop-target');

                const after = getDragAfterElement(col, e.clientY);
                if (after == null) {
                    if (col.lastElementChild !== draggingCard) col.appendChild(draggingCard);
                } else if (after !== draggingCard.nextElementSibling) {
                    col.insertBefore(draggingCard, after);
                }
            });

            col.addEventListener('dragleave', (e) => {
                if (e.relatedTarget && col.contains(e.relatedTarget)) return;
                col.classList.remove('is-drop-target');
            });

            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('is-drop-target');
            });
        });
    }

    // Expose so the Add Candidate flow can wire up newly inserted cards
    window.__initDraggableCard = initDraggableCard;
    window.__updateColumnCount = updateColumnCount;

    // --- Create Job Panel ---
    const createJobPanel = document.getElementById('create-job-panel');
    const openCreateJobBtn = document.getElementById('open-create-job');
    if (createJobPanel && openCreateJobBtn) {
        openCreateJobBtn.addEventListener('click', () => openSidePanel(createJobPanel));

        // Single-select pill groups (employment type / mode / status)
        createJobPanel.querySelectorAll('.job-type-pills').forEach(group => {
            const pills = group.querySelectorAll('.job-type-pill');
            pills.forEach(pill => {
                pill.addEventListener('click', () => {
                    pills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                });
            });
        });

        // Skills chip input (mirrors Add Candidate pattern)
        const jobSkillInput = document.getElementById('job-skill-input');
        const jobSkillChips = document.getElementById('job-skill-chips');
        const addJobSkillChip = (raw) => {
            const text = raw.trim().replace(/,/g, '');
            if (!text) return;
            const key = text.toLowerCase();
            if ([...jobSkillChips.children].some(c => c.dataset.skill === key)) return;
            const chip = document.createElement('span');
            chip.className = 'skill-chip';
            chip.dataset.skill = key;
            const label = document.createTextNode(text);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', `Remove ${text}`);
            btn.textContent = '×';
            btn.addEventListener('click', () => chip.remove());
            chip.appendChild(label);
            chip.appendChild(btn);
            jobSkillChips.appendChild(chip);
        };
        if (jobSkillInput) {
            jobSkillInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addJobSkillChip(jobSkillInput.value);
                    jobSkillInput.value = '';
                } else if (e.key === 'Backspace' && !jobSkillInput.value) {
                    const last = jobSkillChips.lastElementChild;
                    if (last) last.remove();
                }
            });
            jobSkillInput.addEventListener('blur', () => {
                if (jobSkillInput.value.trim()) {
                    addJobSkillChip(jobSkillInput.value);
                    jobSkillInput.value = '';
                }
            });
        }

        // Submit — build a job row + inject into Active Jobs table
        const createJobForm = document.getElementById('create-job-form');
        const jobsTable = document.querySelector('#jobs-screen .active-jobs-section');

        const escapeHtml = (s) => {
            const div = document.createElement('div');
            div.textContent = s == null ? '' : String(s);
            return div.innerHTML;
        };

        // Department → icon + tinted color
        const deptStyles = {
            'Design':       { icon: 'user',           bg: 'rgba(0,240,255,0.12)',  color: 'var(--neon-cyan)' },
            'Engineering':  { icon: 'layers',         bg: 'rgba(58,134,255,0.12)', color: 'var(--neon-blue)' },
            'Product':      { icon: 'box',            bg: 'rgba(0,240,255,0.12)',  color: 'var(--neon-cyan)' },
            'Marketing':    { icon: 'megaphone',      bg: 'rgba(181,55,242,0.14)', color: 'var(--neon-purple)' },
            'Sales':        { icon: 'trending-up',    bg: 'rgba(0,255,136,0.12)',  color: 'var(--neon-green)' },
            'Operations':   { icon: 'settings',       bg: 'rgba(58,134,255,0.12)', color: 'var(--neon-blue)' },
            'Data':         { icon: 'flask-conical',  bg: 'rgba(0,255,136,0.12)',  color: 'var(--neon-green)' }
        };

        const buildJobRow = (data) => {
            const row = document.createElement('div');
            row.className = 'job-row is-new';
            const style = deptStyles[data.department] || deptStyles['Design'];
            row.innerHTML = `
                <div class="job-title-col">
                    <div class="job-icon" style="background: ${style.bg}; color: ${style.color};"><i data-lucide="${style.icon}"></i></div>
                    <div>
                        <h4>${escapeHtml(data.title)}</h4>
                        <p>${escapeHtml(data.department)}</p>
                    </div>
                </div>
                <div class="dept-col">${escapeHtml(data.department)}</div>
                <div class="applicants-col">
                    <span class="apps-count">0 Apps</span>
                </div>
                <div><span class="stage-badge stage-reviewing">Reviewing</span></div>
                <div><div class="progress-col"><div class="progress-fill fill-green" style="width: 8%;"></div></div></div>
                <div><button class="btn-manage">Manage</button></div>
            `;
            row.addEventListener('animationend', () => row.classList.remove('is-new'), { once: true });
            return row;
        };

        const resetJobForm = () => {
            createJobForm.reset();
            jobSkillChips.innerHTML = '';
            // Restore default-active pills
            createJobPanel.querySelectorAll('.job-type-pills').forEach(group => {
                const pills = group.querySelectorAll('.job-type-pill');
                pills.forEach(p => p.classList.remove('active'));
                if (pills[0]) pills[0].classList.add('active');
            });
        };

        createJobForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleEl = document.getElementById('job-title');
            const title = titleEl.value.trim();
            if (!title) { titleEl.focus(); return; }

            const data = {
                title,
                department: document.getElementById('job-dept').value,
                level: document.getElementById('job-level').value,
                location: document.getElementById('job-location').value.trim(),
                currency: document.getElementById('job-currency').value,
                salaryMin: document.getElementById('job-min').value,
                salaryMax: document.getElementById('job-max').value
            };

            if (jobsTable) {
                const row = buildJobRow(data);
                // Insert at top, after the table header
                const header = jobsTable.querySelector('.jobs-table-header');
                if (header && header.nextSibling) {
                    jobsTable.insertBefore(row, header.nextSibling);
                } else {
                    jobsTable.appendChild(row);
                }
                if (window.lucide) lucide.createIcons();
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            closeAllSidePanels();
            setTimeout(resetJobForm, 400);
        });
    }

    // --- Candidate Details Tabs (visual toggle) ---
    const cdTabs = document.querySelectorAll('#candidate-details-screen .cd-tab-btn');
    cdTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            cdTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // --- Side Panel Logic (shared overlay) ---
    const interviewItems = document.querySelectorAll('.dash-interview-item.clickable');
    const interviewPanel = document.getElementById('interview-detail-panel');
    const closePanelBtn = interviewPanel.querySelector('.close-panel');
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    document.body.appendChild(overlay);

    const closeAllSidePanels = () => {
        document.querySelectorAll('.side-panel.active').forEach(p => p.classList.remove('active'));
        overlay.classList.remove('active');
    };

    const openSidePanel = (panel) => {
        if (!panel) return;
        panel.classList.add('active');
        overlay.classList.add('active');
        if (window.lucide) lucide.createIcons();
    };

    interviewItems.forEach(item => {
        item.addEventListener('click', () => openSidePanel(interviewPanel));
    });

    // Calendar events + sidebar interview cards open the same panel
    document.querySelectorAll('#calendar-screen .cal-event.clickable').forEach(ev => {
        ev.addEventListener('click', (e) => {
            e.stopPropagation();
            openSidePanel(interviewPanel);
        });
    });
    document.querySelectorAll('#calendar-screen .interview-actions button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSidePanel(interviewPanel);
        });
    });

    closePanelBtn.addEventListener('click', closeAllSidePanels);
    overlay.addEventListener('click', closeAllSidePanels);

    // Generic close: any element with [data-close-panel] inside any side panel
    document.querySelectorAll('.side-panel [data-close-panel]').forEach(el => {
        el.addEventListener('click', closeAllSidePanels);
    });

    // --- Add Candidate Panel ---
    const addCandPanel = document.getElementById('add-candidate-panel');
    const openAddCandBtn = document.getElementById('open-add-candidate');
    const openAddCandBtnList = document.getElementById('open-add-candidate-from-list');
    if (addCandPanel && openAddCandBtn) {
        openAddCandBtn.addEventListener('click', () => openSidePanel(addCandPanel));
        if (openAddCandBtnList) {
            openAddCandBtnList.addEventListener('click', () => openSidePanel(addCandPanel));
        }

        // Stage pill single-select
        const stagePills = addCandPanel.querySelectorAll('.stage-pill');
        stagePills.forEach(pill => {
            pill.addEventListener('click', () => {
                stagePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });

        // Skills chip input
        const skillInput = document.getElementById('cand-skill-input');
        const skillChipsEl = document.getElementById('cand-skill-chips');
        const addSkillChip = (raw) => {
            const text = raw.trim().replace(/,/g, '');
            if (!text) return;
            const key = text.toLowerCase();
            if ([...skillChipsEl.children].some(c => c.dataset.skill === key)) return;
            const chip = document.createElement('span');
            chip.className = 'skill-chip';
            chip.dataset.skill = key;
            const label = document.createTextNode(text);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', `Remove ${text}`);
            btn.textContent = '×';
            btn.addEventListener('click', () => chip.remove());
            chip.appendChild(label);
            chip.appendChild(btn);
            skillChipsEl.appendChild(chip);
        };
        if (skillInput) {
            skillInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSkillChip(skillInput.value);
                    skillInput.value = '';
                } else if (e.key === 'Backspace' && !skillInput.value) {
                    const last = skillChipsEl.lastElementChild;
                    if (last) last.remove();
                }
            });
            skillInput.addEventListener('blur', () => {
                if (skillInput.value.trim()) {
                    addSkillChip(skillInput.value);
                    skillInput.value = '';
                }
            });
        }

        // Resume upload (click + drag/drop)
        const uploadZone = document.getElementById('cand-upload-zone');
        const resumeInput = document.getElementById('cand-resume');
        const uploadPrimary = uploadZone && uploadZone.querySelector('.upload-primary');
        const uploadSecondary = uploadZone && uploadZone.querySelector('.upload-secondary');
        const DEFAULT_PRIMARY = 'Drop file here or click to upload';
        const DEFAULT_SECONDARY = 'PDF, DOC, DOCX up to 10 MB';

        const reflectFile = () => {
            const file = resumeInput.files && resumeInput.files[0];
            if (file) {
                uploadZone.classList.add('has-file');
                uploadPrimary.textContent = file.name;
                uploadSecondary.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · click to replace`;
            } else {
                uploadZone.classList.remove('has-file');
                uploadPrimary.textContent = DEFAULT_PRIMARY;
                uploadSecondary.textContent = DEFAULT_SECONDARY;
            }
        };

        if (uploadZone && resumeInput) {
            resumeInput.addEventListener('change', reflectFile);

            ['dragenter', 'dragover'].forEach(ev => uploadZone.addEventListener(ev, (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            }));
            ['dragleave', 'drop'].forEach(ev => uploadZone.addEventListener(ev, (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
            }));
            uploadZone.addEventListener('drop', (e) => {
                if (e.dataTransfer.files.length) {
                    resumeInput.files = e.dataTransfer.files;
                    reflectFile();
                }
            });
        }

        // Form submit: validate → build card → inject into chosen kanban column
        const addCandForm = document.getElementById('add-candidate-form');
        const stageColMap = {
            applied:    '.col-applied',
            screening:  '.col-screening',
            interview:  '.col-interview',
            offer:      '.col-offer'
        };

        const escapeHtml = (s) => {
            const div = document.createElement('div');
            div.textContent = s == null ? '' : String(s);
            return div.innerHTML;
        };

        const buildCardTags = (skills, source, experience) => {
            const tags = [...skills];
            if (tags.length < 2 && source) tags.push(source);
            if (tags.length < 2 && experience) tags.push(`${experience} yrs`);
            return tags.slice(0, 2);
        };

        const buildCandidateCard = (data) => {
            const card = document.createElement('div');
            card.className = 'candidate-card is-new';

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
            const tags = buildCardTags(data.skills, data.source, data.experience);
            // Manual entries don't have an AI score yet; show a realistic placeholder
            const score = 78 + Math.floor(Math.random() * 17);

            card.innerHTML = `
                <div class="card-header">
                    <img src="${avatarUrl}" alt="${escapeHtml(data.name)}">
                    <i data-lucide="more-vertical"></i>
                </div>
                <div class="card-info">
                    <h5>${escapeHtml(data.name)}</h5>
                    <p>${escapeHtml(data.position || '—')}</p>
                </div>
                <div class="card-score">
                    <span class="score-label">Score</span>
                    <span class="score-val">${score}%</span>
                </div>
                <div class="card-tags">
                    ${tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <div class="card-footer-icons">
                        <i data-lucide="check-circle-2" class="check-icon"></i>
                        <i data-lucide="layout"></i>
                    </div>
                    <div class="card-footer-icons">
                        <i data-lucide="clock"></i>
                        <i data-lucide="calendar"></i>
                    </div>
                </div>
            `;

            card.addEventListener('animationend', () => card.classList.remove('is-new'), { once: true });
            return card;
        };

        const updateColCount = (col) => {
            const cards = col.querySelectorAll('.candidate-card');
            const countEl = col.querySelector('.col-count');
            if (countEl) countEl.textContent = cards.length;
        };

        const collectSkills = () =>
            [...skillChipsEl.children]
                .map(c => c.firstChild && c.firstChild.nodeValue ? c.firstChild.nodeValue.trim() : '')
                .filter(Boolean);

        const resetForm = () => {
            addCandForm.reset();
            skillChipsEl.innerHTML = '';
            stagePills.forEach(p => p.classList.remove('active'));
            const defaultStage = addCandPanel.querySelector('.stage-pill[data-stage="applied"]');
            if (defaultStage) defaultStage.classList.add('active');
            if (uploadZone) reflectFile();
            // Restore the prefilled position
            const positionEl = document.getElementById('cand-position');
            if (positionEl) positionEl.value = 'Senior UI/UX Designer';
        };

        addCandForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameEl = document.getElementById('cand-name');
            const emailEl = document.getElementById('cand-email');
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            if (!name) { nameEl.focus(); return; }
            if (!email) { emailEl.focus(); return; }

            const stageBtn = addCandPanel.querySelector('.stage-pill.active');
            const stage = stageBtn ? stageBtn.dataset.stage : 'applied';
            const colSelector = stageColMap[stage] || '.col-applied';
            const col = document.querySelector(`#pipeline-screen ${colSelector}`);
            if (!col) return;

            const data = {
                name,
                email,
                phone: document.getElementById('cand-phone').value.trim(),
                position: document.getElementById('cand-position').value.trim(),
                experience: document.getElementById('cand-experience').value.trim(),
                source: document.getElementById('cand-source').value,
                skills: collectSkills(),
                notes: document.getElementById('cand-notes').value.trim()
            };

            const card = buildCandidateCard(data);
            const firstCard = col.querySelector('.candidate-card');
            if (firstCard) col.insertBefore(card, firstCard);
            else col.appendChild(card);

            updateColCount(col);
            if (typeof window.__initDraggableCard === 'function') {
                window.__initDraggableCard(card);
            }
            if (window.lucide) lucide.createIcons();

            // Bring the chosen column into view (kanban scrolls horizontally)
            col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

            closeAllSidePanels();
            setTimeout(resetForm, 400);
        });
    }

    // --- Copy Meeting Link ---
    const copyLinkBtn = document.getElementById('det-copy-link-btn');
    const meetingUrlEl = document.getElementById('det-meeting-url');
    let copyResetTimer = null;

    if (copyLinkBtn && meetingUrlEl) {
        copyLinkBtn.addEventListener('click', async () => {
            const url = meetingUrlEl.textContent.trim();
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }

                copyLinkBtn.classList.add('copied');
                copyLinkBtn.setAttribute('title', 'Copied!');
                clearTimeout(copyResetTimer);
                copyResetTimer = setTimeout(() => {
                    copyLinkBtn.classList.remove('copied');
                    copyLinkBtn.setAttribute('title', 'Copy link');
                }, 1600);
            } catch (err) {
                console.warn('Copy failed', err);
            }
        });
    }

    // --- KPI Counter Animation (Premium Odometer Style) ---
    const initKPICounters = () => {
        const kpiValues = document.querySelectorAll('.kpi-value');
        
        kpiValues.forEach(el => {
            if (el.dataset.initialized) return;
            
            const originalValue = el.textContent.trim();
            el.dataset.value = originalValue;
            el.innerHTML = '';
            
            const parts = originalValue.split('');
            parts.forEach((char) => {
                if (/\d/.test(char)) {
                    const container = document.createElement('div');
                    container.className = 'digit-container';
                    
                    const strip = document.createElement('div');
                    strip.className = 'digit-strip';
                    strip.dataset.digit = char;
                    
                    for (let i = 0; i <= 9; i++) {
                        const span = document.createElement('span');
                        span.textContent = i;
                        strip.appendChild(span);
                    }
                    
                    container.appendChild(strip);
                    el.appendChild(container);
                } else {
                    const sep = document.createElement('span');
                    sep.className = 'kpi-separator';
                    sep.textContent = char;
                    el.appendChild(sep);
                }
            });
            el.dataset.initialized = 'true';
        });
    };

    const runKPICounters = () => {
        const kpiValues = document.querySelectorAll('.kpi-value');
        kpiValues.forEach(el => {
            const strips = el.querySelectorAll('.digit-strip');
            strips.forEach((strip, index) => {
                // Reset first
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0)';
                
                // Trigger reflow
                void strip.offsetWidth;
                
                // Animate
                strip.style.transition = 'transform 2s cubic-bezier(0.15, 0.9, 0.3, 1)';
                const targetDigit = parseInt(strip.dataset.digit);
                setTimeout(() => {
                    strip.style.transform = `translateY(-${targetDigit * 10}%)`;
                }, 100 + (index * 80)); // Slightly faster staggered delay
            });
        });
    };

    // Run initialization
    initKPICounters();

    // Expose navigateTo globally so inline onclick handlers work
    window.navigateTo = navigateTo;
});
