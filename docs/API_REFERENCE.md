# API Reference

[Back to README](../README.md) | [Architecture](ARCHITECTURE.md) | [Frontend Flows](FRONTEND_FLOWS.md) | [Deployment and Operations](DEPLOYMENT_OPERATIONS.md)

---

## Base URL

- Local: `http://localhost:8080`
- Production: your deployed host (for example Cloud Run URL)

All endpoints return JSON except static file routes.

---

## Authentication and Sessions

- Auth uses server-side Flask sessions (cookie-based).
- Frontend/client requests must include cookies:
  - JavaScript: `credentials: 'include'`
- Protected routes return:
  - `401` with `{ "error": "Login required" }`

---

## Auth Endpoints

### `POST /api/register`

Create a new user account and start a session.

Request body:

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "User Name"
}
```

Success response (`200`):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-02-15 10:00:00"
  }
}
```

Error responses:

- `400` if required fields missing
- `409` if email already exists

---

### `POST /api/login`

Log in an existing user and start a session.

Request body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Success response (`200`):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-02-15 10:00:00"
  }
}
```

Error responses:

- `400` for missing fields
- `401` for invalid credentials

---

### `POST /api/logout`

Clear the current session.

Success response (`200`):

```json
{ "ok": true }
```

---

### `GET /api/me`

Return current authenticated user or `null`.

Success response (`200`):

```json
{ "user": null }
```

or

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-02-15 10:00:00"
  }
}
```

---

## Appointments Endpoints

### `GET /api/appointments` (auth required)

List appointments for the logged-in user.

Success response (`200`):

```json
{
  "appointments": [
    {
      "id": 5,
      "doctor_id": 2,
      "doctor_name": "Dr. Example",
      "preferred_date": "2026-02-20",
      "preferred_time": "10:30",
      "patient_name": "User Name",
      "patient_phone": "9999999999",
      "reason": "Cycle pain",
      "status": "pending",
      "created_at": "2026-02-15 10:30:00"
    }
  ]
}
```

Error responses:

- `401` when not logged in

---

### `POST /api/appointments` (auth required)

Create an appointment request.

Request body:

```json
{
  "doctor_id": 2,
  "doctor_name": "Dr. Example",
  "preferred_date": "2026-02-20",
  "preferred_time": "10:30",
  "patient_name": "User Name",
  "patient_phone": "9999999999",
  "reason": "Cycle pain"
}
```

Success response (`200`):

```json
{
  "id": 5,
  "message": "Appointment requested successfully"
}
```

Error responses:

- `400` if required fields are missing
- `401` when not logged in

---

## Symptoms Endpoints

### `GET /api/symptoms` (auth required)

List recent symptom logs (up to 30 records by default).

Success response (`200`):

```json
{
  "logs": [
    {
      "id": 11,
      "log_date": "2026-02-15",
      "symptoms_json": "[\"Cramps\",\"Mood Swings\"]",
      "symptoms": ["Cramps", "Mood Swings"],
      "intensity": 6,
      "notes": "Mild discomfort",
      "created_at": "2026-02-15 11:00:00"
    }
  ]
}
```

Error responses:

- `401` when not logged in

---

### `GET /api/symptoms?date=YYYY-MM-DD` (auth required)

Fetch symptom log for a specific date.

Success response (`200`):

```json
{
  "log": {
    "id": 11,
    "log_date": "2026-02-15",
    "symptoms_json": "[\"Cramps\",\"Mood Swings\"]",
    "symptoms": ["Cramps", "Mood Swings"],
    "intensity": 6,
    "notes": "Mild discomfort",
    "created_at": "2026-02-15 11:00:00"
  }
}
```

If no record exists:

```json
{ "log": null }
```

---

### `POST /api/symptoms` (auth required)

Create a symptom log entry.

Request body:

```json
{
  "log_date": "2026-02-15",
  "symptoms": ["Cramps", "Mood Swings"],
  "intensity": 6,
  "notes": "Mild discomfort"
}
```

Success response (`200`):

```json
{
  "id": 11,
  "message": "Symptoms saved"
}
```

Error responses:

- `400` if `log_date` missing or invalid payload
- `401` when not logged in

---

## Health and Utility Endpoints

### `GET /healthz`

Simple liveness endpoint intended for operational checks.

Success response (`200`):

```json
{ "ok": true }
```

---

## Static File Routing Behavior

- `/` serves `index.html`
- `/<path>` serves:
  - direct file if present
  - `<path>.html` if available
- `/api/*` paths are reserved for API routes

---

## Error Format

When an endpoint returns an error, the response follows:

```json
{ "error": "Message text" }
```

