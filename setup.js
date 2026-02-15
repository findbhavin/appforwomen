let currentStep = 1;
const totalSteps = 3;
let activeUser = null;

function safeParseObject(rawValue) {
    if (!rawValue) return {};
    try {
        const parsed = JSON.parse(rawValue);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_err) {
        return {};
    }
}

function getStoredObject(key) {
    return safeParseObject(localStorage.getItem(key));
}

function saveStoredObject(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (_err) {
        return false;
    }
}

async function fetchSessionUser() {
    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, 6000);
    try {
        const response = await fetch('/api/me', { credentials: 'include', signal: controller.signal });
        const data = await response.json();
        return data && data.user ? data.user : null;
    } catch (_err) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function upsertLocalUser(user, keepSetupState) {
    if (!user || !user.email) return;
    const normalized = {
        email: user.email,
        name: user.name || user.email.split('@')[0]
    };
    saveStoredObject('erayaUser', normalized);

    const users = getStoredObject('erayaUsers');
    const existing = users[normalized.email] || {};
    const globalProfile = getStoredObject('userData');
    const inferredSetupDone =
        Boolean(existing.setupDone) ||
        (globalProfile && globalProfile.email === normalized.email && Boolean(globalProfile.setupComplete));
    users[normalized.email] = {
        ...existing,
        email: normalized.email,
        name: normalized.name,
        setupDone: keepSetupState ? inferredSetupDone : false
    };
    saveStoredObject('erayaUsers', users);
}

document.addEventListener('DOMContentLoaded', async function() {
    const setupForm = document.getElementById('setupForm');
    if (!setupForm) return;

    const localUser = getStoredObject('erayaUser');
    const sessionUser = await fetchSessionUser();

    if (sessionUser && sessionUser.email) {
        activeUser = {
            email: sessionUser.email,
            name: sessionUser.name || sessionUser.email.split('@')[0]
        };
        upsertLocalUser(activeUser, true);
    } else if (localUser.email) {
        activeUser = {
            email: localUser.email,
            name: localUser.name || localUser.email.split('@')[0]
        };
    }

    if (!activeUser || !activeUser.email) {
        window.location.href = 'login.html?next=' + encodeURIComponent('setup.html');
        return;
    }

    const users = getStoredObject('erayaUsers');
    const profileByEmail = getStoredObject('userDataByEmail');
    if (
        activeUser.email &&
        profileByEmail[activeUser.email] &&
        profileByEmail[activeUser.email].setupComplete &&
        (!users[activeUser.email] || !users[activeUser.email].setupDone)
    ) {
        users[activeUser.email] = {
            ...(users[activeUser.email] || {}),
            email: activeUser.email,
            name: activeUser.name,
            setupDone: true,
            profile: profileByEmail[activeUser.email]
        };
        saveStoredObject('erayaUsers', users);
    }
    if (users[activeUser.email] && users[activeUser.email].setupDone) {
        window.location.href = 'index.html';
        return;
    }

    const nameField = document.getElementById('name');
    if (nameField && activeUser.name) {
        nameField.value = activeUser.name;
    }

    const lastPeriodInput = document.getElementById('lastPeriod');
    if (lastPeriodInput) {
        lastPeriodInput.max = new Date().toISOString().split('T')[0];
    }

    updateProgressUI();
    setupForm.addEventListener('submit', handleSubmit);
});

function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
        currentStep += 1;
        updateStepDisplay();
        updateProgressUI();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep -= 1;
        updateStepDisplay();
        updateProgressUI();
    }
}

function updateStepDisplay() {
    document.querySelectorAll('.form-step').forEach(function(stepElement) {
        stepElement.classList.remove('active');
    });
    const active = document.querySelector('.form-step[data-step="' + currentStep + '"]');
    if (active) active.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressUI() {
    document.querySelectorAll('.progress-step').forEach(function(step, index) {
        const number = index + 1;
        if (number < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (number === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function validateStep(stepNumber) {
    const stepRoot = document.querySelector('.form-step[data-step="' + stepNumber + '"]');
    if (!stepRoot) return false;

    let valid = true;
    stepRoot.querySelectorAll('[required]').forEach(function(field) {
        const value = typeof field.value === 'string' ? field.value.trim() : '';
        if (!value) {
            valid = false;
            field.style.borderColor = '#FF6B9D';
            setTimeout(function() { field.style.borderColor = ''; }, 1800);
        }
    });

    if (!valid) {
        showNotification('Please fill in all required fields', 'error');
    }
    return valid;
}

function collectFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    formData.forEach(function(value, key) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            data[key] = Array.isArray(data[key]) ? data[key].concat(value) : [data[key], value];
        } else {
            data[key] = value;
        }
    });
    return data;
}

function computeNextPeriod(lastPeriod, cycleLength) {
    const parsedDate = new Date(lastPeriod);
    if (Number.isNaN(parsedDate.getTime())) return '';
    const next = new Date(parsedDate);
    next.setDate(next.getDate() + cycleLength);
    return next.toISOString().split('T')[0];
}

function handleSubmit(event) {
    event.preventDefault();
    if (!validateStep(currentStep)) return;

    const form = event.target;
    const data = collectFormData(form);
    const email = activeUser && activeUser.email ? activeUser.email : '';
    if (email) {
        data.email = email;
    }

    const cycleLength = parseInt(data.cycleLength, 10);
    data.cycleLength = Number.isFinite(cycleLength) ? cycleLength : 28;

    const periodLength = parseInt(data.periodLength, 10);
    data.periodLength = Number.isFinite(periodLength) ? periodLength : 5;

    data.nextPeriod = computeNextPeriod(data.lastPeriod, data.cycleLength);
    data.setupComplete = true;
    data.updatedAt = new Date().toISOString();

    const stored = saveStoredObject('userData', data);
    if (!stored) {
        showNotification('Could not save setup data in this browser.', 'error');
        return;
    }

    const users = getStoredObject('erayaUsers');
    if (email) {
        users[email] = {
            ...(users[email] || {}),
            email: email,
            name: data.name || activeUser.name || email.split('@')[0],
            setupDone: true,
            profile: data
        };
        saveStoredObject('erayaUsers', users);
        saveStoredObject('erayaUser', { email: email, name: users[email].name });

        const userDataByEmail = getStoredObject('userDataByEmail');
        userDataByEmail[email] = data;
        saveStoredObject('userDataByEmail', userDataByEmail);
    }

    showSuccessAnimation();
    setTimeout(function() {
        window.location.href = 'index.html';
    }, 2000);
}

function showSuccessAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';

    const box = document.createElement('div');
    box.style.cssText = 'background:white;padding:3rem 4rem;border-radius:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
    box.innerHTML = '<div style="font-size:4rem;margin-bottom:1rem">&#10003;</div><h2 style="font-size:2rem;color:#2D2D2D;margin-bottom:0.5rem">Welcome to ERAYA!</h2><p style="color:#666">Your wellness journey begins now...</p>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function showNotification(message, type) {
    const notice = document.createElement('div');
    notice.style.cssText = 'position:fixed;top:20px;right:20px;padding:14px 22px;background:' + (type === 'error' ? '#FF6B9D' : '#4ECDC4') + ';color:white;border-radius:12px;font-weight:600;z-index:10000;font-size:15px;';
    notice.textContent = message;
    document.body.appendChild(notice);
    setTimeout(function() {
        if (notice.parentNode) notice.remove();
    }, 3000);
}
