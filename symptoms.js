let selectedSymptoms = {};
let waterGlasses = 0;
const WATER_GOAL = 9; // 9 × 0.25L = 2.25L

function safeParseObject(rawValue) {
    if (!rawValue) return {};
    try {
        const parsed = JSON.parse(rawValue);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_err) {
        return {};
    }
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Returns the date to log: ?date= param if present and valid, otherwise today.
function getLogDate() {
    try {
        var params = new URLSearchParams(window.location.search);
        var d = params.get('date');
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    } catch (_) {}
    return getTodayDate();
}

function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getChipLabel(chip) {
    if (!chip) return '';
    const textNode = chip.querySelector('.chip-icon + span') || chip.querySelector('span:last-child');
    return textNode ? textNode.textContent.trim() : chip.textContent.trim();
}

function normalizeSelections(rawSelections) {
    const normalized = {};
    Object.keys(rawSelections || {}).forEach(function(category) {
        const items = Array.isArray(rawSelections[category]) ? rawSelections[category] : [];
        const mapped = items
            .filter(function(item) { return item && item.value && item.label; })
            .map(function(item) {
                return {
                    value: String(item.value),
                    label: String(item.label)
                };
            });
        if (mapped.length) normalized[category] = mapped;
    });
    return normalized;
}

function persistSelectionsToLocal() {
    const today = getLogDate();
    const allSymptoms = safeParseObject(localStorage.getItem('symptomsData'));
    const weightVal = document.getElementById('weightInput') ? document.getElementById('weightInput').value : '';
    var prev = allSymptoms[today] && typeof allSymptoms[today] === 'object' ? allSymptoms[today] : {};
    allSymptoms[today] = Object.assign({}, prev, {
        date: today,
        symptoms: selectedSymptoms,
        water: waterGlasses,
        weight: weightVal ? parseFloat(weightVal) : null,
        timestamp: new Date().toISOString()
    });
    try {
        localStorage.setItem('symptomsData', JSON.stringify(allSymptoms));
        return true;
    } catch (_err) {
        return false;
    }
}

function addSymptomSelection(category, value, label) {
    if (!category || !value || !label) return;
    if (!selectedSymptoms[category]) selectedSymptoms[category] = [];
    const exists = selectedSymptoms[category].some(function(item) {
        return item.value === value;
    });
    if (!exists) {
        selectedSymptoms[category].push({ value: value, label: label });
    }
}

function removeSymptomSelection(category, value) {
    if (!selectedSymptoms[category]) return;
    selectedSymptoms[category] = selectedSymptoms[category].filter(function(item) {
        return item.value !== value;
    });
    if (!selectedSymptoms[category].length) {
        delete selectedSymptoms[category];
    }
}

function syncChipsFromSelections() {
    document.querySelectorAll('.chip').forEach(function(chip) {
        const category = chip.getAttribute('data-category');
        const value = chip.getAttribute('data-value');
        const isSelected = Boolean(
            selectedSymptoms[category] &&
            selectedSymptoms[category].some(function(item) { return item.value === value; })
        );
        chip.classList.toggle('selected', isSelected);
    });
}

function updateSelectedDisplay() {
    const selectedItemsContainer = document.getElementById('selectedItems');
    if (!selectedItemsContainer) return;
    selectedItemsContainer.innerHTML = '';

    const categories = Object.keys(selectedSymptoms);
    if (!categories.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Select symptoms to track';
        selectedItemsContainer.appendChild(empty);
        return;
    }

    categories.forEach(function(category) {
        selectedSymptoms[category].forEach(function(item) {
            const row = document.createElement('div');
            row.className = 'selected-item';

            const label = document.createElement('span');
            label.textContent = item.label;

            const button = document.createElement('button');
            button.className = 'remove-btn';
            button.type = 'button';
            button.textContent = '×';
            button.addEventListener('click', function() {
                removeSymptom(category, item.value);
            });

            row.appendChild(label);
            row.appendChild(button);
            selectedItemsContainer.appendChild(row);
        });
    });
}

function toggleChip(chip) {
    if (!chip) return;
    const category = chip.getAttribute('data-category');
    const value = chip.getAttribute('data-value');
    const label = getChipLabel(chip);
    if (!category || !value) return;

    if (chip.classList.contains('selected')) {
        chip.classList.remove('selected');
        removeSymptomSelection(category, value);
    } else {
        chip.classList.add('selected');
        addSymptomSelection(category, value, label);
    }
    updateSelectedDisplay();
}

function removeSymptom(category, value) {
    removeSymptomSelection(category, value);
    const chip = document.querySelector('[data-category="' + category + '"][data-value="' + value + '"]');
    if (chip) chip.classList.remove('selected');
    updateSelectedDisplay();
}

function filterSymptoms(searchTerm) {
    const chips = document.querySelectorAll('.chip');
    const categories = document.querySelectorAll('.symptom-category');
    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) {
        chips.forEach(function(chip) { chip.style.display = 'inline-flex'; });
        categories.forEach(function(cat) { cat.style.display = 'block'; });
        return;
    }

    categories.forEach(function(category) {
        let hasVisible = false;
        category.querySelectorAll('.chip').forEach(function(chip) {
            const text = normalizeText(getChipLabel(chip));
            const match = text.includes(normalizedTerm);
            chip.style.display = match ? 'inline-flex' : 'none';
            if (match) hasVisible = true;
        });
        category.style.display = hasVisible ? 'block' : 'none';
    });
}

