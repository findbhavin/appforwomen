// doctorsData is populated at runtime from Overpass API (OpenStreetMap).
// Keeping the same variable name so every function below works unchanged.
let doctorsData = [];

let currentFilter = 'all';

// ── OSM specialty tag → your existing filter chip values ─────────────────────
// The keys are lowercased OSM tag values; the values match the chip onclick args
// in doctors.html: 'gynecologist', 'endocrinologist', 'nutritionist',
// 'therapist', 'pcos'.
const OSM_SPECIALTY_MAP = {
    'gynaecology': 'gynecologist',
    'gynecology': 'gynecologist',
    'obstetrics': 'gynecologist',
    'obstetrics and gynaecology': 'gynecologist',
    'obstetrics_gynaecology': 'gynecologist',
    'endocrinology': 'endocrinologist',
    'dietitian': 'nutritionist',
    'nutrition': 'nutritionist',
    'nutritionist': 'nutritionist',
    'dietetics': 'nutritionist',
    'psychologist': 'therapist',
    'psychiatry': 'therapist',
    'mental_health': 'therapist',
    'counselling': 'therapist',
    'psychology': 'therapist',
    'pcos': 'pcos',
    'reproductive_endocrinology': 'pcos',
};

// Reverse-geocode queue – Nominatim allows 1 req/s; we chain promises to throttle
let _geocodeChain = Promise.resolve();

function reverseGeocode(lat, lon) {
    _geocodeChain = _geocodeChain.then(function () {
        return new Promise(function (resolve) { setTimeout(resolve, 350); });
    }).then(function () {
        return fetch(
            'https://nominatim.openstreetmap.org/reverse?lat=' + lat +
            '&lon=' + lon + '&format=json&addressdetails=1',
            { headers: { 'Accept-Language': 'en' } }
        )
            .then(function (r) { return r.json(); })
            .then(function (json) {
                var a = json.address || {};
                var parts = [
                    a.road || a.pedestrian || a.footway,
                    a.suburb || a.neighbourhood || a.quarter,
                    a.city || a.town || a.village,
                    a.postcode
                ].filter(Boolean);
                return parts.length ? parts.join(', ') : (json.display_name || null);
            })
            .catch(function () { return null; });
    });
    return _geocodeChain;
}

// Convert one OSM element into the same shape as the old hardcoded objects
function osmToDoctor(el, index) {
    var tags = el.tags || {};
    var name = tags.name || tags['name:en'] || null;
    if (!name) return null;

    // Coordinates
    var lat = el.lat != null ? el.lat : (el.center ? el.center.lat : null);
    var lon = el.lon != null ? el.lon : (el.center ? el.center.lon : null);

    // Specialty – try several OSM tags in priority order
    var rawSpec = (
        tags['healthcare:speciality'] ||
        tags['healthcare:specialty'] ||
        tags['speciality'] ||
        tags['healthcare'] ||
        tags['amenity'] ||
        ''
    ).toLowerCase().trim();

    var specialty = OSM_SPECIALTY_MAP[rawSpec] || 'gynecologist'; // default bucket

    // Avatar – alternate by index so cards look varied
    var avatar = index % 2 === 0 ? '👩‍⚕️' : '👨‍⚕️';

    // Phone
    var phone = tags.phone || tags['contact:phone'] || tags['telephone'] || null;

    // Email
    var email = tags.email || tags['contact:email'] || null;

    // Hospital / clinic name (fall back to the name itself)
    var hospital = tags['operator'] || tags['brand'] || name;

    // Address from OSM tags (fast path – no extra HTTP request needed)
    var addrParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'] || tags['addr:neighbourhood'],
        tags['addr:city'],
        tags['addr:postcode']
    ].filter(Boolean);
    var location = addrParts.length ? addrParts.join(', ') : null;

    return {
        _lat: lat,
        _lon: lon,
        _needsGeocode: !location,
        id: el.id,
        name: name,
        specialty: specialty,
        avatar: avatar,
        rating: null,   // OSM has no ratings
        reviews: null,
        experience: null,
        location: location || 'Fetching address…',
        hospital: hospital,
        phone: phone,
        email: email,
        available: true,   // OSM has no live availability
        consultationFee: null
    };
}

