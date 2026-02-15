# Architecture

[Back to README](../README.md) | [API Reference](API_REFERENCE.md) | [Frontend Flows](FRONTEND_FLOWS.md) | [Deployment and Operations](DEPLOYMENT_OPERATIONS.md)

---

## 1) High-Level Design

Eraya is a **single Flask application** that:

- serves JSON APIs under `/api/*`
- serves static frontend assets (HTML/CSS/JS/images)
- stores data in SQLite through a dedicated data layer (`db.py`)

```text
Browser (HTML/CSS/JS)
        |
        |  fetch + credentials: 'include'
        v
Flask app (main.py)
  - Auth API
  - Appointment API
  - Symptoms API
  - Static file routes
        |
        v
SQLite (eraya.db via db.py)
```

---

## 2) Backend Components

### `main.py`

Responsibilities:

- Flask app setup and session configuration
- API route definitions
- login-required decorator (`require_login`)
- static file serving routes

Key API groups:

- Auth: register/login/logout/current user
- Appointments: create/list
- Symptoms: create/list/get by date

### `db.py`

Responsibilities:

- initialize DB schema (`init_db()`)
- CRUD-like operations for users, appointments, symptoms
- database connection management (`get_db()` context manager)

Schema tables:

- `users`
- `appointments`
- `symptom_logs`

---

## 3) Frontend Components

The app is multi-page and uses vanilla JavaScript per feature:

- `index.html` + `script.js`: dashboard, calendar, feature navigation
- `login.html`: login/signup UI and auth redirects
- `setup.html` + `setup.js`: onboarding profile setup
- `doctors.html` + `doctors.js`: doctor browsing and appointment booking
- `symptoms.html` + `symptoms.js`: symptom selection, save, restore
- `wellness.html` + `wellness.js`: wellness tools and content
- `profile.html`, `settings.html`: user profile/preferences views

Shared helper:

- `auth.js`: current user checks, login requirement, authenticated fetch helper

---

## 4) Authentication Model

- Session cookie-based auth (Flask `session`)
- Frontend calls API with `credentials: 'include'`
- Protected endpoints return `401` with `{ "error": "Login required" }`

Behavior summary:

- New user signup -> setup flow -> dashboard
- Existing user login -> dashboard
- Dashboard feature cards are auth-gated

---

## 5) Data Storage Strategy

### Server-side (authoritative)
- users
- appointments
- symptom logs

### Client-side local storage (fallback/UX continuity)
- `erayaUser`, `erayaUsers`
- `userData`, `userDataByEmail`
- `symptomsData`
- `wellnessStats`

This allows graceful degradation during temporary API/network instability.

---

## 6) Performance and Reliability Notes

Recent reliability improvements include:

- request timeout handling in frontend auth-related calls
- quick fallback navigation when auth checks are slow
- threaded gunicorn runtime for better concurrency
- static asset cache headers for CSS/JS/images

Operational detail is documented in [Deployment and Operations](DEPLOYMENT_OPERATIONS.md).

---

## 7) Security Considerations

- Set a strong `SECRET_KEY` in production.
- Use HTTPS-only deployment for session safety.
- Keep same-origin API architecture to simplify cookie handling.
- For production scale and persistence, consider Cloud SQL/Firestore instead of local SQLite file storage.

