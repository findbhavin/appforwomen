const FALLBACK_QUOTES = [
    { text: 'Your body is your most priceless possession. Take care of it.', author: 'Jack Lalanne' },
    { text: 'Health is a state of body, wellness is a state of being.', author: 'J. Stanford' },
    { text: 'Take care of your body. It is the only place you have to live.', author: 'Jim Rohn' },
    { text: 'Self-care is giving the world the best of you, instead of what is left of you.', author: 'Katie Reed' },
    { text: 'Wellness is the complete integration of body, mind, and spirit.', author: 'Greg Anderson' }
];

const BASE_PERIOD_TIPS = [
    {
        title: 'Stay Hydrated',
        description: 'Drinking plenty of water helps reduce bloating and can ease menstrual cramps. Aim for 8-10 glasses daily.'
    },
    {
        title: 'Gentle Movement',
        description: 'Light exercise like walking or yoga can help reduce period pain and boost your mood through endorphin release.'
    },
    {
        title: 'Heat Therapy',
        description: 'Apply a heating pad to your lower abdomen for 15-20 minutes to relax muscles and relieve cramps.'
    },
    {
        title: 'Magnesium-Rich Foods',
        description: 'Include foods like spinach, almonds, and dark chocolate to help reduce cramps and muscle tension.'
    },
    {
        title: 'Quality Sleep',
        description: 'Aim for 7-9 hours of sleep to help regulate hormones and reduce fatigue during your period.'
    },
    {
        title: 'Reduce Caffeine',
        description: 'Limiting caffeine can help reduce breast tenderness and anxiety during your menstrual cycle.'
    }
];

const NUTRITION_DATA = {
    menstrual: [
        { icon: '🥬', name: 'Leafy Greens - Iron boost' },
        { icon: '🐟', name: 'Salmon - Omega-3 for pain relief' },
        { icon: '🍫', name: 'Dark Chocolate - Magnesium and comfort' },
        { icon: '🥜', name: 'Nuts and Seeds - Reduce inflammation' },
        { icon: '🍓', name: 'Berries - Antioxidants' },
        { icon: '🥑', name: 'Avocado - Healthy fats' }
    ],
    follicular: [
        { icon: '🥚', name: 'Eggs - Protein and B vitamins' },
        { icon: '🥦', name: 'Broccoli - Estrogen balance' },
        { icon: '🫐', name: 'Blueberries - Energy boost' },
        { icon: '🌰', name: 'Brazil Nuts - Selenium' },
        { icon: '🥕', name: 'Carrots - Beta-carotene' },
        { icon: '🫘', name: 'Lentils - Plant protein' }
    ],
    ovulation: [
        { icon: '🍊', name: 'Citrus Fruits - Vitamin C' },
        { icon: '🥬', name: 'Spinach - Folate' },
        { icon: '🫐', name: 'Berries - Antioxidants' },
        { icon: '🥜', name: 'Almonds - Vitamin E' },
        { icon: '🫑', name: 'Bell Peppers - Vitamin C' },
        { icon: '🥥', name: 'Coconut - Healthy fats' }
    ],
    luteal: [
        { icon: '🍠', name: 'Sweet Potatoes - Complex carbs' },
        { icon: '🥬', name: 'Dark Leafy Greens - Calcium' },
        { icon: '🍌', name: 'Bananas - B6 for mood' },
        { icon: '🌻', name: 'Sunflower Seeds - Vitamin E' },
        { icon: '🥜', name: 'Chickpeas - Magnesium' },
        { icon: '🍫', name: 'Dark Chocolate - Mood support' }
    ]
};

const EXERCISE_DETAILS = {
    yoga: {
        title: 'Gentle Yoga Flow',
        duration: '15-20 minutes',
        benefits: 'Reduces cramps, improves flexibility, calms mind',
        bulletsTitle: 'Recommended Poses',
        bullets: ['Child\'s Pose', 'Cat-Cow', 'Reclined Twist', 'Legs Up The Wall']
    },
    walking: {
        title: 'Light Walking',
        duration: '20-30 minutes',
        benefits: 'Boosts circulation, reduces bloating, improves mood',
        bulletsTitle: 'Helpful Tips',
        bullets: ['Start slow', 'Maintain steady pace', 'Breathe deeply']
    },
    stretching: {
        title: 'Gentle Stretching',
        duration: '10-15 minutes',
        benefits: 'Relieves muscle tension, improves blood flow',
        bulletsTitle: 'Focus Areas',
        bullets: ['Lower back', 'Hips', 'Legs', 'Shoulders']
    }
};

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

