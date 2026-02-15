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

# Single process: gunicorn serves both API and static files
CMD ["sh", "-c", "exec gunicorn -b 0.0.0.0:${PORT:-8080} --access-logfile - main:app"]
