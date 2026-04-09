# Eraya - Women's Health & Wellness App
## Detailed Presentation Outline

---

## Slide 1: Title Slide

- **App Name:** Eraya
- **Tagline:** "Your Personal Period & Wellness Companion"
- **Target Audience:** Women of reproductive age seeking to track menstrual cycles, symptoms, and overall wellness
- **Presenter / Team Info**

---

## Slide 2: Problem Statement

- Women lack a single, unified platform for managing menstrual health holistically
- Existing period trackers are narrow in scope -- they track dates but miss symptoms, nutrition, mental health, and doctor coordination
- Cycle-related information (phase-based nutrition, exercise, productivity) is scattered across multiple apps and websites
- Privacy concerns with mainstream apps sharing sensitive health data

---

## Slide 3: Solution Overview

- **Eraya** is a full-stack web application that provides:
  - Menstrual cycle tracking with predictive insights
  - Comprehensive symptom logging (100+ options across 12 categories)
  - Phase-aware wellness guidance (nutrition, exercise, meditation)
  - Healthcare provider directory with appointment booking
  - AI-powered health assistant chatbot
  - Personalized onboarding and profile management
- All wrapped in a clean, modern, pink-themed UI with a calming user experience

---

## Slide 4: Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| **Backend**    | Python 3.12, Flask 3.0+                          |
| **Database**   | SQLite (local persistence)                       |
| **Frontend**   | HTML5, CSS3, Vanilla JavaScript (ES6+)           |
| **UI Library** | React 18 (UMD bundles, no build step required)   |
| **AI/Chat**    | Google Gemini 1.5 Flash API                      |
| **Maps/Geo**   | OpenStreetMap (Overpass API + Nominatim)          |
| **Email**      | EmailJS (client-side welcome & login alerts)      |
| **Server**     | Gunicorn (WSGI, multi-threaded)                   |
| **Deployment** | Docker, Google Cloud Run, Google App Engine        |

---

## Slide 5: Architecture Diagram

```
+-----------------------------------------------------------+
|                       Browser (Client)                     |
|                                                            |
|  HTML Pages    Vanilla JS    React 18 Components           |
|  (login, setup,  (auth, setup,   (Calendar, CycleCounter, |
|   dashboard,      doctors,        HistorySection,          |
|   symptoms...)    symptoms...)    SymptomTracker)           |
|                                                            |
|  +-- EmailJS (welcome/login emails)                        |
|  +-- Gemini API (AI chatbot)                               |
|  +-- OSM Overpass API (doctor directory)                    |
+----------------------------+------------------------------+
                             |
                    Same-Origin API (Fetch)
                    Session Cookies (httpOnly)
                             |
+----------------------------+------------------------------+
|                    Flask Backend (main.py)                  |
|                                                            |
|  Auth Endpoints:     /api/register, /api/login, /api/me    |
|  Appointment APIs:   /api/appointments                     |
|  Symptom APIs:       /api/symptoms                         |
|  Static Serving:     HTML, CSS, JS, Images (smart caching) |
|  Health Check:       /healthz                              |
+----------------------------+------------------------------+
                             |
+----------------------------+------------------------------+
|               SQLite Database (db.py)                      |
|                                                            |
|  Tables: users | appointments | symptom_logs               |
|  Password hashing via werkzeug.security                    |
+-----------------------------------------------------------+
```

**Key Design Decisions:**
- Monolithic architecture -- single Flask server serves both API and static assets
- No CORS needed (same-origin), simplifying session cookie handling
- Hybrid storage: server-authoritative DB + client-side localStorage fallback for offline UX
- React components loaded via UMD (no Babel/Webpack build step)

---

## Slide 6: App Pages & User Flow

### User Journey:
```
Login/Signup --> Profile Setup (3 steps) --> Dashboard --> Feature Pages
```

### Pages Overview:

| Page              | Purpose                                        |
|-------------------|------------------------------------------------|
| **login.html**    | Dual-panel login/signup with email validation  |
| **setup.html**    | 3-step onboarding: Personal info, Cycle info, Health goals |
| **index.html**    | Dashboard hub with navigation, greeting, feature cards, and React widgets |
| **mycycle.html**  | Cycle tracker with phase timeline and predictions |
| **symptoms.html** | Full symptom logging (mood, flow, discharge, activity, water, weight) |
| **wellness.html** | Wellness content: tips, exercises, nutrition, meditation |
| **doctors.html**  | Doctor directory (OSM-powered) with search, filter, and booking |
| **profile.html**  | User stats, achievements, personal & health info |
| **settings.html** | Account, cycle, notification, and privacy settings |