function getRandomItem(list) {
    if (!Array.isArray(list) || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
}

function ensureRuntimeStyles() {
    if (document.getElementById('wellness-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'wellness-runtime-style';
    style.textContent = '@keyframes slideInRight {from {transform: translateX(400px); opacity: 0;}to {transform: translateX(0); opacity: 1;}}';
    document.head.appendChild(style);
}

async function fetchDailyQuote() {
    try {
        const response = await fetch('https://api.quotable.io/quotes/random?tags=inspirational|wellness|health');
        if (!response.ok) throw new Error('Quote API failed');
        const data = await response.json();
        const quote = Array.isArray(data) ? data[0] : data;
        if (!quote || !quote.content) throw new Error('Unexpected quote response');
        displayQuote(quote.content, quote.author || 'Unknown');
    } catch (_err) {
        const fallback = getRandomItem(FALLBACK_QUOTES);
        if (fallback) displayQuote(fallback.text, fallback.author);
    }
}

function displayQuote(text, author) {
    const quoteContent = document.getElementById('quoteContent');
    if (!quoteContent) return;
    quoteContent.innerHTML =
        '<p class="quote-text">"' + String(text || '') + '"</p>' +
        '<p class="quote-author">- ' + String(author || 'Unknown') + '</p>';
}

function fetchNewQuote() {
    const quoteContent = document.getElementById('quoteContent');
    if (quoteContent) quoteContent.innerHTML = '<div class="loading">Loading new inspiration...</div>';
    fetchDailyQuote();
}

async function loadHealthTips() {
    const tipsContent = document.getElementById('tipsContent');
    if (!tipsContent) return;

    const periodTips = BASE_PERIOD_TIPS.slice();
    try {
        const response = await fetch('https://api.adviceslip.com/advice');
        if (response.ok) {
            const data = await response.json();
            if (data && data.slip && data.slip.advice) {
                periodTips.push({
                    title: 'Wellness Wisdom',
                    description: data.slip.advice
                });
            }
        }
    } catch (_err) {
        // Local tips remain available.
    }

    const selectedTips = periodTips.slice().sort(function() {
        return Math.random() - 0.5;
    }).slice(0, 4);

    tipsContent.innerHTML = selectedTips.map(function(tip, index) {
        return (
            '<div class="tip-item" style="animation-delay: ' + (index * 0.1) + 's">' +
                '<h3>' + tip.title + '</h3>' +
                '<p>' + tip.description + '</p>' +
            '</div>'
        );
    }).join('');
}

function showPhase(phase, triggerButton) {
    document.querySelectorAll('.tab-btn').forEach(function(button) {
        const isActive = button === triggerButton || button.getAttribute('data-phase') === phase;
        button.classList.toggle('active', isActive);
    });
    loadNutritionPhase(phase);
}

function loadNutritionPhase(phase) {
    const nutritionContent = document.getElementById('nutritionContent');
    if (!nutritionContent) return;
    const foods = NUTRITION_DATA[phase] || [];
    if (!foods.length) {
        nutritionContent.innerHTML = '<div class="loading">No nutrition data available for this phase.</div>';
        return;
    }

    nutritionContent.innerHTML = (
        '<div class="nutrition-list">' +
        foods.map(function(food, index) {
            return (
                '<div class="nutrition-item" style="animation-delay: ' + (index * 0.05) + 's">' +
                    '<span>' + food.icon + '</span>' +
                    '<span>' + food.name + '</span>' +
                '</div>'
            );
        }).join('') +
        '</div>'
    );
}

function closeOpenWellnessModal() {
    const existing = document.querySelector('.wellness-modal-overlay');
    if (existing) existing.remove();
}

function showExerciseDetails(type) {
    const exercise = EXERCISE_DETAILS[type];
    if (!exercise) return;
    closeOpenWellnessModal();

    const overlay = document.createElement('div');
    overlay.className = 'wellness-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.3s ease;';

    const listItems = exercise.bullets.map(function(item) {
        return '<li>' + item + '</li>';
    }).join('');

    overlay.innerHTML =
        '<div style="background:white;padding:2rem;border-radius:20px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
            '<h2 style="color:#2D2D2D;margin-bottom:1rem;">' + exercise.title + '</h2>' +
            '<p style="color:#CF7486;font-weight:600;margin-bottom:1rem;">Duration: ' + exercise.duration + '</p>' +
            '<p style="margin-bottom:1rem;line-height:1.6;"><strong>Benefits:</strong> ' + exercise.benefits + '</p>' +
            '<div style="margin-bottom:1rem;"><strong>' + exercise.bulletsTitle + ':</strong><ul style="margin-left:1.5rem;margin-top:0.5rem;">' + listItems + '</ul></div>' +
            '<button id="closeExerciseModal" type="button" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,#CF7486,#B06676);color:white;border:none;border-radius:12px;font-weight:600;cursor:pointer;margin-top:1rem;">Close</button>' +
        '</div>';

    document.body.appendChild(overlay);
    const closeButton = overlay.querySelector('#closeExerciseModal');
    if (closeButton) closeButton.addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) overlay.remove();
    });
}

