# Eraya - Single container: backend (Flask API + SQLite) + frontend (static files)
# Build:  docker build -t eraya .
# Run:    docker run -p 8080:8080 eraya
# Deploy: gcloud run deploy eraya --source .

FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire app (backend + static files)
COPY . .

# PORT from environment (Cloud Run, etc.); default 8080
ENV PORT=8080
EXPOSE 8080

# Single process: gunicorn serves both API and static files.
# gthread improves concurrent static-file responses on low-CPU instances.
CMD ["sh", "-c", "exec gunicorn -b 0.0.0.0:${PORT:-8080} --workers ${WEB_CONCURRENCY:-1} --threads ${WEB_THREADS:-8} --worker-class gthread --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile - main:app"]