---

## Slide 7: Feature Deep Dive -- Menstrual Cycle Tracking

- **Interactive Calendar** (React component)
  - Color-coded days: Pink (period), Yellow (fertile window), Teal (ovulation)
  - Click any day to see cycle day number and current phase
  - Month navigation with "Jump to today"

- **Cycle Counter / Today Panel** (React component)
  - Shows current day in cycle (e.g., "Day 14 of 28")
  - Current phase with color indicator
  - Productivity percentage by phase (Menstrual: 40%, Follicular: 78%, Ovulation: 95%, Luteal: 58%)
  - Days until next period
  - Animated progress bar

- **Cycle Phases Timeline** (mycycle.html)
  - Menstrual (Days 1-5): Rest focus
  - Follicular (Days 6-14): Rising energy
  - Ovulation (Days 15-17): Peak energy (animated highlight)
  - Luteal (Days 18-28): Wind-down

- **Predictions:** Next period, Next ovulation, Fertile window, Peak energy days

---

## Slide 8: Feature Deep Dive -- Symptom Tracker

- **12 Symptom Categories** with 100+ individual options:

| Category            | Example Options                                                  |
|---------------------|------------------------------------------------------------------|
| Mood                | Calm, Happy, Energetic, Irritated, Anxious, Depressed (15 total) |
| Physical Symptoms   | Cramps, Headache, Fatigue, Acne, Backache (12 total)             |
| Menstrual Flow      | Light, Medium, Heavy, Clots                                      |
| Sex & Sex Drive     | 12 options for tracking intimacy and libido                       |
| Vaginal Discharge   | 9 types (Sticky, Creamy, Watery, Egg white, etc.)                |
| Digestion & Stool   | 4 options                                                        |
| Physical Activity   | Yoga, Gym, Swimming, Running, Cycling, Walking (9 total)         |
| Pregnancy Test      | Positive, Negative, Inconclusive, Not taken                      |
| Ovulation Test      | Positive, Negative, Inconclusive, Not taken                      |
| Oral Contraceptives | Taken, Missed                                                    |
| Other               | Travel, Stress, Meditation, Journaling, Alcohol (8 total)        |

- **Additional Trackers:**
  - Water intake: 0-9 glasses (goal: 2.25L / 9 glasses)
  - Weight: Numeric input with +/- buttons
  - Free-form notes

- **UX Features:**
  - Search to filter symptoms
  - Chip-based selection UI
  - Right sidebar summary of selections
  - Recent logs (last 7 days) with summary view
  - Date picker for retroactive logging

---

## Slide 9: Feature Deep Dive -- Wellness Hub

- **Daily Inspiration:** Rotating motivational quotes (API + fallback)
- **Period Wellness Tips:** 6 curated tips (hydration, gentle movement, heat therapy, magnesium, sleep hygiene, reduce caffeine)
- **Recommended Exercises:** Yoga, Walking, Stretching with duration, benefits, and recommended poses
- **Phase-Based Nutrition:**
  - Menstrual: Iron-rich foods, dark chocolate, warm soups
  - Follicular: Fermented foods, lean proteins, leafy greens
  - Ovulation: Anti-inflammatory foods, fiber, antioxidants
  - Luteal: Complex carbs, magnesium-rich foods, calming teas
- **Meditation & Relaxation:** 5-min, 10-min, 15-min guided session timers
- **Progress Tracking:** Days tracked, workouts completed, meditation minutes

---

## Slide 10: Feature Deep Dive -- Doctor Directory & Appointments

- **Dynamic Directory** powered by OpenStreetMap Overpass API
  - Real-time geolocation-based doctor lookup
  - Reverse geocoding via Nominatim for human-readable addresses
- **Specialty Filters:** Gynecologist, Endocrinologist, Nutritionist, Therapist, PCOS Specialist
- **Doctor Cards:** Name, specialty, location, phone, email
- **Search:** By name, specialty, or location
- **Appointment Booking:** Backend-managed with status tracking (via `/api/appointments`)
- **Emergency Contact:** Quick-access emergency information in sidebar

---

## Slide 11: Feature Deep Dive -- AI Health Assistant (Chatbot)

- **Powered by:** Google Gemini 1.5 Flash
- **Specialized Knowledge Areas:**
  - Menstrual health & cycle tracking
  - Period pain management
  - PCOS, endometriosis, hormonal conditions
  - Phase-based nutrition & exercise
  - Mental health & emotional wellness
  - App usage guidance