// Fetch real doctors from Overpass API then resolve addresses via Nominatim
// One Overpass query per specialty so results are correctly tagged
// even when OSM nodes have no healthcare:speciality tag.
var SPECIALTY_QUERIES = [
    { specialty: 'gynecologist', keywords: 'gynaecolog|gynecolog|obstetric' },
    { specialty: 'endocrinologist', keywords: 'endocrinolog|diabetes|thyroid' },
    { specialty: 'nutritionist', keywords: 'diet|nutrition|nutritionist' },
    { specialty: 'therapist', keywords: 'psycholog|psychiatr|mental_health|counsell' },
    { specialty: 'pcos', keywords: 'pcos|reproductive_endocrinolog|fertility' }
];

var OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter'
];

function buildSpecialtyQuery(lat, lon, radius, keywords) {
    return [
        '[out:json][timeout:25];',
        '(',
        '  node["healthcare:speciality"~"' + keywords + '",i](around:' + radius + ',' + lat + ',' + lon + ');',
        '  node["healthcare:specialty"~"' + keywords + '",i](around:' + radius + ',' + lat + ',' + lon + ');',
        '  node["name"~"' + keywords + '",i](around:' + radius + ',' + lat + ',' + lon + ');',
        ');',
        'out 10;'
    ].join('\n');
}

function fetchFromEndpoint(query, endpointIndex) {
    if (endpointIndex >= OVERPASS_ENDPOINTS.length) {
        return Promise.reject(new Error('All endpoints failed'));
    }
    var url = OVERPASS_ENDPOINTS[endpointIndex] + '?data=' + encodeURIComponent(query);
    return fetch(url, { signal: AbortSignal.timeout(20000) })
        .then(function (r) {
            if (!r.ok) throw new Error('Overpass returned ' + r.status);
            return r.json();
        })
        .catch(function (err) {
            console.warn('Endpoint ' + OVERPASS_ENDPOINTS[endpointIndex] + ' failed:', err.message);
            return fetchFromEndpoint(query, endpointIndex + 1);
        });
}

function fetchDoctorsFromOSM(lat, lon) {
    var radius = 4000;

    showLoadingState();

    var promises = SPECIALTY_QUERIES.map(function (spec) {
        var query = buildSpecialtyQuery(lat, lon, radius, spec.keywords);
        return fetchFromEndpoint(query, 0)
            .then(function (data) {
                return (data.elements || [])
                    .map(function (el, i) {
                        var doc = osmToDoctor(el, i);
                        if (doc) doc.specialty = spec.specialty;
                        return doc;
                    })
                    .filter(Boolean);
            })
            .catch(function () { return []; });
    });

    Promise.all(promises).then(function (results) {
        var seen = {};
        var all = [];
        results.forEach(function (group) {
            group.forEach(function (doc) {
                if (!seen[doc.id]) {
                    seen[doc.id] = true;
                    all.push(doc);
                }
            });
        });

        if (all.length === 0) {
            showNoResults('No specialist doctors found within 4 km. OSM data may be limited in your area.');
            return;
        }

        doctorsData = all;
        displayDoctors(doctorsData);

        var needsGeocode = all.filter(function (d) { return d._needsGeocode && d._lat; });
        needsGeocode.forEach(function (doc) {
            reverseGeocode(doc._lat, doc._lon).then(function (addr) {
                if (addr) {
                    doc.location = addr;
                    var grid = document.getElementById('doctorsGrid');
                    if (grid) {
                        var cardEl = grid.querySelector('[data-id="' + doc.id + '"]');
                        if (cardEl) {
                            var locSpan = cardEl.querySelector('.doctor-location-text');
                            if (locSpan) locSpan.textContent = addr;
                        }
                    }
                }
            });
        });
    });
}

