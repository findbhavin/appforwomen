# Deployment and Operations

[Back to README](../README.md) | [Architecture](ARCHITECTURE.md) | [API Reference](API_REFERENCE.md) | [Frontend Flows](FRONTEND_FLOWS.md)

---

## 1) Runtime Configuration

### Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | HTTP port binding | `8080` |
| `SECRET_KEY` | Flask session secret | `eraya-dev-secret-change-in-production` |
| `ERAYA_DB` | SQLite database path | `./eraya.db` |
| `WEB_CONCURRENCY` | Gunicorn worker count (Docker runtime) | `1` |
| `WEB_THREADS` | Gunicorn threads (Docker runtime) | `8` |
| `GUNICORN_TIMEOUT` | Gunicorn timeout seconds | `120` |

---

## 2) Local Development Runbook

Install dependencies:

```bash
pip install -r requirements.txt
```

Start app:

```bash
python3 main.py
```

Open:

- `http://localhost:8080`

---

## 3) Docker Deployment

Build image:

```bash
docker build -t eraya .
```

Run container:

```bash
docker run -p 8080:8080 \
  -e SECRET_KEY="replace-with-strong-secret" \
  -e WEB_CONCURRENCY=1 \
  -e WEB_THREADS=8 \
  -e GUNICORN_TIMEOUT=120 \
  eraya
```

The Docker runtime uses gunicorn with threaded workers for better concurrent request handling.

---

## 4) Google App Engine

Config file:

- `app.yaml`

Deploy:

```bash
gcloud app deploy
```

Entry point uses gunicorn with threaded worker settings for stability under load.

---

## 5) Google Cloud Run

Source deploy example:

```bash
gcloud run deploy eraya \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

Container image deploy example:

```bash
gcloud run deploy eraya \
  --image gcr.io/PROJECT_ID/eraya:latest \
  --region europe-west1 \
  --allow-unauthenticated
```

---

## 6) Health Checks and Basic Verification

After deployment:

```bash
curl -I https://YOUR_HOST/
curl https://YOUR_HOST/api/me
curl https://YOUR_HOST/healthz
```

Expected:

- `/` returns HTML
- `/api/me` returns JSON (`{ "user": null }` when not logged in)
- `/healthz` returns `{ "ok": true }`

---

## 7) Performance and Reliability Notes

Current implementation includes:

- Frontend API timeouts to avoid indefinite UI waits
- Fast fallback behavior when auth checks are slow
- Threaded gunicorn runtime configuration
- Static cache headers for CSS/JS/images

Operational recommendations:

- keep at least one warm instance in production when possible
- set realistic timeout values for your environment
- monitor error rates on `/api/login`, `/api/me`, `/api/symptoms`, `/api/appointments`

---

## 8) Troubleshooting Guide

### Symptom: page feels stuck or loads very slowly

Check:

1. Can `/api/me` respond quickly?
2. Are static assets (`styles.css`, `script.js`) reachable?
3. Is deployment currently rolling out?

Commands:

```bash
curl -sS -o /dev/null -w "code=%{http_code} ttfb=%{time_starttransfer} total=%{time_total}\n" https://YOUR_HOST/
curl -sS -o /dev/null -w "code=%{http_code} ttfb=%{time_starttransfer} total=%{time_total}\n" https://YOUR_HOST/api/me
```

### Symptom: login works inconsistently

Check:

- `SECRET_KEY` stability across deploys/instances
- browser cookie/session behavior
- same-origin deployment path for frontend and API

### Symptom: data disappears in production

Cause:

- SQLite is not a durable production database in many cloud setups.

Mitigation:

- migrate to Cloud SQL or Firestore while preserving API contract.

