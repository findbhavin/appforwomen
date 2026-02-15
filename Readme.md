# ERAYA - Period Wellness App (Flask + Static Frontend)

ERAYA is a menstrual wellness web app with a Flask backend and a multi-page frontend.  
It includes authentication, doctor appointment booking, symptom logging, onboarding setup, wellness tools, and profile/settings pages.

---

## What was merged in this update

This repository now includes the updated frontend package (dashboard/page redesign, setup flow, wellness and symptoms upgrades) while **keeping the backend API and storage intact**.

### Functional changes merged

- Added onboarding pages:
  - `setup.html`
  - `setup.js`
- Added dedicated client scripts:
  - `symptoms.js` (enhanced symptom chip tracking + API sync + local fallback)
  - `wellness.js` (quotes, tips, nutrition tabs, meditation timer, hydration tracker)
- Updated major pages/UI:
  - `index.html`, `login.html`, `profile.html`, `settings.html`, `symptoms.html`, `wellness.html`
  - `styles.css` expanded with page-specific styling blocks
- Added image assets under:
  - `images/`

### Robustness improvements added during merge

- Preserved Flask API auth flow (`/api/login`, `/api/register`, `/api/me`) from frontend.
- Added defensive JSON parsing for localStorage (`safeParseObject`) in updated scripts.
- Added null/DOM guards to avoid runtime errors when elements are missing.
- Added graceful network fallback behavior:
  - Symptoms save to localStorage even if API is unavailable.
  - Wellness content falls back to local tips/quotes when external APIs fail.
- Kept appointments booking API behavior intact in `doctors.js` (`/api/appointments`).

---

## Architecture

### Backend

- **Flask app**: `main.py`
- **SQLite data layer**: `db.py`
- Session-based auth via secure cookies.
- Backend endpoints serve both API and static frontend files.

### Frontend

- Static HTML/CSS/JS pages served from Flask.
- `auth.js` helper for current user/session status on pages that use it.
- Some UX state (settings/profile/setup/wellness counters) stored in localStorage.
- Critical actions (login/register/appointments/symptoms) remain API-backed.

---

## Core API endpoints

### Auth

- `POST /api/register` -> create account and login session
- `POST /api/login` -> login
- `POST /api/logout` -> logout
- `GET /api/me` -> current user

### Appointments

- `GET /api/appointments` -> list appointments for logged-in user
- `POST /api/appointments` -> create appointment

### Symptoms

- `GET /api/symptoms?date=YYYY-MM-DD` -> single-day symptom log
- `GET /api/symptoms` -> recent logs
- `POST /api/symptoms` -> save symptom log

For endpoint-level implementation details, see:
- `main.py`
- `db.py`
- `BACKEND-GUIDANCE.md`

---

## Key pages and behavior

- `index.html`: dashboard + auth status + quick navigation
- `login.html`: login/register using backend API, then onboarding redirect for new signups
- `setup.html`: 3-step profile and cycle setup
- `doctors.html` + `doctors.js`: searchable doctor directory, contact modal, appointment booking
- `symptoms.html` + `symptoms.js`: detailed chip-based symptom tracking, API sync + local fallback
- `wellness.html` + `wellness.js`: quote feed, wellness tips, exercise modal, nutrition tabs, meditation timer
- `settings.html`: profile/cycle preferences (local storage), export data, local account cleanup
- `profile.html`: user/profile readout from session + local profile data

---

## Local development

### Prerequisites

- Python 3.10+
- pip

### Run locally

```bash
pip install -r requirements.txt
python3 main.py
```

Open:
- http://localhost:8080

> Important: open through Flask server, not by directly opening HTML files.

---

## Data behavior (important)

### Backend-persisted data

- Users/auth
- Appointments
- Symptom logs

### Local browser data

- `erayaUser` / `erayaUsers` (frontend convenience profile/session mirror)
- `userData` (setup/profile settings)
- `symptomsData` (local symptom backup/fallback)
- `wellnessStats` (client wellness counters)

This hybrid approach keeps critical functionality working even during temporary network/API interruptions.

---

## Deployment

### Docker

```bash
docker build -t eraya .
docker run -p 8080:8080 eraya
```

### Google Cloud Run

```bash
gcloud run deploy eraya --source . --region us-central1 --allow-unauthenticated
```

### Google App Engine

```bash
gcloud app deploy
```

---

## Notes

- Backend files were intentionally preserved during this merge (`main.py`, `db.py`, auth/symptoms/appointments APIs).
- Updated frontend was integrated with API compatibility retained.
- If you want, the next step can be adding backend endpoints for:
  - server-side settings persistence
  - secure password update
  - account deletion
