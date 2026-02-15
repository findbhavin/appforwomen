"""
Eraya - Period Wellness App
Flask app: API (auth, appointments, symptoms) + static file serving.
"""
import os
from flask import Flask, send_from_directory, request, jsonify, session

# Disable Flask's built-in static route so our custom file serving logic controls caching.
app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get('SECRET_KEY', 'eraya-dev-secret-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# No CORS: app serves HTML and API from same origin. (flask-cors removed to avoid TypeError.)

STATIC_ASSET_EXTENSIONS = {
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot'
}


def static_max_age(path):
    """Use cache for static assets; keep HTML uncached for fresh releases."""
    ext = os.path.splitext(path)[1].lower()
    if ext in STATIC_ASSET_EXTENSIONS:
        return 86400  # 24 hours
    return 0

import db
db.init_db()


def require_login(f):
    """Decorator: require session user_id."""
    from functools import wraps
    @wraps(f)
    def wrapped(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return wrapped


# ---------- Auth API ----------
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    email = data.get('email') or ''
    password = data.get('password') or ''
    name = (data.get('name') or '').strip() or email.split('@')[0]
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    user_id, err = db.user_create(email, password, name)
    if err:
        return jsonify({'error': err}), 409
    session['user_id'] = user_id
    user = db.user_get_by_id(user_id)
    return jsonify({'user': user})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    from werkzeug.security import check_password_hash
    user = db.user_get_by_email(email)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401
    session['user_id'] = user['id']
    out = db.user_get_by_id(user['id'])
    return jsonify({'user': out})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user_id', None)
    return jsonify({'ok': True})


@app.route('/api/me', methods=['GET'])
def api_me():
    if 'user_id' not in session:
        return jsonify({'user': None})
    user = db.user_get_by_id(session['user_id'])
    return jsonify({'user': user})


# ---------- Appointments API ----------
@app.route('/api/appointments', methods=['GET'])
@require_login
def api_appointments_list():
    rows = db.appointment_list_by_user(session['user_id'])
    return jsonify({'appointments': rows})


@app.route('/api/appointments', methods=['POST'])
@require_login
def api_appointments_create():
    data = request.get_json() or {}
    doctor_id = data.get('doctor_id')
    doctor_name = (data.get('doctor_name') or '').strip()
    preferred_date = (data.get('preferred_date') or '').strip()
    preferred_time = (data.get('preferred_time') or '').strip()
    patient_name = (data.get('patient_name') or '').strip()
    patient_phone = (data.get('patient_phone') or '').strip()
    reason = (data.get('reason') or '').strip()
    if not doctor_name or not preferred_date or not preferred_time or not patient_name or not patient_phone:
        return jsonify({'error': 'Missing required fields'}), 400
    aid, err = db.appointment_create(
        session['user_id'], doctor_id or 0, doctor_name, preferred_date, preferred_time,
        patient_name, patient_phone, reason
    )
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'id': aid, 'message': 'Appointment requested successfully'})


# ---------- Symptoms API ----------
@app.route('/api/symptoms', methods=['GET'])
@require_login
def api_symptoms_list():
    log_date = request.args.get('date')
    if log_date:
        log = db.symptom_log_get(session['user_id'], log_date)
        return jsonify({'log': log})
    recent = db.symptom_log_list_recent(session['user_id'], limit=30)
    return jsonify({'logs': recent})


@app.route('/api/symptoms', methods=['POST'])
@require_login
def api_symptoms_create():
    data = request.get_json() or {}
    log_date = (data.get('log_date') or '').strip()
    symptoms = data.get('symptoms') or []
    intensity = int(data.get('intensity', 5))
    notes = (data.get('notes') or '').strip()
    if not log_date:
        return jsonify({'error': 'log_date required'}), 400
    lid, err = db.symptom_log_create(session['user_id'], log_date, symptoms, intensity, notes)
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'id': lid, 'message': 'Symptoms saved'})


# ---------- Static files (must be last) ----------
@app.route('/')
def index():
    return send_from_directory('.', 'index.html', max_age=0)


@app.route('/healthz')
def healthz():
    """Liveness endpoint for deployment diagnostics."""
    return jsonify({'ok': True})


@app.route('/favicon.ico')
def favicon():
    """Avoid 404 for browser favicon requests."""
    if os.path.isfile('favicon.ico'):
        return send_from_directory('.', 'favicon.ico')
    from flask import Response
    return Response(status=204)


@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    if os.path.isfile(path):
        return send_from_directory('.', path, max_age=static_max_age(path))
    if os.path.isfile(path + '.html'):
        return send_from_directory('.', path + '.html', max_age=0)
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
