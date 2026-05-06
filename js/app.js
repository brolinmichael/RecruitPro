document.addEventListener('DOMContentLoaded', () => {
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

    closePanelBtn.addEventListener('click', closeAllSidePanels);
    overlay.addEventListener('click', closeAllSidePanels);

    // Generic close: any element with [data-close-panel] inside any side panel
    document.querySelectorAll('.side-panel [data-close-panel]').forEach(el => {
        el.addEventListener('click', closeAllSidePanels);
    });

    // --- Add Candidate Panel ---
    const addCandPanel = document.getElementById('add-candidate-panel');
    const openAddCandBtn = document.getElementById('open-add-candidate');
    if (addCandPanel && openAddCandBtn) {
        openAddCandBtn.addEventListener('click', () => openSidePanel(addCandPanel));

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