- **Safety Design:**
  - Never provides medical diagnoses
  - Always recommends consulting a doctor for serious symptoms
  - Empathetic tone for sensitive health topics
- **UX:** Floating chat bubble (bottom-right), multi-turn conversation, expandable window

---

## Slide 12: Authentication & Security

- **Session-based authentication** with Flask server-side sessions
- **Password hashing** via werkzeug.security (bcrypt-based)
- **Security measures:**
  - httpOnly cookies (prevents XSS cookie theft)
  - SameSite=Lax cookie policy (CSRF protection)
  - Same-origin API (no CORS attack surface)
  - 6-second API timeouts via AbortController (prevents hung requests)
  - XSS prevention: Safe URL validation for navigation targets
  - HTTPS enforced in production (app.yaml)
- **Auth flow:**
  - `/api/register` -- Create account with hashed password
  - `/api/login` -- Verify credentials, create session
  - `/api/me` -- Check current session status
  - `/api/logout` -- Destroy session
- **Offline fallback:** localStorage-based auth when server is unreachable
- **Email notifications:** Welcome email on signup, login alert emails via EmailJS

---

## Slide 13: React Components (Modern UI Layer)

Four React 18 components power the dashboard's interactive widgets:

| Component               | Purpose                                         |
|-------------------------|-------------------------------------------------|
| **CalendarComponent**   | Monthly calendar with cycle phase color coding  |
| **CycleCounter**        | Today panel: cycle day, phase, productivity     |
| **HistorySection**      | Average period/cycle stats, inline weight edit  |
| **SymptomTracker**      | Full symptom logging modal (accessible anywhere)|

- **No build step required** -- uses `React.createElement` directly (no JSX transpilation)
- **UMD bundles** -- works on both `file://` and `http://`
- **Global API:** `window.toggleSymptomTracker()` opens tracker from any page
- **Auto-updates:** CycleCounter refreshes every minute

---

## Slide 14: New Features in This Update (Zip vs. Previous Codebase)

### Entirely New Files:
| File                          | What It Adds                                       |
|-------------------------------|----------------------------------------------------|
| `chatbot.js` + `chatbot.css` | Gemini-powered AI health assistant (floating chat)  |
| `components/*.jsx` (4 files)  | React source components for calendar, cycle, history, symptom tracker |
| `js/eraya-react-dashboard.js` | Bundled React runtime for dashboard widgets          |

### Significant Enhancements to Existing Files:

| Area                    | Changes                                                      |
|-------------------------|--------------------------------------------------------------|
| **Symptom Tracking**    | Added new symptom chips (Clumpy white, Gray discharge; Frisky, Sad, Guilty, Obsessive, Apathetic, Self-critical moods; Team sports; Disease/injury) |
| **Symptom Logging**     | Water intake tracker (0-9 glasses) and weight logger integrated into save flow |
| **Symptom Page**        | Dynamic title/subtitle (cycle day), date-based logging via URL param (`?date=`) |
| **Doctor Directory**    | Upgraded from static data to live OpenStreetMap Overpass API with geocoding |
| **Dashboard (index)**   | React component integration, symptom tracker toggle, chatbot embed |
| **Wellness Page**       | React widget integration, chatbot embed, symptom tracker hook |
| **My Cycle Page**       | Chatbot embed, improved CSS formatting                        |
| **Login Page**          | EmailJS integration for welcome & login alert emails           |
| **Auth Status**         | Added auth status display in sidebar (profile, settings, symptoms pages) |
| **Styles/Layout**       | Improved responsive grid (`minmax` for flexible columns), right sidebar enhancements (overflow, z-index, min-width), better mobile breakpoints |

---

## Slide 15: Deployment & Infrastructure

### Docker Container:
- Base image: Python 3.12-slim
- Single container serves both backend + frontend
- Gunicorn WSGI server: 1 worker, 8 threads (gthread), 120s timeout
- Configurable via environment variables (`PORT`, `WEB_CONCURRENCY`, `WEB_THREADS`)

### Google Cloud Run:
- Dockerfile-based deployment
- Auto-scaling, serverless
- PORT injected by Cloud Run

### Google App Engine:
- `app.yaml` configuration
- F1 instance class (auto-scaling)
- HTTPS enforced

### Smart Caching Strategy:
- Static assets (CSS, JS, images): 24-hour browser cache
- HTML pages: No cache (ensures fresh deployments)

---

## Slide 16: Data Model

### Database Tables (SQLite):