// Show a loading message in the grid (same grid element, no UI change)
function showLoadingState() {
    var grid = document.getElementById('doctorsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">' +
        '<div style="font-size:2rem;margin-bottom:1rem;">📍</div>' +
        '<p>Finding nearby doctors…</p>' +
        '<p style="font-size:0.85rem;margin-top:6px;">Please allow location access when prompted.</p>' +
        '</div>';
}

function showNoResults(msg) {
    var grid = document.getElementById('doctorsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">' +
        '<div style="font-size:2rem;margin-bottom:1rem;">🔍</div>' +
        '<p>' + msg + '</p></div>';
}

// Initialize page – ask for location, then fetch real data
document.addEventListener('DOMContentLoaded', function () {
    // Wire up search input
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchDoctors();
            }
        });
    }

    // Fetch doctors
    if (!navigator.geolocation) {
        // Browser has no geolocation – fall back to Vellore city centre
        fetchDoctorsFromOSM(12.9165, 79.1325);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            fetchDoctorsFromOSM(pos.coords.latitude, pos.coords.longitude);
        },
        function () {
            // User denied or timed out – fall back to Vellore city centre
            fetchDoctorsFromOSM(12.9165, 79.1325);
        },
        { timeout: 10000 }
    );
});

// Display doctors
function displayDoctors(doctors) {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    doctors.forEach(doctor => {
        const card = createDoctorCard(doctor);
        grid.appendChild(card);
    });
}

// Create doctor card
function createDoctorCard(doctor) {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.setAttribute('data-specialty', doctor.specialty);

    const stars = doctor.rating ? '⭐'.repeat(Math.floor(doctor.rating)) : '';
    const ratingText = doctor.rating
        ? `<span class="stars">${stars}</span><span>${doctor.rating}${doctor.reviews ? ' (' + doctor.reviews + ' reviews)' : ''}</span>`
        : '<span style="color:#aaa;font-size:0.85rem;">Rating not available</span>';

    const availableBadge = doctor.available ?
        '<span class="available-badge">Available Today</span>' :
        '<span class="unavailable-badge">Not Available</span>';

    const experienceRow = doctor.experience
        ? `<div class="detail-row"><span class="detail-icon">💼</span><span>${doctor.experience} years experience</span></div>`
        : '';

    const feeRow = doctor.consultationFee
        ? `<div class="detail-row"><span class="detail-icon">💰</span><span>Consultation: ${doctor.consultationFee}</span></div>`
        : '';

    card.setAttribute('data-id', doctor.id);
    card.innerHTML = `
        <div class="doctor-header">
            <div class="doctor-avatar">${doctor.avatar}</div>
            <div class="doctor-basic-info">
                <h3>${doctor.name}</h3>
                <div class="doctor-specialty">${capitalizeSpecialty(doctor.specialty)}</div>
                <div class="rating">${ratingText}</div>
                ${availableBadge}
            </div>
        </div>
        <div class="doctor-details">
            <div class="detail-row">
                <span class="detail-icon">📍</span>
                <span class="doctor-location-text">${doctor.location}</span>
            </div>
            ${experienceRow}
            <div class="detail-row">
                <span class="detail-icon">🏥</span>
                <span>${doctor.hospital}</span>
            </div>
            ${feeRow}
        </div>
        <div class="doctor-actions">
            <button class="contact-btn" onclick="contactDoctor(${doctor.id})">
                📞 Contact
            </button>
            <button class="book-btn" onclick="bookAppointment(${doctor.id})">
                Book Appointment
            </button>
        </div>
    `;

    return card;
}

// Capitalize specialty
function capitalizeSpecialty(specialty) {
    const specialtyMap = {
        'gynecologist': 'Gynecologist',
        'endocrinologist': 'Endocrinologist',
        'nutritionist': 'Nutritionist',
        'therapist': 'Therapist',
        'pcos': 'PCOS Specialist'
    };
    return specialtyMap[specialty] || specialty;
}

// Filter doctors
function filterDoctors(specialty, element) {
    // Update active chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    element.classList.add('active');

    currentFilter = specialty;

    // Filter and display
    if (specialty === 'all') {
        displayDoctors(doctorsData);
    } else {
        const filtered = doctorsData.filter(doc => doc.specialty === specialty);
        displayDoctors(filtered);
    }
}

