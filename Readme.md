# ERAYA - Period Wellness Website

A comprehensive period wellness website designed to help women track their menstrual cycles, find healthcare experts, access wellness resources, and manage their reproductive health.

## 🌸 Project Overview

ERAYA is a desktop-centric wellness platform built with modern web technologies, featuring an enhanced doctors page with full contact and booking functionality.

## ✨ Key Features

### Enhanced Doctors Page (NEW)
- **Search & Filter**: Find doctors by name, specialty, location, or hospital
- **Detailed Doctor Cards**: Ratings, experience, fees, availability status
- **Contact System**: Direct phone/email with contact modals
- **Booking System**: Complete appointment booking with form validation
- **Emergency Contact**: Quick access to emergency services

### Dashboard
- Interactive calendar with cycle tracking
- Symptom logging
- Wellness insights
- Cycle phase tracking

### Other Pages
- Wellness Hub with exercises and nutrition
- Cycle tracker with predictions
- Symptom logger
- Settings and profile management

## 🎨 Color Palette (From Figma)

- Lavender Blush: #FFE6ED
- Blush: #CF7486
- Powder Pink: #F8BBD0
- Milky White: #FFF8F0

## 📁 Files

- index.html - Dashboard
- doctors.html - Find Doctors (ENHANCED)
- doctors.js - Doctors functionality (NEW)
- wellness.html - Wellness Hub
- mycycle.html - Cycle Tracker
- symptoms.html - Symptom Logger
- settings.html - Settings
- profile.html - Profile
- styles.css - Complete stylesheet
- script.js - Dashboard scripts

## 🔐 Server-side features (Login, Booking, Symptoms)

The app includes a **Flask backend** with SQLite for:

- **User login** – Register and sign in at `login.html`; session cookies keep you logged in.
- **Doctor appointment booking** – Bookings from the Doctors page are stored (login required).
- **Symptoms page** – Symptom logs are saved and loaded by date (login required).

**Run the server** so these work: `python main.py` then open http://localhost:8080 (do not open HTML files directly).  
See **BACKEND-GUIDANCE.md** for technology choices and API details.

## 🚀 Usage (local)

1. Run the server: `pip install -r requirements.txt` then `python main.py`. Visit http://localhost:8080
2. Optionally register/login via the **Login** link in the sidebar (or open `login.html`)
3. Navigate to Doctors → search/filter → Book Appointment (saved when logged in)
4. Add Symptoms from the dashboard button; logs are saved when logged in

## ☁️ Deploy on Google Cloud (App Engine)

1. **Install Google Cloud CLI**  
   [Install gcloud](https://cloud.google.com/sdk/docs/install)

2. **Login and set project**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy** (from the project folder)
   ```bash
   gcloud app deploy
   ```
   Accept prompts (e.g. region). When finished, the app URL will be shown (e.g. `https://YOUR_PROJECT_ID.uc.r.appspot.com`).

4. **Optional: run locally with App Engine**
   ```bash
   pip install -r requirements.txt
   python main.py
   ```
   Then open http://localhost:8080

## 🐳 Single-container deploy (Docker)

One image runs the **full app**: Flask backend (API + auth, appointments, symptoms, SQLite) and static frontend (HTML/CSS/JS). Use the single **Dockerfile** in the project root.

### Run locally
   ```bash
   docker build -t eraya .
   docker run -p 8080:8080 eraya
   ```
   Open http://localhost:8080 (login, booking, and symptoms all work; data is stored in the container’s SQLite DB).

### Deploy to Google Cloud Run (from the project folder)
   ```bash
   gcloud run deploy eraya --source . --region us-central1 --allow-unauthenticated
   ```
   Cloud Run will build the image from the Dockerfile and deploy. The command prints the live URL (e.g. `https://eraya-xxxxx-uc.a.run.app`).

   Or build the image first and push to Artifact Registry, then deploy:
   ```bash
   gcloud auth configure-docker
   docker build -t gcr.io/YOUR_PROJECT_ID/eraya .
   docker push gcr.io/YOUR_PROJECT_ID/eraya
   gcloud run deploy eraya --image gcr.io/YOUR_PROJECT_ID/eraya --region us-central1 --allow-unauthenticated
   ```

**Note:** Add image assets (`logo.png`, `holding-flowers.png`, `workout.png`, `meditation.png`, `food.png`, `doctors.png`, `focused.png`) to the project folder if you want them to appear on the dashboard.

## 📋 Requirements Met

✅ 5+ webpages with professional design
✅ Advanced CSS with animations
✅ JavaScript functionality
✅ Desktop-optimized layout
✅ Contact and booking features

## Team

[Your names here]
