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
                }, 400); // Wait for fade out
            }, 1000);
        }
    });

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const pageViews = document.querySelectorAll('.page-view');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        'dashboard-screen': 'Main Dashboard',
        'candidates-screen': 'Candidates',
        'jobs-screen': 'Jobs & Reports',
        'calendar-screen': 'Calendar',
        'pipeline-screen': 'Job Pipeline',
        'candidate-details-screen': 'Candidate Profile',
        'settings-screen': 'Settings'
    };

    const navigateTo = (targetId) => {
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
        }

        // Update title
        pageTitle.textContent = titles[targetId] || 'RecruitHub';
    };

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

    // --- KPI Counter Animation (Premium Odometer Style) ---
    const initKPICounters = () => {
        const kpiValues = document.querySelectorAll('.kpi-value');
        
        kpiValues.forEach(el => {
            const originalValue = el.textContent.trim();
            const parts = originalValue.split('');
            el.innerHTML = ''; // Clear original content
            
            parts.forEach((char, index) => {
                if (/\d/.test(char)) {
                    const container = document.createElement('div');
                    container.className = 'digit-container';
                    
                    const strip = document.createElement('div');
                    strip.className = 'digit-strip';
                    
                    // Populate 0-9 for the strip
                    for (let i = 0; i <= 9; i++) {
                        const span = document.createElement('span');
                        span.textContent = i;
                        strip.appendChild(span);
                    }
                    
                    container.appendChild(strip);
                    el.appendChild(container);
                    
                    // Set target position with a more organic staggered timing
                    const targetDigit = parseInt(char);
                    setTimeout(() => {
                        strip.style.transform = `translateY(-${targetDigit * 10}%)`;
                    }, 400 + (index * 120)); // Increased delay for mechanical feel
                } else {
                    const sep = document.createElement('span');
                    sep.className = 'kpi-separator';
                    sep.textContent = char;
                    el.appendChild(sep);
                }
            });
        });
    };

    // Run initialization
    initKPICounters();

    // Expose navigateTo globally so inline onclick handlers work
    window.navigateTo = navigateTo;
});