```
users
  - id (INTEGER, PK)
  - email (TEXT, UNIQUE)
  - password_hash (TEXT)
  - name (TEXT)
  - created_at (TIMESTAMP)

appointments
  - id (INTEGER, PK)
  - user_id (FK -> users)
  - doctor_name (TEXT)
  - specialty (TEXT)
  - date (TEXT)
  - time (TEXT)
  - status (TEXT)
  - created_at (TIMESTAMP)

symptom_logs
  - id (INTEGER, PK)
  - user_id (FK -> users)
  - date (TEXT)
  - symptoms (JSON TEXT)
  - created_at (TIMESTAMP)
```

### Client-Side Storage (localStorage):
- `userData` -- Profile, cycle info, health goals, weight
- `symptomsData` -- Daily symptom logs (keyed by date)
- `eraya_signup_complete` -- Onboarding completion flag
- Session-level auth state

---

## Slide 17: Design & UX

### Color Palette:
| Color               | Hex       | Usage                        |
|---------------------|-----------|------------------------------|
| Blush (Primary)     | #CF7486   | Buttons, accents, headings   |
| Lavender Blush      | #FFE6ED   | Light backgrounds            |
| Powder Pink         | #F8BBD0   | Cards, hover states          |
| Teal                | #4ECDC4   | Ovulation, info dots         |
| Yellow              | #FFD93D   | Fertile window               |
| Deep Pink           | #FF6B9D   | Period days, alerts          |
| Purple              | #B19CD9   | Luteal phase                 |

### Layout:
- 3-column responsive grid: Sidebar (260px) | Main Content (flexible) | Right Sidebar (280-340px)
- Mobile-responsive: Collapses to single column on small screens
- Modern card-based UI with smooth transitions and animations

### UX Highlights:
- Progressive disclosure (multi-step setup, collapsible symptom categories)
- Toast notifications for feedback
- Keyboard shortcuts (Enter to save, Esc to cancel)
- Offline-capable with localStorage fallback
- Empathetic, non-clinical language throughout

---

## Slide 18: Key Differentiators

1. **Holistic Approach** -- Not just a period tracker; combines cycle tracking, symptom logging, nutrition, exercise, meditation, and doctor coordination in one app
2. **Phase-Aware Intelligence** -- Productivity scores, nutrition recommendations, and exercise suggestions adapt to the user's current cycle phase
3. **AI Health Assistant** -- Gemini-powered chatbot provides contextual health guidance with safety guardrails
4. **No Build Step Frontend** -- React components work without Webpack/Babel, enabling rapid development and easy deployment
5. **Open Data** -- Uses OpenStreetMap for doctor directory (no proprietary API lock-in)
6. **Privacy-First** -- Same-origin architecture, no third-party analytics, offline-capable
7. **Lightweight Deployment** -- Single Docker container, runs on free-tier cloud instances

---

## Slide 19: Future Roadmap (Suggested)

- Partner/family sharing features (fertility awareness for couples)
- Push notifications for period predictions and medication reminders
- Data export (PDF reports for doctor visits)
- Cloud database migration (SQLite to PostgreSQL/Cloud SQL for production scale)
- Native mobile apps (React Native or PWA)
- Machine learning for personalized cycle predictions based on symptom history
- Integration with wearable devices (Fitbit, Apple Watch)
- Multi-language support and localization
- Dark mode theme

---

## Slide 20: Demo Walkthrough (Suggested Flow)

1. **Signup & Onboarding** -- Create account, walk through 3-step setup
2. **Dashboard Tour** -- Show greeting, feature cards, React calendar, cycle counter
3. **Log Symptoms** -- Open symptom tracker, select mood/symptoms, track water, save
4. **View Cycle** -- Navigate to My Cycle, show phase timeline and predictions
5. **Wellness** -- Browse tips, nutrition by phase, start a meditation timer
6. **Find a Doctor** -- Search and filter specialists, view cards
7. **Chat with AI** -- Open chatbot, ask a cycle-related question
8. **Profile & Settings** -- View achievements, adjust cycle length, toggle notifications

---

## Slide 21: Summary & Call to Action

- **Eraya** is a comprehensive, privacy-first women's health platform
- Built with modern web technologies (Flask + React + Gemini AI)
- Production-ready with Docker and Google Cloud deployment
- This update adds AI chatbot, React dashboard components, enhanced symptom tracking, and live doctor directory
- **Next Steps:** [User's specific call to action -- demo, feedback, funding, beta launch, etc.]

---

*Presentation prepared from code review of the Eraya app (appforwomen-main.zip)*