// Search doctors
function searchDoctors() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';

    const filtered = doctorsData.filter(doctor => {
        return doctor.name.toLowerCase().includes(searchTerm) ||
            doctor.specialty.toLowerCase().includes(searchTerm) ||
            doctor.location.toLowerCase().includes(searchTerm) ||
            doctor.hospital.toLowerCase().includes(searchTerm);
    });

    displayDoctors(filtered);
}

// Contact doctor
function contactDoctor(doctorId) {
    const doctor = doctorsData.find(d => d.id === doctorId);
    if (!doctor) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content contact-modal">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            <h2>Contact ${doctor.name}</h2>
            <div class="contact-details">
                <div class="contact-detail-item">
                    <span class="detail-label">📱 Phone:</span>
                    <a href="tel:${doctor.phone}" class="detail-value">${doctor.phone}</a>
                </div>
                <div class="contact-detail-item">
                    <span class="detail-label">📧 Email:</span>
                    <a href="mailto:${doctor.email}" class="detail-value">${doctor.email}</a>
                </div>
                <div class="contact-detail-item">
                    <span class="detail-label">🏥 Hospital:</span>
                    <span class="detail-value">${doctor.hospital}</span>
                </div>
                <div class="contact-detail-item">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${doctor.location}</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn call-btn" onclick="window.location.href='tel:${doctor.phone}'">
                    📞 Call Now
                </button>
                <button class="modal-btn email-btn" onclick="window.location.href='mailto:${doctor.email}'">
                    📧 Send Email
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Book appointment
function bookAppointment(doctorId) {
    const doctor = doctorsData.find(d => d.id === doctorId);
    if (!doctor) return;

    if (!doctor.available) {
        alert('Sorry, this doctor is not available today. Please try another day or contact them directly.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content booking-modal">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            <h2>Book Appointment with ${doctor.name}</h2>
            <form onsubmit="submitBooking(event, ${doctorId})">
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" name="patient_name" required placeholder="Enter your full name">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="patient_phone" required placeholder="Enter your phone number">
                </div>
                <div class="form-group">
                    <label>Preferred Date</label>
                    <input type="date" name="preferred_date" required min="${getTodayDate()}">
                </div>
                <div class="form-group">
                    <label>Preferred Time</label>
                    <select name="preferred_time" required>
                        <option value="">Select time slot</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reason for Visit (Optional)</label>
                    <textarea name="reason" placeholder="Brief description of your concerns"></textarea>
                </div>
                <div class="booking-summary">
                    <div class="summary-row">
                        <span>Consultation Fee:</span>
                        <span class="fee">${doctor.consultationFee}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="modal-btn cancel-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="modal-btn confirm-btn">Confirm Booking</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Submit booking (sends to server when logged in)
function submitBooking(event, doctorId) {
    event.preventDefault();
    const doctor = doctorsData.find(d => d.id === doctorId);
    if (!doctor) return;

    const form = event.target;
    const payload = {
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        preferred_date: form.elements['preferred_date'].value,
        preferred_time: form.elements['preferred_time'].value,
        patient_name: form.elements['patient_name'].value,
        patient_phone: form.elements['patient_phone'].value,
        reason: (form.elements['reason'] && form.elements['reason'].value) || ''
    };

    const opts = { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
    fetch('/api/appointments', opts)
        .then(function (r) {
            if (r.status === 401) {
                if (confirm('Please sign in to book an appointment. Go to login?')) {
                    window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
                }
                return null;
            }
            return r.json();
        })
        .then(function (data) {
            if (!data) return;
            const overlay = event.target.closest('.modal-overlay');
            if (overlay) overlay.remove();
            if (data.error) {
                alert(data.error);
            } else {
                alert('Appointment requested successfully with ' + doctor.name + '. You will be contacted to confirm.');
            }
        })
        .catch(function () {
            alert('Could not save appointment. Check your connection and try again.');
        });
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Call emergency
function callEmergency() {
    if (confirm('This will call emergency services. Do you want to proceed?')) {
        window.location.href = 'tel:112';
    }
}


