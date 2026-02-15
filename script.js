function isSafeFeatureTarget(target) {
    if (!target || typeof target !== 'string') return false;
    const trimmed = target.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return false;
    if (trimmed.startsWith('javascript:')) return false;
    return true;
}

function readLocalUser() {
    try {
        const parsed = JSON.parse(localStorage.getItem('erayaUser') || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_err) {
        return {};
    }
}

function redirectToSignupForFeature(target) {
    const params = new URLSearchParams();
    params.set('intent', 'signup');
    params.set('next', target);
    window.location.href = 'login.html?' + params.toString();
}

function redirectToLoginForFeature(target) {
    const params = new URLSearchParams();
    params.set('next', target);
    window.location.href = 'login.html?' + params.toString();
}

function handleFeatureNavigation(target) {
    if (!isSafeFeatureTarget(target)) return;

    const goToTarget = function() {
        window.location.href = target;
    };

    const localUser = readLocalUser();
    if (!localUser || !localUser.email) {
        redirectToSignupForFeature(target);
        return;
    }

    if (window.ErayaAuth && typeof window.ErayaAuth.getCurrentUser === 'function') {
        window.ErayaAuth.getCurrentUser(2000)
            .then(function(user) {
                if (user && user.email) {
                    goToTarget();
                } else if (localUser && localUser.email) {
                    redirectToLoginForFeature(target);
                } else {
                    redirectToSignupForFeature(target);
                }
            })
            .catch(function() {
                // If auth check fails, use local fallback before forcing signup.
                if (localUser && localUser.email) redirectToLoginForFeature(target);
                else redirectToSignupForFeature(target);
            });
        return;
    }

    if (localUser && localUser.email) redirectToLoginForFeature(target);
    else redirectToSignupForFeature(target);
}

window.handleFeatureNavigation = handleFeatureNavigation;

// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    generateCalendar();

    const featureButtons = document.querySelectorAll('[data-feature-target]');
    featureButtons.forEach(function(el) {
        if (!el.hasAttribute('tabindex') && (el.classList.contains('card') || el.classList.contains('card-large'))) {
            el.setAttribute('tabindex', '0');
        }

        const navigate = function(event) {
            if (event) event.preventDefault();
            const target = el.getAttribute('data-feature-target');
            handleFeatureNavigation(target);
        };

        el.addEventListener('click', navigate);
        el.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                navigate(event);
            }
        });
    });
});

function generateCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;

    const currentMonth = 0; // January (0-indexed)
    const currentYear = 2026;

    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Adjust for Monday start (0 = Sunday, we want Monday = 0)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Get previous month's last days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // Update header
    const section = calendarDays.closest('.calendar-section');
    const header = section ? section.querySelector('.calendar-header h3') : null;
    if (header) {
        header.textContent = firstDay.toLocaleString('default', { month: 'long' }) + ' ' + currentYear;
    }

    // Clear calendar
    calendarDays.innerHTML = '';

    // Add previous month's days
    for (let i = adjustedStart - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthLastDay - i;
        calendarDays.appendChild(day);
    }

    // Add current month's days
    for (let i = 1; i <= totalDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;

        if (i === 2) {
            day.classList.add('selected');
        }

        day.addEventListener('click', function() {
            document.querySelectorAll('.calendar-day.selected').forEach(d => {
                d.classList.remove('selected');
            });
            this.classList.add('selected');
            updateDayInfo(i);
        });

        calendarDays.appendChild(day);
    }

    // Fill remaining days with next month
    const totalCells = calendarDays.children.length;
    const remainingCells = 35 - totalCells;

    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i < 10 ? '0' + i : i;
        calendarDays.appendChild(day);
    }
}

function updateDayInfo(day) {
    console.log('Selected day:', day);
}

// Smooth scroll and card hover (run when DOM ready)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const allCards = document.querySelectorAll('.card, .card-large');
    allCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Cycle progress animation
function animateProgress() {
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach((fill, index) => {
        setTimeout(() => {
            fill.style.opacity = '0';
            fill.style.width = '0';
            setTimeout(() => {
                fill.style.opacity = '1';
                fill.style.transition = 'width 1s ease-out';
                if (index === 0) fill.style.width = '25%';
                if (index === 1) fill.style.width = '25%';
                if (index === 2) fill.style.width = '50%';
            }, 50);
        }, index * 200);
    });
}

window.addEventListener('load', animateProgress);
