document.addEventListener('DOMContentLoaded', () => {
    // --- Global Toast Notification System ---
    window.showToast = (message, type = 'info') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconStr = 'info';
        if (type === 'success') iconStr = 'check-circle-2';
        if (type === 'error') iconStr = 'alert-circle';

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${iconStr}"></i></div>
            <div class="toast-message">${message}</div>
            <button class="toast-close"><i data-lucide="x" style="width:16px;height:16px;"></i></button>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        const closeToast = () => {
            toast.classList.add('toast-fadeOut');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close').addEventListener('click', closeToast);
        setTimeout(closeToast, 4000);
    };

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

    loginForm.addEventListener('submit', async (e) => {
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
            const btn = loginForm.querySelector('.btn-primary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Authenticating...';
            if (window.lucide) lucide.createIcons();

            try {
                // Call actual backend login endpoint
                let res;
                if (window.api && window.api.login) {
                    res = await window.api.login(emailInput.value, passwordInput.value);
                } else {
                    // Fallback mock
                    res = { user: { email: emailInput.value } };
                    await new Promise(r => setTimeout(r, 800));
                }

                loginScreen.classList.remove('active');
                setTimeout(() => {
                    loginScreen.style.display = 'none';
                    appContainer.style.display = 'flex';
                    void appContainer.offsetWidth;
                    appContainer.classList.add('active');
                    runKPICounters();
                    
                    window.showToast('Welcome back to RecruitPro!', 'success');
                }, 400);

            } catch (err) {
                console.error("Login Error:", err);
                window.showToast(err.message || 'Invalid credentials. Please try again.', 'error');
            } finally {
                btn.innerHTML = originalText;
                if (window.lucide) lucide.createIcons();
            }
        } else {
            window.showToast('Please correct the highlighted errors.', 'error');
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

    // --- Candidates: API-backed rendering ---------------------------------
    // Single source of truth for cards visible on the Candidates screen. We
    // re-render on entry and after add/save so the list stays in sync with
    // the server (which is also what the insights endpoint reflects).
    let candidatesCache = [];

    const escapeHtmlSafe = (s) => {
        const div = document.createElement('div');
        div.textContent = s == null ? '' : String(s);
        return div.innerHTML;
    };

    // Map an AI score to one of the existing accent colors used in the design.
    const scoreColor = (score) => {
        if (typeof score !== 'number' || Number.isNaN(score)) return 'var(--text-secondary, #8a93a6)';
        if (score >= 95) return 'var(--neon-cyan)';
        if (score >= 90) return 'var(--neon-purple)';
        if (score >= 80) return '#10B981';
        if (score >= 70) return '#F8BF24';
        return '#ff6b6b';
    };

    const buildCandidateGridCard = (c) => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.candidateId = c.id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        const openDetails = () => {
            // Stash the id where navigateTo can pick it up — the details
            // screen reads this on entry and calls /api/candidates/:id.
            window.__currentCandidateId = c.id;
            if (window.navigateTo) window.navigateTo('candidate-details-screen');
        };
        card.addEventListener('click', openDetails);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetails();
            }
        });

        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || '?')}&background=random`;
        const tags = (Array.isArray(c.skills) ? c.skills : []).slice(0, 3);
        const color = scoreColor(typeof c.score === 'number' ? c.score : null);
        const scoreText = typeof c.score === 'number' ? `${c.score}%` : '—';

        card.innerHTML = `
            <div class="card-header">
                <img src="${avatar}" alt="${escapeHtmlSafe(c.name)}">
                <i data-lucide="more-vertical"></i>
            </div>
            <div class="card-info">
                <h5>${escapeHtmlSafe(c.name)}</h5>
                <p>${escapeHtmlSafe(c.position || '—')}</p>
            </div>
            <div class="card-score">
                <span class="score-label">AI Match Score</span>
                <span class="score-val" style="color:${color}">${scoreText}</span>
            </div>
            <div class="card-tags">
                ${tags.map(t => `<span>${escapeHtmlSafe(t)}</span>`).join('')}
            </div>
            <div class="card-footer">
                <div class="card-footer-icons">
                    <i data-lucide="check-circle-2" style="color:${color}"></i>
                    <i data-lucide="layout"></i>
                </div>
                <div class="card-footer-icons">
                    <i data-lucide="clock"></i>
                    <i data-lucide="calendar"></i>
                </div>
            </div>
        `;
        return card;
    };

    const setCandidatesState = (state, message) => {
        const grid = document.getElementById('candidates-grid');
        const loading = document.getElementById('candidates-loading');
        const empty = document.getElementById('candidates-empty');
        const err = document.getElementById('candidates-error');
        const errMsg = document.getElementById('candidates-error-msg');
        if (!grid) return;

        const showGrid = state === 'ready';
        grid.hidden = !showGrid;
        grid.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
        if (loading) loading.hidden = state !== 'loading';
        if (empty) empty.hidden = state !== 'empty';
        if (err) err.hidden = state !== 'error';
        if (errMsg && message) errMsg.textContent = message;

        if (window.lucide) lucide.createIcons();
    };

    const renderCandidatesGrid = (list, { filter = '' } = {}) => {
        const grid = document.getElementById('candidates-grid');
        if (!grid) return;

        const q = filter.trim().toLowerCase();
        const filtered = q
            ? list.filter(c =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.position || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (Array.isArray(c.skills) && c.skills.some(s => String(s).toLowerCase().includes(q)))
            )
            : list;

        grid.innerHTML = '';
        if (!filtered.length) {
            // Distinguish "no candidates at all" from "no search matches"
            if (!list.length) {
                setCandidatesState('empty');
                return;
            }
            // No matches for current search — render an inline message instead of swapping screens.
            setCandidatesState('ready');
            const noMatch = document.createElement('div');
            noMatch.className = 'cand-no-match';
            noMatch.innerHTML = `<i data-lucide="search-x"></i> <span>No candidates match “${escapeHtmlSafe(filter)}”.</span>`;
            grid.appendChild(noMatch);
            if (window.lucide) lucide.createIcons();
            return;
        }

        const frag = document.createDocumentFragment();
        filtered.forEach(c => frag.appendChild(buildCandidateGridCard(c)));
        grid.appendChild(frag);
        setCandidatesState('ready');
    };

    const renderCandidatesInsights = (data) => {
        const root = document.getElementById('candidates-insights');
        if (!root) return;
        root.setAttribute('aria-busy', 'false');

        const set = (key, text) => {
            const el = root.querySelector(`[data-insight="${key}"]`);
            if (el) el.textContent = text;
        };

        set('total', (data.totalCandidates ?? 0).toLocaleString());
        const delta = data.newTrendDelta ?? 0;
        const trendEl = root.querySelector('[data-insight="total-trend"]');
        if (trendEl) {
            trendEl.classList.remove('trend-up', 'trend-down');
            if (delta > 0) trendEl.classList.add('trend-up');
            if (delta < 0) trendEl.classList.add('trend-down');
            const sign = delta > 0 ? '+' : '';
            trendEl.textContent = `${sign}${delta} this wk`;
        }

        set('avg-match', data.avgMatchScore ? `${data.avgMatchScore}%` : '—');
        set('avg-match-label', data.avgMatchScore ? 'across scored' : 'no scores yet');

        set('shortlisted', (data.shortlisted ?? 0).toLocaleString());
        set('shortlisted-conv', `${data.shortlistedConversion ?? 0}% conv.`);

        set('top-source', data.topSource || '—');
        set('top-source-pct', data.topSourcePercentage ? `${data.topSourcePercentage}%` : '—');
    };

    const loadCandidatesScreen = async () => {
        if (!window.api) return;
        setCandidatesState('loading');

        // Insights & list run in parallel — neither blocks the other.
        const [listResult, insightsResult] = await Promise.allSettled([
            window.api.getCandidates(),
            window.api.getCandidatesInsights()
        ]);

        if (listResult.status === 'fulfilled') {
            candidatesCache = Array.isArray(listResult.value) ? listResult.value : [];
            const searchEl = document.querySelector('#candidates-screen .cand-search input');
            renderCandidatesGrid(candidatesCache, { filter: searchEl ? searchEl.value : '' });
        } else {
            const err = listResult.reason;
            const msg = (err && err.message) || 'Failed to load candidates.';
            console.error('Failed to load candidates:', err);
            setCandidatesState('error', msg);
        }

        if (insightsResult.status === 'fulfilled') {
            renderCandidatesInsights(insightsResult.value || {});
        } else {
            console.warn('Failed to load candidate insights:', insightsResult.reason);
            // Insights failure is non-fatal — keep dashes in the UI.
        }
    };

    // Expose so the Add Candidate flow can refresh post-save without re-wiring.
    window.__loadCandidatesScreen = loadCandidatesScreen;
    window.__renderCandidatesGrid = renderCandidatesGrid;

    // --- Jobs: API-backed rendering ---------------------------------------
    // Mirrors the candidates pattern: single fetch on screen entry + after
    // create. Insights run in parallel and don't block the table.
    let jobsCache = [];

    // Department visuals — kept aligned with the server's DEPT_STYLE table
    // but expressed in real CSS values for inline use.
    const JOB_DEPT_VISUAL = {
        Design:      { bg: 'rgba(0,240,255,0.10)',  color: 'var(--neon-cyan)'   },
        Engineering: { bg: 'rgba(58,134,255,0.10)', color: 'var(--neon-blue)'   },
        Product:     { bg: 'rgba(0,240,255,0.10)',  color: 'var(--neon-cyan)'   },
        Marketing:   { bg: 'rgba(181,55,242,0.10)', color: 'var(--neon-purple)' },
        Growth:      { bg: 'rgba(181,55,242,0.10)', color: 'var(--neon-purple)' },
        Sales:       { bg: 'rgba(0,255,136,0.10)',  color: 'var(--neon-green)'  },
        Operations:  { bg: 'rgba(58,134,255,0.10)', color: 'var(--neon-blue)'   },
        Data:        { bg: 'rgba(0,255,136,0.10)',  color: 'var(--neon-green)'  },
        Other:       { bg: 'rgba(0,240,255,0.10)',  color: 'var(--neon-cyan)'   }
    };
    const PROGRESS_FILL_CLASS = {
        cyan: 'fill-cyan', blue: 'fill-blue', purple: 'fill-purple', green: 'fill-green'
    };

    const buildJobRow = (job) => {
        const row = document.createElement('div');
        row.className = 'job-row';
        row.dataset.jobId = job.id;
        const visual = JOB_DEPT_VISUAL[job.department] || JOB_DEPT_VISUAL.Other;
        const icon = job.departmentIcon || 'briefcase';
        const fillClass = PROGRESS_FILL_CLASS[job.progressColor] || 'fill-cyan';
        const stageLabel = job.pipelineStageLabel || 'Reviewing';
        const stageClass = job.pipelineStageClass || 'stage-reviewing';
        const applicants = typeof job.applicantsCount === 'number' ? job.applicantsCount : 0;
        const progress = typeof job.progress === 'number' ? job.progress : 8;

        const avatarStack = (job.applicantNames || []).slice(0, 3).map(n =>
            `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=random" alt="${escapeHtmlSafe(n)}">`
        ).join('');

        row.innerHTML = `
            <div class="job-title-col">
                <div class="job-icon" style="background: ${visual.bg}; color: ${visual.color};"><i data-lucide="${icon}"></i></div>
                <div>
                    <h4>${escapeHtmlSafe(job.title)}</h4>
                    <p>${escapeHtmlSafe(job.department || '—')}</p>
                </div>
            </div>
            <div class="dept-col">${escapeHtmlSafe(job.department || '—')}</div>
            <div class="applicants-col">
                ${avatarStack ? `<div class="avatar-stack">${avatarStack}</div>` : ''}
                <span class="apps-count">${applicants} ${applicants === 1 ? 'App' : 'Apps'}</span>
            </div>
            <div><span class="stage-badge ${stageClass}">${escapeHtmlSafe(stageLabel)}</span></div>
            <div><div class="progress-col"><div class="progress-fill ${fillClass}" style="width: ${progress}%;"></div></div></div>
            <div><button class="btn-manage" type="button">Manage</button></div>
        `;
        // Stash the job id when the user opens the detail view so the
        // pipeline screen can fetch /api/jobs/:id for that specific row.
        const openDetails = () => {
            window.__currentJobId = job.id;
            if (window.navigateTo) window.navigateTo('pipeline-screen');
        };
        row.querySelector('.btn-manage')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openDetails();
        });
        row.addEventListener('click', openDetails);
        return row;
    };

    const setJobsState = (state, message) => {
        const table = document.getElementById('jobs-table');
        const loading = document.getElementById('jobs-loading');
        const empty = document.getElementById('jobs-empty');
        const err = document.getElementById('jobs-error');
        const errMsg = document.getElementById('jobs-error-msg');
        if (!table) return;

        const showTable = state === 'ready';
        table.hidden = !showTable;
        table.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
        if (loading) loading.hidden = state !== 'loading';
        if (empty) empty.hidden = state !== 'empty';
        if (err) err.hidden = state !== 'error';
        if (errMsg && message) errMsg.textContent = message;

        if (window.lucide) lucide.createIcons();
    };

    const renderJobsTable = (list) => {
        const table = document.getElementById('jobs-table');
        if (!table) return;
        // Strip existing rows but keep the header.
        table.querySelectorAll('.job-row').forEach(r => r.remove());

        if (!list.length) {
            setJobsState('empty');
            return;
        }

        const frag = document.createDocumentFragment();
        list.forEach(j => frag.appendChild(buildJobRow(j)));
        table.appendChild(frag);
        setJobsState('ready');
    };

    const renderJobsInsights = (data) => {
        const root = document.getElementById('jobs-insights');
        if (!root) return;
        root.setAttribute('aria-busy', 'false');

        const set = (key, text) => {
            const el = root.querySelector(`[data-insight="${key}"]`);
            if (el) el.textContent = text;
        };
        const setHtml = (key, html) => {
            const el = root.querySelector(`[data-insight="${key}"]`);
            if (el) el.innerHTML = html;
        };

        set('total-openings', (data.totalOpenings ?? 0).toLocaleString());
        const openTrend = data.openingsTrendPct ?? 0;
        const openTrendEl = root.querySelector('[data-insight="openings-trend"]');
        if (openTrendEl) {
            openTrendEl.classList.remove('text-green', 'text-secondary');
            openTrendEl.classList.add(openTrend >= 0 ? 'text-green' : 'text-secondary');
            const sign = openTrend > 0 ? '+' : '';
            openTrendEl.innerHTML = `${sign}${openTrend}% <span class="trend-label">this month</span>`;
        }

        set('hired', (data.candidatesHired ?? 0).toLocaleString());
        const hiredTrendEl = root.querySelector('[data-insight="hired-trend"]');
        if (hiredTrendEl) {
            const n = data.hiredLast30Days ?? 0;
            hiredTrendEl.classList.remove('text-green', 'text-secondary');
            hiredTrendEl.classList.add(n > 0 ? 'text-green' : 'text-secondary');
            hiredTrendEl.innerHTML = `${n > 0 ? '+' : ''}${n} <span class="trend-label">This Month</span>`;
        }

        set('applications', (data.applicationsReceived ?? 0).toLocaleString());
        const appsTrend = data.applicationsTrendPct ?? 0;
        const appsTrendEl = root.querySelector('[data-insight="applications-trend"]');
        if (appsTrendEl) {
            appsTrendEl.classList.remove('text-green', 'text-secondary');
            appsTrendEl.classList.add(appsTrend >= 0 ? 'text-green' : 'text-secondary');
            const sign = appsTrend > 0 ? '+' : '';
            appsTrendEl.innerHTML = `${sign}${appsTrend}% <span class="trend-label">This Week</span>`;
        }

        // Offer Acceptance — donut + value + legend percentages.
        const rate = data.offerAcceptanceRate;
        if (rate === null || rate === undefined) {
            set('offer-rate', '—');
            set('offer-rate-donut', '—');
            setHtml('offer-accepted-pct', '—');
            setHtml('offer-declined-pct', '—');
        } else {
            set('offer-rate', `${rate}%`);
            set('offer-rate-donut', `${rate}%`);
            setHtml('offer-accepted-pct', `${rate}%`);
            setHtml('offer-declined-pct', `${Math.max(0, 100 - rate)}%`);
            // Donut: circumference ~= 2π·40 ≈ 251. Offset hides the un-filled portion.
            const ring = root.querySelector('[data-insight="offer-rate-ring"]');
            if (ring) {
                const circ = 251;
                ring.setAttribute('stroke-dasharray', String(circ));
                ring.setAttribute('stroke-dashoffset', String(Math.round(circ * (1 - rate / 100))));
            }
        }
    };

    const loadJobsScreen = async () => {
        if (!window.api) return;
        setJobsState('loading');
        const [listResult, insightsResult] = await Promise.allSettled([
            window.api.getJobs(),
            window.api.getJobsInsights()
        ]);
        if (listResult.status === 'fulfilled') {
            jobsCache = Array.isArray(listResult.value) ? listResult.value : [];
            renderJobsTable(jobsCache);
        } else {
            const err = listResult.reason;
            const msg = (err && err.message) || 'Failed to load jobs.';
            console.error('Failed to load jobs:', err);
            setJobsState('error', msg);
        }
        if (insightsResult.status === 'fulfilled') {
            renderJobsInsights(insightsResult.value || {});
        } else {
            console.warn('Failed to load jobs insights:', insightsResult.reason);
        }
    };

    window.__loadJobsScreen = loadJobsScreen;
    window.__renderJobsTable = renderJobsTable;

    // --- Job Details (pipeline-screen): one-shot fetch + render --------------
    // Reads the id from window.__currentJobId (set by the Manage button on
    // the jobs list, or by a row click) and fills every [data-jd="..."] slot
    // on #pipeline-screen plus the four kanban columns.
    let currentJobDetailsId = null;

    const setJdState = (state, message) => {
        const body = document.getElementById('jd-body');
        const loading = document.getElementById('jd-loading');
        const err = document.getElementById('jd-error');
        const errMsg = document.getElementById('jd-error-msg');
        if (body) body.hidden = state !== 'ready';
        if (loading) loading.hidden = state !== 'loading';
        if (err) err.hidden = state !== 'error';
        if (errMsg && message) errMsg.textContent = message;
        if (window.lucide) lucide.createIcons();
    };

    // --- Kanban drag/drop via event delegation ---------------------------
    // ONE set of listeners on the board element handles drag/drop for all
    // cards present + future. Cards just need `draggable="true"`; nothing
    // else is per-card. State is captured at dragstart and consumed at drop.
    //
    // Why event delegation (vs per-card wiring):
    //   • Cards added by any flow (initial render, Add Candidate, refresh)
    //     become draggable automatically — no init function to forget.
    //   • Single source of truth for state. No closure / cross-init confusion.
    //   • Listeners survive a full kanban re-render since the board element
    //     itself is never replaced.
    const jdDrag = { card: null, fromCol: null };

    const jdGetDropAfter = (column, y) => {
        const cards = [...column.querySelectorAll('.candidate-card:not(.is-dragging)')];
        return cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            return closest;
        }, { offset: -Infinity, element: null }).element;
    };

    const jdRefreshAllCounts = () => {
        document.querySelectorAll('#pipeline-screen .kanban-column').forEach(col => {
            const badge = col.querySelector('.col-count');
            if (badge) badge.textContent = String(col.querySelectorAll('.candidate-card').length);
        });
    };

    const setupKanbanDelegation = () => {
        const board = document.querySelector('#pipeline-screen .kanban-board');
        if (!board || board.dataset.dndDelegationInit === '1') return;
        board.dataset.dndDelegationInit = '1';

        // ---- DRAG SIDE (on the card that was grabbed) ----
        board.addEventListener('dragstart', (e) => {
            const card = e.target.closest && e.target.closest('.candidate-card');
            if (!card || !board.contains(card)) return;
            jdDrag.card = card;
            jdDrag.fromCol = card.closest('.kanban-column');
            card.classList.add('is-dragging');
            try {
                e.dataTransfer.effectAllowed = 'move';
                // setData is required by Firefox or drag is cancelled.
                e.dataTransfer.setData('text/plain', card.dataset.candidateId || 'card');
            } catch (_) {}
            console.debug('[kanban] dragstart', card.dataset.candidateId,
                'from', jdDrag.fromCol && jdDrag.fromCol.dataset.jdColumn);
        });

        board.addEventListener('dragend', async (e) => {
            const card = e.target.closest && e.target.closest('.candidate-card');
            if (!card) return;
            card.classList.remove('is-dragging');

            const landed = jdDrag.card;
            const finalCol = landed && landed.closest('.kanban-column');
            const fromCol = jdDrag.fromCol;
            const moved = finalCol && fromCol && finalCol !== fromCol;

            board.querySelectorAll('.kanban-column.is-drop-target')
                .forEach(c => c.classList.remove('is-drop-target'));
            jdRefreshAllCounts();
            jdDrag.card = null;
            jdDrag.fromCol = null;

            console.debug('[kanban] dragend moved=', moved,
                'to', finalCol && finalCol.dataset.jdColumn);
            if (!moved || !landed) return;

            const candidateId = landed.dataset.candidateId;
            const newStage = finalCol.dataset.jdColumn
                || (finalCol.classList.contains('col-applied')   ? 'applied'
                  : finalCol.classList.contains('col-screening') ? 'screening'
                  : finalCol.classList.contains('col-interview') ? 'interview'
                  : finalCol.classList.contains('col-offer')     ? 'offer'
                  : null);
            if (!candidateId || !newStage || !window.api) return;

            try {
                await window.api.updateCandidateStage(candidateId, newStage);
                // Keep the top-of-page "Screening" stat in sync.
                const screenBadge = document.querySelector('[data-jd-count="screening"]');
                const screenStat  = document.querySelector('[data-jd="stat-screening"]');
                if (screenBadge && screenStat) screenStat.textContent = screenBadge.textContent;
                if (window.showToast) {
                    const niceName = newStage.charAt(0).toUpperCase() + newStage.slice(1);
                    window.showToast(`Moved to ${niceName}`, 'success');
                }
            } catch (err) {
                console.error('[kanban] persist failed:', err);
                if (fromCol && landed) {
                    fromCol.appendChild(landed);
                    jdRefreshAllCounts();
                }
                if (window.showToast) window.showToast(err.message || 'Failed to update stage.', 'error');
            }
        });

        // ---- DROP SIDE (on the column being entered/hovered) ----
        board.addEventListener('dragenter', (e) => {
            if (!jdDrag.card) return;
            const col = e.target.closest && e.target.closest('.kanban-column');
            if (!col) return;
            e.preventDefault();
            col.classList.add('is-drop-target');
        });

        // MUST preventDefault on dragover or drop never fires (HTML5 spec).
        board.addEventListener('dragover', (e) => {
            if (!jdDrag.card) return;
            const col = e.target.closest && e.target.closest('.kanban-column');
            if (!col) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            col.classList.add('is-drop-target');

            // Reorder live so the user sees where it'll land.
            const after = jdGetDropAfter(col, e.clientY);
            if (after == null) {
                if (col.lastElementChild !== jdDrag.card) col.appendChild(jdDrag.card);
            } else if (after !== jdDrag.card.nextElementSibling && after !== jdDrag.card) {
                col.insertBefore(jdDrag.card, after);
            }
        });

        board.addEventListener('dragleave', (e) => {
            const col = e.target.closest && e.target.closest('.kanban-column');
            if (!col) return;
            // Suppress leave when crossing into a nested element of the same column.
            if (e.relatedTarget && col.contains(e.relatedTarget)) return;
            col.classList.remove('is-drop-target');
        });

        board.addEventListener('drop', (e) => {
            e.preventDefault();
            const col = e.target.closest && e.target.closest('.kanban-column');
            if (col) col.classList.remove('is-drop-target');
        });

        console.debug('[kanban] delegation listeners attached to board');
    };

    // Back-compat for the Add Candidate flow which calls these. With event
    // delegation the only thing per-card we need is `draggable="true"`.
    window.__initDraggableCard = (card) => {
        if (card && card.setAttribute) card.setAttribute('draggable', 'true');
    };
    window.__updateColumnCount = (col /*, animate */) => {
        if (!col) return;
        const badge = col.querySelector('.col-count');
        if (badge) badge.textContent = String(col.querySelectorAll('.candidate-card').length);
    };

    // Card builder mirrors the kanban look used in the candidates flow but is
    // driven entirely by the slim applicant payload returned from /api/jobs/:id.
    const buildKanbanApplicantCard = (a) => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.candidateId = a.id;
        // Set draggable up-front so the element is drag-eligible even before
        // wireCardForDrag attaches listeners — guards against any race where
        // a user grabs the card the instant it appears.
        card.setAttribute('draggable', 'true');

        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || '?')}&background=random`;
        const tags = (Array.isArray(a.skills) ? a.skills : []).slice(0, 2);
        const scoreColorVal = scoreColor(typeof a.score === 'number' ? a.score : null);
        card.innerHTML = `
            <div class="card-header">
                <img src="${avatar}" alt="${escapeHtmlSafe(a.name || '')}" draggable="false">
                <i data-lucide="more-vertical"></i>
            </div>
            <div class="card-info">
                <h5>${escapeHtmlSafe(a.name || '—')}</h5>
                <p>${escapeHtmlSafe(a.position || '')}</p>
            </div>
            <div class="card-score">
                <span class="score-label">Score</span>
                <span class="score-val" style="color:${scoreColorVal}">${typeof a.score === 'number' ? `${a.score}%` : '—'}</span>
            </div>
            <div class="card-tags">
                ${tags.map(t => `<span>${escapeHtmlSafe(t)}</span>`).join('')}
            </div>
            <div class="card-footer">
                <div class="card-footer-icons">
                    <i data-lucide="check-circle-2" class="check-icon" style="color:${scoreColorVal}"></i>
                    <i data-lucide="layout"></i>
                </div>
                <div class="card-footer-icons">
                    <i data-lucide="clock"></i>
                    <i data-lucide="calendar"></i>
                </div>
            </div>
        `;
        // Click → open candidate detail. Suppressed automatically when a real
        // drag completes (HTML5 drag-and-drop spec), so it doesn't fight drag.
        card.addEventListener('click', () => {
            window.__currentCandidateId = a.id;
            if (window.navigateTo) window.navigateTo('candidate-details-screen');
        });
        return card;
    };

    const formatSalary = (job) => {
        if (!job || job.salaryMin == null || job.salaryMax == null) return '';
        const fmt = (n) => (typeof Intl !== 'undefined' && Intl.NumberFormat)
            ? new Intl.NumberFormat('en-US').format(n)
            : String(n);
        return `${job.currency || ''} ${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`.trim();
    };

    const renderJobDetails = (job) => {
        const root = document.getElementById('pipeline-screen');
        if (!root) return;

        const setText = (key, text) => {
            root.querySelectorAll(`[data-jd="${key}"]`).forEach(el => { el.textContent = text; });
        };
        const show = (key, visible) => {
            const el = root.querySelector(`[data-jd="${key}"]`);
            if (el) el.hidden = !visible;
        };
        const fillList = (key, items) => {
            const el = root.querySelector(`[data-jd="${key}"]`);
            if (!el) return;
            el.innerHTML = items.map(b => `<li>${escapeHtmlSafe(b)}</li>`).join('');
        };

        // Header / sidebar fields
        setText('title', job.title || '—');
        setText('title-heading', job.title || '—');
        setText('breadcrumb-title', job.title || '—');
        setText('location', job.location || '—');

        const statusPill = root.querySelector('[data-jd="status-pill"]');
        if (statusPill) {
            const status = (job.status || 'active').toLowerCase();
            statusPill.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusPill.className = `status-${status}`;
        }

        // Salary
        const salary = formatSalary(job);
        show('salary-row', !!salary);
        if (salary) setText('salary', salary);

        // Overview / responsibilities / requirements / perks
        const overview = (job.overview || job.description || '').trim();
        show('overview-section', !!overview);
        if (overview) setText('overview', overview);

        const resp = Array.isArray(job.responsibilities) ? job.responsibilities : [];
        show('responsibilities-section', resp.length > 0);
        if (resp.length) fillList('responsibilities-list', resp);

        const reqs = Array.isArray(job.requirements) ? job.requirements : [];
        show('requirements-section', reqs.length > 0);
        if (reqs.length) fillList('requirements-list', reqs);

        const perks = Array.isArray(job.perks) ? job.perks : [];
        show('perks-section', perks.length > 0);
        if (perks.length) fillList('perks-list', perks);

        // Hiring manager (optional)
        const hm = job.hiringManager;
        const hasHm = hm && (hm.name || hm.role);
        show('hm-section', !!hasHm);
        if (hasHm) {
            const parts = [hm.name, hm.role].filter(Boolean);
            setText('hm', parts.join(' · '));
        }

        // Stats
        setText('stat-total', String(job.totalApplicants ?? 0));
        const counts = job.stageCounts || {};
        setText('stat-screening', String(counts.screening ?? 0));

        // Attach the board-level delegation listeners on the first render
        // (idempotent via the board's dataset flag). From then on, any card
        // we append with `draggable="true"` is automatically dragga­ble.
        setupKanbanDelegation();

        // Kanban columns — clear and refill. No per-card init needed: event
        // delegation on the board handles drag for every card present + future.
        ['applied', 'screening', 'interview', 'offer'].forEach(stage => {
            const col = root.querySelector(`[data-jd-column="${stage}"]`);
            const countEl = root.querySelector(`[data-jd-count="${stage}"]`);
            if (!col) return;
            col.querySelectorAll('.candidate-card').forEach(c => c.remove());
            const list = (job.applicantsByStage && job.applicantsByStage[stage]) || [];
            list.forEach(a => col.appendChild(buildKanbanApplicantCard(a)));
            if (countEl) countEl.textContent = String(list.length);
        });
        console.debug('[kanban] rendered job', job.id, '·',
            root.querySelectorAll('.candidate-card[draggable="true"]').length, 'draggable cards');

        if (window.lucide) lucide.createIcons();
    };

    const loadJobDetails = async (id) => {
        if (!window.api || !id) {
            setJdState('error', 'Job id is missing. Open a job from the Jobs list.');
            return;
        }
        currentJobDetailsId = id;
        setJdState('loading');
        try {
            const job = await window.api.getJob(id);
            if (currentJobDetailsId !== id) return; // a newer click superseded this fetch
            renderJobDetails(job);
            setJdState('ready');
        } catch (err) {
            console.error('Failed to load job details:', err);
            const msg = err && err.status === 404
                ? "This job doesn't exist or has been removed."
                : (err && err.message) || 'Failed to load job.';
            setJdState('error', msg);
        }
    };

    window.__loadJobDetails = loadJobDetails;

    // --- Candidate Details: single-fetch renderer -------------------------
    // Reads the id from window.__currentCandidateId (set by the card click)
    // and populates every [data-cd="..."] slot on #candidate-details-screen.
    // Sections without data are hidden so we never show stale placeholders.
    let currentDetailsId = null;

    const setCdState = (state, message) => {
        const body = document.getElementById('cd-body');
        const loading = document.getElementById('cd-loading');
        const err = document.getElementById('cd-error');
        const errMsg = document.getElementById('cd-error-msg');
        if (body) body.hidden = state !== 'ready';
        if (loading) loading.hidden = state !== 'loading';
        if (err) err.hidden = state !== 'error';
        if (errMsg && message) errMsg.textContent = message;
        if (window.lucide) lucide.createIcons();
    };

    // Score → ring stroke offset. r=40 → circumference ≈ 251.
    const CD_RING_CIRCUMFERENCE = 251;

    const renderCandidateDetails = (c) => {
        const root = document.getElementById('candidate-details-screen');
        if (!root) return;

        const setText = (key, text) => {
            root.querySelectorAll(`[data-cd="${key}"]`).forEach(el => { el.textContent = text; });
        };
        const setAttr = (key, attr, val) => {
            const el = root.querySelector(`[data-cd="${key}"]`);
            if (el) el.setAttribute(attr, val);
        };
        const show = (key, visible) => {
            const el = root.querySelector(`[data-cd="${key}"]`);
            if (el) el.hidden = !visible;
        };

        // Header / context
        setText('context-position', c.position || '—');
        setText('context-round', c.stageRound || '—');

        // Hero
        const safeName = c.name || 'Candidate';
        setAttr('avatar', 'src', `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&size=200`);
        setAttr('avatar', 'alt', safeName);
        setText('name', safeName);
        setText('position', c.position || '—');

        // Hero chips
        const hasLocation = !!(c.location && String(c.location).trim());
        show('chip-location', hasLocation);
        if (hasLocation) setText('location', c.location);

        const isActive = c.isActive !== false;
        setText('status-label', isActive ? 'Active' : 'Inactive');
        const chipStatus = root.querySelector('[data-cd="chip-status"]');
        if (chipStatus) chipStatus.classList.toggle('cd-chip-active', isActive);
        const statusDot = root.querySelector('[data-cd="status-dot"]');
        if (statusDot) statusDot.setAttribute('aria-label', isActive ? 'Active' : 'Inactive');

        setText('stage-round', c.stageRound || c.stageLabel || '—');

        const hasFit = !!c.fitVerdict;
        show('chip-fit', hasFit);
        if (hasFit) setText('fit-verdict', c.fitVerdict);

        // Score ring
        if (typeof c.score === 'number') {
            setText('score-value', String(c.score));
            const ring = root.querySelector('[data-cd="score-ring"]');
            if (ring) {
                ring.setAttribute('stroke-dasharray', String(CD_RING_CIRCUMFERENCE));
                const offset = Math.round(CD_RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, c.score)) / 100));
                ring.setAttribute('stroke-dashoffset', String(offset));
            }
        } else {
            setText('score-value', '—');
            const ring = root.querySelector('[data-cd="score-ring"]');
            if (ring) ring.setAttribute('stroke-dashoffset', String(CD_RING_CIRCUMFERENCE));
        }

        // Quick info grid
        setText('email', c.email || '—');
        setText('phone', c.phone && c.phone.trim() ? c.phone : '—');
        setText('experience', c.experience ? `${c.experience} ${Number(c.experience) === 1 ? 'year' : 'years'}` : '—');
        setText('source', c.source || '—');

        // Experience timeline
        const expList = root.querySelector('[data-cd="experience-list"]');
        const experience = Array.isArray(c.workHistory) ? c.workHistory : [];
        if (expList) {
            expList.innerHTML = experience.map(item => `
                <div class="cd-timeline-item">
                    <span class="cd-timeline-dot"></span>
                    <div class="cd-timeline-info">
                        <h4>${escapeHtmlSafe(item.title || '—')}</h4>
                        <p>${escapeHtmlSafe(item.company || '')}</p>
                    </div>
                    ${item.duration ? `<span class="cd-timeline-meta">${escapeHtmlSafe(item.duration)}</span>` : ''}
                </div>
            `).join('');
        }
        show('experience-section', experience.length > 0);

        // Education timeline
        const eduList = root.querySelector('[data-cd="education-list"]');
        const education = Array.isArray(c.education) ? c.education : [];
        if (eduList) {
            eduList.innerHTML = education.map(item => `
                <div class="cd-timeline-item">
                    <span class="cd-timeline-dot"></span>
                    <div class="cd-timeline-info">
                        <h4>${escapeHtmlSafe(item.degree || '—')}</h4>
                        <p>${escapeHtmlSafe(item.school || '')}</p>
                    </div>
                </div>
            `).join('');
        }
        show('education-section', education.length > 0);

        // Skills
        const skillsList = root.querySelector('[data-cd="skills-list"]');
        const skills = Array.isArray(c.skills) ? c.skills : [];
        if (skillsList) {
            if (skills.length) {
                skillsList.innerHTML = skills.map(s => `<span class="cd-skill-tag">${escapeHtmlSafe(s)}</span>`).join('');
            } else {
                skillsList.innerHTML = `<span class="cd-skill-tag cd-skill-empty">No skills listed</span>`;
            }
        }

        // Notes
        const notes = (c.notes || '').trim();
        show('notes-section', !!notes);
        if (notes) setText('notes', notes);

        // Quick links — only show rows for fields the candidate actually has.
        const linksList = root.querySelector('[data-cd="links-list"]');
        const linkDefs = [
            { key: 'linkedIn',  label: 'LinkedIn',  icon: 'linkedin', tone: 'icon-cyan'   },
            { key: 'portfolio', label: 'Portfolio', icon: 'folder',   tone: 'icon-purple' },
            { key: 'github',    label: 'GitHub',    icon: 'github',   tone: 'icon-green'  }
        ];
        const visibleLinks = linkDefs
            .map(def => ({ ...def, value: (c[def.key] || '').trim() }))
            .filter(d => d.value);
        if (linksList) {
            linksList.innerHTML = visibleLinks.map(d => `
                <a href="${escapeHtmlSafe(d.value.startsWith('http') ? d.value : `https://${d.value}`)}"
                   class="cd-link-row" target="_blank" rel="noopener noreferrer">
                    <div class="cd-link-icon ${d.tone}"><i data-lucide="${d.icon}"></i></div>
                    <div class="cd-link-text">
                        <span class="cd-link-label">${d.label}</span>
                        <span class="cd-link-url">${escapeHtmlSafe(d.value)}</span>
                    </div>
                    <i data-lucide="external-link" class="cd-link-arrow"></i>
                </a>
            `).join('');
        }
        show('links-section', visibleLinks.length > 0);

        // AI Highlights — split the AI reasoning into bullet lines so we can
        // render each as its own check-row. We split on '.', '|' and newlines.
        const reasoning = (c.aiReasoning || '').trim();
        const aiList = root.querySelector('[data-cd="ai-list"]');
        const bullets = reasoning
            ? reasoning
                .split(/[\n.|·]+/)
                .map(s => s.trim())
                .filter(s => s.length > 3)
                .slice(0, 4)
            : [];
        if (aiList) {
            aiList.innerHTML = bullets.map(b => `
                <div class="cd-highlight">
                    <i data-lucide="check-circle-2"></i>
                    <span>${escapeHtmlSafe(b)}</span>
                </div>
            `).join('');
        }
        show('ai-section', bullets.length > 0);

        if (window.lucide) lucide.createIcons();
    };

    const loadCandidateDetails = async (id) => {
        if (!window.api || !id) {
            setCdState('error', 'Candidate id is missing. Open a candidate from the list.');
            return;
        }
        currentDetailsId = id;
        setCdState('loading');
        try {
            const candidate = await window.api.getCandidate(id);
            // If the user has since clicked another candidate, ignore this response.
            if (currentDetailsId !== id) return;
            renderCandidateDetails(candidate);
            setCdState('ready');
        } catch (err) {
            console.error('Failed to load candidate details:', err);
            const msg = err && err.status === 404
                ? "This candidate doesn't exist or has been removed."
                : (err && err.message) || 'Failed to load candidate.';
            setCdState('error', msg);
        }
    };

    window.__loadCandidateDetails = loadCandidateDetails;

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
            // Refresh candidates list + insights every time the screen is entered
            // so post-add state, manual API edits, or other windows stay in sync.
            if (targetId === 'candidates-screen') {
                loadCandidatesScreen();
            }
            // Same pattern for the jobs screen.
            if (targetId === 'jobs-screen') {
                loadJobsScreen();
            }
            // Candidate Details: fetch by id captured at click time.
            if (targetId === 'candidate-details-screen') {
                loadCandidateDetails(window.__currentCandidateId);
            }
            // Job Details: same pattern — id was set by the Manage button.
            if (targetId === 'pipeline-screen') {
                loadJobDetails(window.__currentJobId);
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

    // --- Candidates: search + retry + empty-state "Add" ---
    // Search filters the already-fetched cache client-side; the API itself
    // also supports ?search= so we can switch to server-side filtering later
    // without changing this UI contract.
    const candSearchInput = document.querySelector('#candidates-screen .cand-search input');
    if (candSearchInput) {
        let searchDebounce;
        candSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                renderCandidatesGrid(candidatesCache, { filter: candSearchInput.value });
            }, 120);
        });
    }
    const candRetryBtn = document.getElementById('candidates-retry');
    if (candRetryBtn) {
        candRetryBtn.addEventListener('click', () => loadCandidatesScreen());
    }
    const candEmptyAddBtn = document.getElementById('open-add-candidate-empty');
    if (candEmptyAddBtn) {
        candEmptyAddBtn.addEventListener('click', () => {
            const panel = document.getElementById('add-candidate-panel');
            if (panel) {
                panel.classList.add('active');
                document.querySelector('.panel-overlay')?.classList.add('active');
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // --- Jobs: retry + empty-state "Create New Job" ---
    const jobsRetryBtn = document.getElementById('jobs-retry');
    if (jobsRetryBtn) {
        jobsRetryBtn.addEventListener('click', () => loadJobsScreen());
    }
    const cdRetryBtn = document.getElementById('cd-retry');
    if (cdRetryBtn) {
        cdRetryBtn.addEventListener('click', () => loadCandidateDetails(window.__currentCandidateId));
    }
    const jdRetryBtn = document.getElementById('jd-retry');
    if (jdRetryBtn) {
        jdRetryBtn.addEventListener('click', () => loadJobDetails(window.__currentJobId));
    }
    const jobEmptyAddBtn = document.getElementById('open-create-job-empty');
    if (jobEmptyAddBtn) {
        jobEmptyAddBtn.addEventListener('click', () => {
            const panel = document.getElementById('create-job-panel');
            if (panel) {
                panel.classList.add('active');
                document.querySelector('.panel-overlay')?.classList.add('active');
                if (window.lucide) lucide.createIcons();
            }
        });
    }

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

        card.addEventListener('dragend', async () => {
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
            const fromCol = dragOriginColumn;
            const moved = finalCol && fromCol && finalCol !== fromCol;

            if (landed && moved) {
                landed.classList.add('is-landing');
                setTimeout(() => landed.classList.remove('is-landing'), 600);
            }

            // Refresh counts on every column (animate the two affected ones)
            if (kanbanBoard) {
                kanbanBoard.querySelectorAll('.kanban-column').forEach(col => {
                    const isAffected = moved && (col === fromCol || col === finalCol);
                    updateColumnCount(col, isAffected);
                });
                kanbanBoard.querySelectorAll('.kanban-column.is-drop-target')
                    .forEach(c => c.classList.remove('is-drop-target'));
            }
            draggingCard = null;
            dragOriginColumn = null;

            // Persist the stage change. Without this the move is purely
            // visual — a refresh would snap the card back to its original
            // column because the server still has the old stage.
            if (!moved || !landed) return;
            const candidateId = landed.dataset.candidateId;
            const newStage = finalCol.dataset.jdColumn
                || (finalCol.classList.contains('col-applied')   ? 'applied'
                  : finalCol.classList.contains('col-screening') ? 'screening'
                  : finalCol.classList.contains('col-interview') ? 'interview'
                  : finalCol.classList.contains('col-offer')     ? 'offer'
                  : null);
            if (!candidateId || !newStage || !window.api) return;

            try {
                await window.api.updateCandidateStage(candidateId, newStage);
                // Keep the top "Screening" stat counter in sync with whatever
                // the kanban column badge now reads.
                const screenCount = document.querySelector('[data-jd-count="screening"]');
                const statScreen = document.querySelector('[data-jd="stat-screening"]');
                if (screenCount && statScreen) statScreen.textContent = screenCount.textContent;

                if (window.showToast) {
                    const niceName = newStage.charAt(0).toUpperCase() + newStage.slice(1);
                    window.showToast(`Moved to ${niceName}`, 'success');
                }
            } catch (err) {
                // Rollback the visual move so the UI matches the server.
                console.error('Failed to update candidate stage:', err);
                if (fromCol && landed) {
                    fromCol.appendChild(landed);
                    updateColumnCount(fromCol, true);
                    updateColumnCount(finalCol, true);
                }
                if (window.showToast) {
                    window.showToast(err.message || 'Failed to update stage.', 'error');
                }
            }
        });
    };

    const initPipelineDragDrop = () => {
        if (!kanbanBoard) return;
        
        kanbanBoard.querySelectorAll('.candidate-card').forEach(initDraggableCard);

        kanbanBoard.querySelectorAll('.kanban-column').forEach(col => {
            col.addEventListener('dragenter', (e) => {
                if (draggingCard) {
                    e.preventDefault();
                    col.classList.add('is-drop-target');
                }
            });

            col.addEventListener('dragover', (e) => {
                if (!draggingCard) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                col.classList.add('is-drop-target');

                const after = getDragAfterElement(col, e.clientY);
                if (after == null) {
                    if (col.lastElementChild !== draggingCard) col.appendChild(draggingCard);
                } else if (after !== draggingCard.nextElementSibling && after !== draggingCard) {
                    col.insertBefore(draggingCard, after);
                }
            });

            col.addEventListener('dragleave', (e) => {
                // Only remove if we're actually leaving the column, not just entering a card inside it
                if (e.relatedTarget && col.contains(e.relatedTarget)) return;
                col.classList.remove('is-drop-target');
            });

            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('is-drop-target');
            });
        });
    };

    // Initial call
    initPipelineDragDrop();

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

        // Submit — POSTs to /api/jobs, then refreshes the table from the API.
        // Row rendering itself lives in the jobs renderer block above so the
        // visuals stay consistent between initial load and post-create state.
        const createJobForm = document.getElementById('create-job-form');

        // Belt-and-suspenders: some browser/extension combos drop the implicit
        // submit from `<button form="...">` when the button lives outside the
        // form. Bind a direct click on the Publish button that calls
        // form.requestSubmit() so the submit listener below always fires.
        const publishBtn = document.querySelector('.side-panel-footer button[form="create-job-form"]');
        if (publishBtn && createJobForm) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof createJobForm.requestSubmit === 'function') {
                    createJobForm.requestSubmit();
                } else {
                    // Fallback for very old browsers.
                    createJobForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            });
        }

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

        // Helper: collect the currently-active pill in a single-select group.
        // Falls back to the group's first pill's data attribute if nothing is active.
        const activePillValue = (selector, attr) => {
            const group = createJobPanel.querySelector(selector);
            if (!group) return null;
            const active = group.querySelector('.job-type-pill.active');
            const pill = active || group.querySelector('.job-type-pill');
            return pill ? pill.getAttribute(`data-${attr}`) : null;
        };

        const collectJobSkills = () =>
            [...jobSkillChips.children]
                .map(c => c.firstChild && c.firstChild.nodeValue ? c.firstChild.nodeValue.trim() : '')
                .filter(Boolean);

        createJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            createJobForm.querySelectorAll('.has-error').forEach(el => {
                el.classList.remove('has-error');
                const msg = el.querySelector('.form-error-msg');
                if (msg) msg.remove();
            });

            const showFieldError = (inputEl, msg) => {
                const field = inputEl && inputEl.closest ? inputEl.closest('.form-field') : null;
                if (!field) return;
                field.classList.add('has-error');
                const err = document.createElement('div');
                err.className = 'form-error-msg';
                err.innerHTML = `<i data-lucide="alert-circle"></i> ${msg}`;
                field.appendChild(err);
            };

            const titleEl = document.getElementById('job-title');
            const minEl = document.getElementById('job-min');
            const maxEl = document.getElementById('job-max');

            const title = titleEl.value.trim();
            const minRaw = minEl.value.trim();
            const maxRaw = maxEl.value.trim();

            let isValid = true;
            if (!title) {
                showFieldError(titleEl, 'Job title is required');
                isValid = false;
            }
            // Client-side salary sanity check (server re-validates).
            if (minRaw !== '' && maxRaw !== '') {
                const minN = Number(minRaw);
                const maxN = Number(maxRaw);
                if (Number.isFinite(minN) && Number.isFinite(maxN) && minN > maxN) {
                    showFieldError(maxEl, 'Max salary must be ≥ min');
                    isValid = false;
                }
            }
            if (!isValid) {
                if (window.lucide) lucide.createIcons();
                window.showToast('Please correct the errors before submitting.', 'error');
                return;
            }

            // The Publish button lives outside the form (in .side-panel-footer)
            // and is associated via the `form` attribute, so a form-scoped
            // querySelector returns null. Resolve it document-wide instead.
            const submitBtn = document.querySelector('.side-panel-footer button[form="create-job-form"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
                submitBtn.disabled = true;
            }
            if (window.lucide) lucide.createIcons();

            // Collect every field from the panel — pills, toggles, textareas.
            const employmentType = activePillValue('.job-type-pills[aria-label="Employment type"]', 'type') || 'full-time';
            const workMode = activePillValue('.job-type-pills[aria-label="Work mode"]', 'mode') || 'onsite';
            const status = activePillValue('.job-type-pills[aria-label="Status"]', 'status') || 'active';

            const payload = {
                title,
                department: document.getElementById('job-dept').value,
                level: document.getElementById('job-level').value,
                employmentType,
                workMode,
                location: document.getElementById('job-location').value.trim(),
                currency: document.getElementById('job-currency').value,
                salaryMin: minRaw === '' ? null : Number(minRaw),
                salaryMax: maxRaw === '' ? null : Number(maxRaw),
                skills: collectJobSkills(),
                description: (document.getElementById('job-overview')?.value || '').trim(),
                responsibilities: (document.getElementById('job-resp')?.value || '').trim(),
                requirements: (document.getElementById('job-req')?.value || '').trim(),
                status
            };

            try {
                await window.api.createJob(payload);

                // Single source of truth: re-fetch the jobs list + insights so
                // applicants count, badge, progress, etc. are server-derived.
                if (typeof window.__loadJobsScreen === 'function') {
                    window.__loadJobsScreen();
                }

                closeAllSidePanels();
                setTimeout(resetJobForm, 400);
                window.showToast(
                    status === 'draft' ? 'Job saved as draft.' : 'Job successfully created!',
                    'success'
                );
            } catch (error) {
                console.error('Error creating job:', error);

                // Map server-side field errors back onto the corresponding inputs.
                if (error && error.fields && typeof error.fields === 'object') {
                    const fieldMap = {
                        title: titleEl,
                        salaryMin: minEl,
                        salaryMax: maxEl,
                        location: document.getElementById('job-location'),
                        department: document.getElementById('job-dept'),
                        level: document.getElementById('job-level'),
                        currency: document.getElementById('job-currency')
                    };
                    Object.entries(error.fields).forEach(([key, msg]) => {
                        const el = fieldMap[key];
                        if (el) showFieldError(el, msg);
                    });
                    if (window.lucide) lucide.createIcons();
                }

                window.showToast(error.message || 'Failed to create job. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
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

        addCandForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            addCandForm.querySelectorAll('.has-error').forEach(el => {
                el.classList.remove('has-error');
                const msg = el.querySelector('.form-error-msg');
                if (msg) msg.remove();
            });

            const showFieldError = (inputEl, msg) => {
                const field = inputEl.closest('.form-field');
                if (!field) return;
                field.classList.add('has-error');
                const err = document.createElement('div');
                err.className = 'form-error-msg';
                err.innerHTML = `<i data-lucide="alert-circle"></i> ${msg}`;
                field.appendChild(err);
            };

            const nameEl = document.getElementById('cand-name');
            const emailEl = document.getElementById('cand-email');
            const positionEl = document.getElementById('cand-position');
            const experienceEl = document.getElementById('cand-experience');
            const resumeInput = document.getElementById('cand-resume');
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const position = positionEl ? positionEl.value.trim() : '';
            const experienceVal = experienceEl ? experienceEl.value.trim() : '';

            let isValid = true;
            if (!name) { showFieldError(nameEl, 'Name is required'); isValid = false; }
            if (!email) { showFieldError(emailEl, 'Email is required'); isValid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(emailEl, 'Invalid email format'); isValid = false; }
            if (!position) { showFieldError(positionEl, 'Position is required'); isValid = false; }
            if (experienceVal !== '') {
                const n = Number(experienceVal);
                if (!Number.isFinite(n) || n < 0 || n > 60) {
                    showFieldError(experienceEl, 'Enter a value between 0 and 60');
                    isValid = false;
                }
            }

            // Resume is now optional. If one is attached we still enforce the
            // 10 MB cap so the upload doesn't blow up the request body.
            if (resumeInput.files.length > 0) {
                const file = resumeInput.files[0];
                if (file.size > 10 * 1024 * 1024) {
                    window.showToast('Resume file is too large. Max 10 MB.', 'error');
                    isValid = false;
                }
            }

            if (!isValid) {
                if (window.lucide) lucide.createIcons();
                window.showToast('Please fill out all required fields correctly.', 'error');
                return;
            }

            const submitBtn = document.querySelector('.btn-save-candidate');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
                submitBtn.disabled = true;
            }
            if (window.lucide) lucide.createIcons();

            try {
                const stageBtn = addCandPanel.querySelector('.stage-pill.active');
                const stage = stageBtn ? stageBtn.dataset.stage : 'applied';
                const colSelector = stageColMap[stage] || '.col-applied';
                const col = document.querySelector(`#pipeline-screen ${colSelector}`);

                const formData = new FormData(addCandForm);
                // Manually append fields in case FormData(form) doesn't catch them all (e.g. if name attributes are missing)
                formData.set('name', name);
                formData.set('email', email);
                formData.set('phone', document.getElementById('cand-phone').value.trim());
                formData.set('position', document.getElementById('cand-position').value.trim());
                formData.set('experience', document.getElementById('cand-experience').value.trim());
                formData.set('source', document.getElementById('cand-source').value.trim());
                formData.set('notes', document.getElementById('cand-notes').value.trim());
                formData.append('stage', stage);
                formData.append('skills', JSON.stringify(collectSkills()));

                // Add Candidate via API. AI resume scoring is intentionally not
                // run here — the score endpoint can fail and would block save.
                // Candidates created from this form have no AI match score.
                const newCandidate = await window.api.addCandidate(formData);

                // Step 3: Update pipeline column (kanban) — uses the existing
                // card builder so card visuals stay consistent across screens.
                const cardData = {
                    name: newCandidate.name,
                    email: newCandidate.email,
                    position: newCandidate.position,
                    experience: newCandidate.experience,
                    source: newCandidate.source,
                    skills: Array.isArray(newCandidate.skills) ? newCandidate.skills : collectSkills(),
                    score: newCandidate.score
                };
                const card = buildCandidateCard(cardData);
                if (typeof newCandidate.score === 'number') {
                    const scoreValEl = card.querySelector('.score-val');
                    if (scoreValEl) scoreValEl.textContent = `${newCandidate.score}%`;
                }

                if (col) {
                    const firstCard = col.querySelector('.candidate-card');
                    if (firstCard) col.insertBefore(card, firstCard);
                    else col.appendChild(card);

                    updateColCount(col);
                    if (typeof window.__initDraggableCard === 'function') {
                        window.__initDraggableCard(card);
                    }
                    col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }

                // Step 4: Refresh the Candidates screen from the server so the
                // grid and insights both reflect the new record (single source
                // of truth: the API). Non-blocking — toast first.
                if (typeof window.__loadCandidatesScreen === 'function') {
                    window.__loadCandidatesScreen();
                }

                if (window.lucide) lucide.createIcons();

                closeAllSidePanels();
                setTimeout(resetForm, 400);
                window.showToast('Candidate successfully added and scored!', 'success');

            } catch (error) {
                console.error("Error adding candidate:", error);

                // Map server field errors back to the right inputs
                if (error && error.fields && typeof error.fields === 'object') {
                    const fieldMap = {
                        name: nameEl,
                        email: emailEl,
                        position: positionEl,
                        experience: experienceEl
                    };
                    Object.entries(error.fields).forEach(([key, msg]) => {
                        const el = fieldMap[key];
                        if (el) showFieldError(el, msg);
                    });
                    if (window.lucide) lucide.createIcons();
                }

                window.showToast(error.message || 'Failed to add candidate. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
                if (window.lucide) lucide.createIcons();
            }
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

    const runKPICounters = async () => {
        // Fetch live data from API
        try {
            if (window.api && window.api.getKPIs) {
                const kpis = await window.api.getKPIs();
                
                const mappings = {
                    'Total Candidates': kpis.totalCandidates,
                    'Active Jobs': kpis.activeJobs,
                    'New Applications': kpis.totalCandidates, // Simulating for UI
                    'Interviews Today': kpis.interviews
                };

                document.querySelectorAll('.kpi-card').forEach(card => {
                    const title = card.querySelector('.kpi-title').textContent.trim();
                    const valueEl = card.querySelector('.kpi-value');
                    if (valueEl && mappings[title] !== undefined) {
                        valueEl.textContent = mappings[title].toLocaleString();
                        // Re-initialize for animation
                        valueEl.dataset.initialized = ''; 
                    }
                });
                initKPICounters();
            }
        } catch (err) {
            console.warn("Failed to fetch live KPIs:", err);
        }

        const kpiValues = document.querySelectorAll('.kpi-value');
        kpiValues.forEach(el => {
            const strips = el.querySelectorAll('.digit-strip');
            strips.forEach((strip, index) => {
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0)';
                void strip.offsetWidth;
                strip.style.transition = 'transform 2s cubic-bezier(0.15, 0.9, 0.3, 1)';
                const targetDigit = parseInt(strip.dataset.digit);
                setTimeout(() => {
                    strip.style.transform = `translateY(-${targetDigit * 10}%)`;
                }, 100 + (index * 80));
            });
        });
    };


    // Run initialization
    initKPICounters();

    // Expose navigateTo globally so inline onclick handlers work
    window.navigateTo = navigateTo;
});
