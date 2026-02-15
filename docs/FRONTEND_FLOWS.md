# Frontend Flows

[Back to README](../README.md) | [Architecture](ARCHITECTURE.md) | [API Reference](API_REFERENCE.md) | [Deployment and Operations](DEPLOYMENT_OPERATIONS.md)

---

## 1) Page and Script Mapping

| Page | Purpose | Main Script(s) |
|------|---------|----------------|
| `index.html` | Dashboard and entry point | `auth.js`, `script.js` |
| `login.html` | Login/signup and redirect logic | inline login/signup logic |
| `setup.html` | New user onboarding | `setup.js` |
| `doctors.html` | Doctor list and booking | `doctors.js` |
| `symptoms.html` | Symptom tracking | `symptoms.js` |
| `wellness.html` | Wellness guidance and tools | `wellness.js` |
| `profile.html` | User profile summary | inline script |
| `settings.html` | User settings and data tools | inline script |

---

## 2) Authentication UX Flow

### Existing user login

1. User opens `login.html`
2. Enters valid credentials
3. App calls `POST /api/login`
4. On success, user is redirected to `index.html` (dashboard) or safe `next` path if present

### New user signup

1. User opens signup panel in `login.html`
2. Submits account details to `POST /api/register`
3. User is marked as new signup in local state
4. Redirect to `setup.html` (or safe `next` path)
5. After setup completion, redirect to `index.html`

---

## 3) Dashboard Feature Gating

Dashboard cards/buttons use `data-feature-target`.

Flow:

1. User clicks feature
2. Auth status is checked via `ErayaAuth.getCurrentUser(...)`
3. If authenticated -> navigate to target page
4. If not authenticated:
   - no local user -> redirect to signup intent
   - local user present -> redirect to login intent

This preserves the expected behavior while avoiding long waits when API checks are slow.

---

## 4) Setup Flow Details

`setup.js` handles:

- loading current session/local user
- storing setup form data (`userData`)
- storing per-user setup data (`userDataByEmail`)
- setting completion state (`setupComplete` / `setupDone`)

On successful completion, user is routed to `index.html`.

---

## 5) Symptoms Flow

`symptoms.js` behavior:

- Loads symptom state from local storage first (fast UI)
- Attempts API load for current date
- Saves to API (`POST /api/symptoms`) when possible
- Falls back to local storage if network/API fails

This ensures users can still track symptoms even when backend is temporarily unreachable.

---

## 6) Wellness Flow

`wellness.js` behavior:

- Pulls quote/tips from external APIs when available
- Falls back to local predefined content if API calls fail
- Persists wellness counters in local storage (`wellnessStats`)
- Manages meditation timer and hydration tracking client-side

---

## 7) Local Storage Keys

| Key | Use |
|-----|-----|
| `erayaUser` | Active local user identity mirror |
| `erayaUsers` | Local user registry/fallback auth data |
| `userData` | Setup/profile data for current user |
| `userDataByEmail` | Setup/profile data mapped by email |
| `symptomsData` | Local symptom fallback persistence |
| `wellnessStats` | Hydration/meditation counters |
| `rememberedEmail` | Login form convenience |

---

## 8) Styling and Layout Policy

Core behavior updates are implemented without changing the visual design contract:

- existing CSS structure remains intact
- behavioral fixes are done in JavaScript and backend routing
- page layouts and stylistic components are preserved

