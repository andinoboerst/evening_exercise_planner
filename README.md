# Nocturne — 30-Minute Bedtime Floor Mat Routine for Couples

A luxury, partner-synchronized bedtime workout app built for floor mats. It guides couples through a daily 30-minute evening sequence before sleep:
- **10 min:** Floor-mat Strength & Core Stabilization (planks, push-ups, glute bridges, bird-dog)
- **15 min:** Spinal Decompression, Stretching & Mobility (cat-cow waves, sphinx/cobra, thread-the-needle, pigeon pose)
- **5 min:** Wind-Down & Mindfulness (parasympathetic 4-7-8 breathing, progressive body scan, savasana)

---

## ✨ Features
- **Couples Synchronized**: Every movement includes specific partner tips. If either person fatigues first, they can relax into child's pose while their partner completes the interval.
- **Dynamic Phase Toggling**: Choose to run the full 30-min routine, or toggle off Strength if you only want 15 min of stretching and 5 min of wind-down.
- **7-Day Rotating Program**: Different exercises every day of the week, with core and back stretches in every session.
- **Harmonic Audio Cues**: Web Audio API Tibetan singing bowls for exercise transitions, 3-2-1 beeps, and halfway reminder dings.
- **Voice Guidance**: Announces exercise names and upcoming 10-second transitions out loud so you don't have to look at the screen.
- **Spotify Integration**: Curated bedtime playlists (*Lo-Fi Beats*, *Peaceful Piano*, *Deep Sleep Ambient*) with one-tap play and optional automated playback via Spotify Web API.
- **Screen Wake Lock**: Keeps the phone screen awake during the workout without sleeping.
- **Installable PWA**: Runs full screen without address bars on iOS and Android.

---

## 🚀 Hosting on Vercel (100% Free, No Database Needed)

This app is a pure static client-side web application. It requires **no database, no backend server, and no maintenance**.

### Quick Deploy via GitHub:
1. Push your changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete bedtime workout app"
   git push origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
3. Click **"Add New..." > "Project"**.
4. Select `evening_exercise_planner` and click **Deploy**.
5. Vercel will give you a free, permanent **`https://your-app.vercel.app`** domain with HTTPS enabled.

### Updating Spotify Redirect URI:
Once deployed on Vercel, copy your Vercel URL and add it to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
```text
https://your-app.vercel.app/
```
Spotify will accept it immediately because it uses `https://`.

---

## 📱 Sideloading to Your Phone

### On Android (Chrome)
1. Open your deployed Vercel URL (or `http://<your-ip>:5173`) in Google Chrome.
2. Tap the **Three Dots (⋮)** in the top right.
3. Tap **"Install app"** or **"Add to Home screen"**.

### On iPhone (Safari)
1. Open the URL in Safari.
2. Tap the **Share** button (box with arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.