function loadSavedSymptomsFromLocal() {
    const today = getLogDate();
    const allSymptoms = safeParseObject(localStorage.getItem('symptomsData'));
    const todayRecord = allSymptoms[today];
    if (!todayRecord || typeof todayRecord !== 'object') return false;
    selectedSymptoms = normalizeSelections(todayRecord.symptoms || {});
    syncChipsFromSelections();
    updateSelectedDisplay();
    return true;
}

function importApiSymptoms(log) {
    if (!log || !Array.isArray(log.symptoms)) return;
    const chips = Array.from(document.querySelectorAll('.chip'));
    const chipByLabel = {};
    chips.forEach(function(chip) {
        chipByLabel[normalizeText(getChipLabel(chip))] = chip;
    });

    log.symptoms.forEach(function(rawLabel) {
        const chip = chipByLabel[normalizeText(rawLabel)];
        if (!chip) return;
        const category = chip.getAttribute('data-category');
        const value = chip.getAttribute('data-value');
        const label = getChipLabel(chip);
        addSymptomSelection(category, value, label);
    });
}

async function loadSavedSymptomsFromApi() {
    const today = getLogDate();
    try {
        const response = await fetch('/api/symptoms?date=' + encodeURIComponent(today), {
            credentials: 'include'
        });
        if (response.status === 401) return;
        const data = await response.json();
        if (response.ok && data && data.log) {
            importApiSymptoms(data.log);
            syncChipsFromSelections();
            updateSelectedDisplay();
        }
    } catch (_err) {
        // Non-fatal: local data still works.
    }
}

function selectedLabelsForApi() {
    const labels = [];
    Object.keys(selectedSymptoms).forEach(function(category) {
        selectedSymptoms[category].forEach(function(item) {
            labels.push(item.label);
        });
    });
    return Array.from(new Set(labels));
}

function calculateIntensity() {
    const count = selectedLabelsForApi().length;
    if (count <= 0) return 1;
    if (count >= 10) return 10;
    return count;
}

async function saveSymptoms() {
    const savedLocal = persistSelectionsToLocal();
    const labels = selectedLabelsForApi();
    let savedRemote = false;
    let remoteError = '';

    try {
        const response = await fetch('/api/symptoms', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                log_date: getLogDate(),
                symptoms: labels,
                intensity: calculateIntensity(),
                notes: ''
            })
        });

        if (response.status === 401) {
            remoteError = 'Saved locally. Sign in to sync symptoms to your account.';
        } else {
            const data = await response.json();
            if (!response.ok) {
                remoteError = data.error || 'Could not sync to server. Saved locally.';
            } else {
                savedRemote = true;
            }
        }
    } catch (_err) {
        remoteError = 'Network issue. Symptoms were saved locally.';
    }

    if (!savedLocal) {
        showSuccessMessage('Could not write local data in this browser.', true);
        return;
    }

    if (savedRemote) {
        showSuccessMessage('Symptoms saved to your account.');
    } else {
        showSuccessMessage(remoteError || 'Symptoms saved locally.');
    }

    setTimeout(function() {
        window.location.href = 'index.html';
    }, 1500);
}