function formatTime(totalSeconds) {
    const safe = Math.max(0, totalSeconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return mins + ':' + String(secs).padStart(2, '0');
}

function completeMeditation(overlay, minutes) {
    overlay.innerHTML =
        '<div style="text-align:center;color:white;">' +
            '<div style="font-size:4rem;margin-bottom:1rem;">✓</div>' +
            '<h2 style="font-size:2.3rem;margin-bottom:1rem;">Session Complete!</h2>' +
            '<p style="font-size:1.1rem;margin-bottom:2rem;">You meditated for ' + minutes + ' minutes</p>' +
            '<button id="closeMeditationDone" type="button" style="padding:1rem 2rem;background:white;color:#CF7486;border:none;border-radius:12px;font-weight:600;cursor:pointer;font-size:1.1rem;">Done</button>' +
        '</div>';
    updateMeditationStats(minutes);
    const doneButton = overlay.querySelector('#closeMeditationDone');
    if (doneButton) doneButton.addEventListener('click', function() { overlay.remove(); });
}

function startMeditation(minutes) {
    const parsedMinutes = parseInt(minutes, 10);
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
        showNotification('Invalid meditation duration.', true);
        return;
    }

    closeOpenWellnessModal();

    const overlay = document.createElement('div');
    overlay.className = 'wellness-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,rgba(248,187,208,0.95) 0%,rgba(255,230,237,0.95) 100%);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.5s ease;';

    let remainingSeconds = parsedMinutes * 60;
    overlay.innerHTML =
        '<div style="text-align:center;color:white;">' +
            '<h2 style="font-size:2.5rem;margin-bottom:2rem;">Meditation Session</h2>' +
            '<div id="meditationTimer" style="font-size:5rem;font-weight:700;margin-bottom:2rem;">' + formatTime(remainingSeconds) + '</div>' +
            '<p style="font-size:1.2rem;margin-bottom:2rem;">Breathe deeply and relax...</p>' +
            '<button id="stopMeditation" type="button" style="padding:1rem 2rem;background:rgba(255,255,255,0.3);color:white;border:2px solid white;border-radius:12px;font-weight:600;cursor:pointer;font-size:1.1rem;">End Session</button>' +
        '</div>';

    document.body.appendChild(overlay);

    const timerInterval = window.setInterval(function() {
        remainingSeconds -= 1;
        const timerDisplay = overlay.querySelector('#meditationTimer');
        if (timerDisplay) timerDisplay.textContent = formatTime(remainingSeconds);
        if (remainingSeconds <= 0) {
            window.clearInterval(timerInterval);
            completeMeditation(overlay, parsedMinutes);
        }
    }, 1000);

    const stopButton = overlay.querySelector('#stopMeditation');
    if (stopButton) {
        stopButton.addEventListener('click', function() {
            window.clearInterval(timerInterval);
            overlay.remove();
        });
    }

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            window.clearInterval(timerInterval);
            overlay.remove();
        }
    });
}

function getWellnessStats() {
    return safeParseObject(localStorage.getItem('wellnessStats'));
}

function setWellnessStats(stats) {
    try {
        localStorage.setItem('wellnessStats', JSON.stringify(stats));
        return true;
    } catch (_err) {
        return false;
    }
}

function loadUserStats() {
    const stats = getWellnessStats();
    const symptomsByDate = safeParseObject(localStorage.getItem('symptomsData'));
    const derivedDaysTracked = Object.keys(symptomsByDate).length;
    const daysTracked = Number(stats.daysTracked || derivedDaysTracked || 0);

    const daysElement = document.getElementById('daysTracked');
    const workoutsElement = document.getElementById('workoutsCompleted');
    const meditationElement = document.getElementById('meditationMinutes');

    if (daysElement) daysElement.textContent = String(daysTracked);
    if (workoutsElement) workoutsElement.textContent = String(Number(stats.workouts || 0));
    if (meditationElement) meditationElement.textContent = String(Number(stats.meditation || 0));
}

function updateMeditationStats(minutes) {
    const stats = getWellnessStats();
    stats.meditation = Number(stats.meditation || 0) + Number(minutes || 0);
    setWellnessStats(stats);
    loadUserStats();
}

function trackWater() {
    const stats = getWellnessStats();
    if (!stats.waterByDate || typeof stats.waterByDate !== 'object') {
        stats.waterByDate = {};
    }
    const today = getTodayDate();
    stats.waterByDate[today] = Number(stats.waterByDate[today] || 0) + 1;
    stats.waterGlasses = stats.waterByDate[today];

    if (!setWellnessStats(stats)) {
        showNotification('Could not save water tracking in this browser.', true);
        return;
    }
    showNotification('Water logged! Total today: ' + stats.waterByDate[today] + ' glasses');
}

function showNotification(message, isError) {
    const notification = document.createElement('div');
    notification.style.cssText =
        'position:fixed;top:20px;right:20px;' +
        'background:' + (isError ? 'linear-gradient(135deg,#FF6B9D,#e85d86)' : 'linear-gradient(135deg,#7ED957,#6BC946)') + ';' +
        'color:white;padding:1rem 1.5rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.2);' +
        'z-index:10000;animation:slideInRight 0.3s ease;';
    notification.textContent = message;
    document.body.appendChild(notification);
    window.setTimeout(function() {
        if (notification.parentNode) notification.remove();
    }, 3000);
}

function animateCards() {
    document.querySelectorAll('.wellness-card').forEach(function(card, index) {
        card.style.animationDelay = String(index * 0.1) + 's';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    ensureRuntimeStyles();
    fetchDailyQuote();
    loadHealthTips();
    loadNutritionPhase('menstrual');
    loadUserStats();
    animateCards();
});
