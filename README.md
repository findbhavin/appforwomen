# Eraya - Period Wellness Web App

Eraya is a Flask-based web app for menstrual wellness tracking and support.  
It combines a static multi-page frontend with a Python backend API for authentication, appointments, and symptom logs.

---

## Documentation Map

Start here, then use the linked docs for detail:

- [Docs Index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Frontend Flows](docs/FRONTEND_FLOWS.md)
- [Deployment and Operations](docs/DEPLOYMENT_OPERATIONS.md)
- [Backend Guidance (legacy deep dive)](BACKEND-GUIDANCE.md)

---

## What the App Includes

- Account registration, login, logout, and session-based auth
- Onboarding setup flow for new users
- Dashboard with auth-gated feature navigation
- Doctor discovery and appointment booking
- Symptom logging with API sync and local fallback
- Wellness tools (quotes, nutrition, exercises, meditation timer, hydration tracker)
- Profile and settings pages with local user preferences

---

## Tech Stack

- **Backend:** Flask, Gunicorn
- **Database:** SQLite (`eraya.db`) via `db.py`
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Deployment:** Docker, Google Cloud Run, Google App Engine

---

## Quick Start (Local)

### 1) Install dependencies

```bash
pip install -r requirements.txt
```

### 2) Run the app

```bash
python3 main.py
```

### 3) Open in browser

- `http://localhost:8080`

Use the server URL above (do not open HTML files directly from disk).

---

## Core User Journeys

### New user
1. Open `login.html`
2. Sign up
3. Complete `setup.html`
4. Redirect to dashboard (`index.html`)

### Existing user
1. Open `login.html`
2. Log in
3. Redirect to dashboard (`index.html`)

### Protected feature access from dashboard
- If not signed in:
  - New user path -> signup intent
  - Existing local user path -> login intent
- If signed in -> direct navigation to selected feature

Detailed behavior is documented in [Frontend Flows](docs/FRONTEND_FLOWS.md).

---

## API Surface (Summary)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me` |
| Appointments | `GET /api/appointments`, `POST /api/appointments` |
| Symptoms | `GET /api/symptoms`, `GET /api/symptoms?date=YYYY-MM-DD`, `POST /api/symptoms` |

Full request and response details: [API Reference](docs/API_REFERENCE.md).

---

## Data Persistence Model

### Backend-persisted (source of truth)
- Users and auth sessions
- Appointments
- Symptom logs

### Browser local storage (resilience and UX)
- `erayaUser`, `erayaUsers`
- `userData`, `userDataByEmail`
- `symptomsData`
- `wellnessStats`

This hybrid model keeps the UI usable during temporary network/API issues.

---

## Repo Structure

```text
.
|-- main.py                  # Flask app routes + static serving
|-- db.py                    # SQLite data layer
|-- app.yaml                 # App Engine configuration
|-- Dockerfile               # Container build and gunicorn runtime
|-- index.html               # Dashboard
|-- login.html               # Login + signup
|-- setup.html / setup.js    # Onboarding flow
|-- symptoms.html / symptoms.js
|-- wellness.html / wellness.js
|-- doctors.html / doctors.js
|-- profile.html
|-- settings.html
|-- styles.css
|-- auth.js                  # Shared auth helper
|-- images/
`-- docs/                    # Full project documentation
```

---

## Deployment

See [Deployment and Operations](docs/DEPLOYMENT_OPERATIONS.md) for complete instructions.

Quick command examples:

```bash
# Docker
docker build -t eraya .
docker run -p 8080:8080 eraya

# App Engine
gcloud app deploy

# Cloud Run (source deploy)
gcloud run deploy eraya --source .
```

---

## Notes

- The codebase currently uses session cookies and same-origin API access.
- For production hardening, always set a strong `SECRET_KEY`.
- If you move beyond SQLite for production, keep API contracts stable so frontend code does not need changes.