function showSuccessMessage(text, isError) {
    if (!document.getElementById('symptoms-toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'symptoms-toast-keyframes';
        style.textContent = '@keyframes popIn {0% {transform: translate(-50%, -50%) scale(0.8); opacity: 0;}100% {transform: translate(-50%, -50%) scale(1); opacity: 1;}}';
        document.head.appendChild(style);
    }

    const message = document.createElement('div');
    message.style.cssText =
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:' + (isError ? 'linear-gradient(135deg,#FF6B9D,#e85d86)' : 'linear-gradient(135deg,#7ED957,#6BC946)') + ';' +
        'color:white;padding:2rem 3rem;border-radius:20px;font-size:1rem;font-weight:600;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9999;animation:popIn 0.3s ease;';
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(function() {
        message.style.animation = 'popIn 0.25s ease reverse';
        setTimeout(function() {
            if (message.parentNode) message.remove();
        }, 260);
    }, 1200);
}

// ── Water tracker ──────────────────────────────────────────────────────────
function renderWaterGlasses() {
    var container = document.getElementById('waterGlasses');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < WATER_GOAL; i++) {
        var glass = document.createElement('button');
        glass.className = 'water-glass' + (i < waterGlasses ? ' filled' : '');
        glass.type = 'button';
        glass.title = ((i + 1) * 0.25).toFixed(2) + ' L';
        glass.innerHTML = '💧';
        glass.setAttribute('data-idx', i);
        glass.addEventListener('click', (function(idx) {
            return function() {
                // click on filled → remove from that glass onward; click on empty → fill up to that glass
                waterGlasses = (idx < waterGlasses) ? idx : idx + 1;
                renderWaterGlasses();
                updateWaterLabel();
            };
        })(i));
        container.appendChild(glass);
    }
}

function updateWaterLabel() {
    var label = document.getElementById('waterLabel');
    if (label) label.textContent = (waterGlasses * 0.25).toFixed(2) + ' / 2.25 L';
}

function adjustWater(delta) {
    waterGlasses = Math.max(0, Math.min(WATER_GOAL, waterGlasses + delta));
    renderWaterGlasses();
    updateWaterLabel();
}

// ── Weight logger ───────────────────────────────────────────────────────────
function logWeight() {
    var input = document.getElementById('weightInput');
    var saved = document.getElementById('weightSaved');
    if (!input || !saved) return;
    var val = parseFloat(input.value);
    if (isNaN(val) || val < 20 || val > 300) {
        saved.textContent = 'Please enter a valid weight (20–300 kg).';
        saved.style.color = '#e85d86';
        return;
    }
    saved.textContent = 'Logged: ' + val.toFixed(1) + ' kg';
    saved.style.color = 'var(--blush, #FF6B9D)';
}

function clearWeight() {
    var input = document.getElementById('weightInput');
    var saved = document.getElementById('weightSaved');
    if (input) input.value = '';
    if (saved) saved.textContent = '';
}

// ── Load saved water/weight for the log date ────────────────────────────────
function loadWaterWeightFromLocal() {
    var today = getLogDate();
    var allSymptoms = safeParseObject(localStorage.getItem('symptomsData'));
    var record = allSymptoms[today];
    if (!record) return;
    if (typeof record.water === 'number') {
        waterGlasses = Math.min(WATER_GOAL, Math.max(0, record.water));
        renderWaterGlasses();
        updateWaterLabel();
    }
    if (record.weight) {
        var input = document.getElementById('weightInput');
        var saved = document.getElementById('weightSaved');
        if (input) input.value = record.weight;
        if (saved) { saved.textContent = 'Logged: ' + parseFloat(record.weight).toFixed(1) + ' kg'; saved.style.color = 'var(--blush, #FF6B9D)'; }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Update page header to reflect the date being logged
    (function updateHeaderDate() {
        var logDate   = getLogDate();
        var today     = getTodayDate();
        var titleEl   = document.getElementById('symptomPageTitle');
        var subtitleEl= document.getElementById('symptomPageSubtitle');
        if (!titleEl) return;

        if (logDate === today) {
            titleEl.textContent = 'Today';
        } else {
            var d = new Date(logDate + 'T00:00:00');
            titleEl.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Compute cycle day for the log date
        if (subtitleEl) {
            try {
                var ud = JSON.parse(localStorage.getItem('userData') || '{}');
                var lastPeriod  = ud.lastPeriod   ? new Date(ud.lastPeriod)     : null;
                var cycleLength = parseInt(ud.cycleLength)  || 28;
                if (lastPeriod) {
                    var diff = Math.floor((new Date(logDate + 'T00:00:00') - lastPeriod) / 86400000);
                    var dayInCycle = ((diff % cycleLength) + cycleLength) % cycleLength;
                    subtitleEl.textContent = 'Cycle day ' + (dayInCycle + 1);
                } else {
                    subtitleEl.textContent = '';
                }
            } catch (_) {
                subtitleEl.textContent = '';
            }
        }
    })();

    document.querySelectorAll('.chip').forEach(function(chip) {
        chip.addEventListener('click', function() { toggleChip(chip); });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterSymptoms(searchInput.value);
        });
    }

    loadSavedSymptomsFromLocal();
    loadSavedSymptomsFromApi();
    updateSelectedDisplay();
});
