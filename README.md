# 🎙️ Mozhi Studio (மொழி)

> **E-Learning Content Studio** — Next-Gen Voiceover Workstation for Course Creators & Instructional Designers.

Mozhi Studio is a modern, high-precision browser-based audio workstation engineered specifically for instructional designers and course creators (Articulate Storyline 360, Rise 360, Adobe Captivate, and Camtasia).

---

## ✨ Features

- **⚡ Fast Script-to-Speech Engine**: Write or paste entire course scripts in a markdown editor with `# Slide_Title` headers.
- **🎙️ Neural Voices**: Over 300 studio-grade neural voices across 40+ regions and languages (US, UK, India, Australia, Canada, Europe, Asia-Pacific).
- **⏱️ Storyline Timeline Telemetry**: Live duration telemetry with instant **"Set Timeline To X.Xs"** recommendations.
- **🌊 Interactive Waveforms**: Live interactive scrubbing and audio visualization per slide.
- **🔄 Multi-User & Stateless Architecture**: Zero disk accumulation on the server; audio is streamed directly to client memory (`Blob` URLs).
- **📦 1-Click ZIP Packaging**: Client-side ZIP compilation bundling all course `.mp3` tracks in <1 second.
- **☁️ Vercel 1-Click Deployment**: Native serverless Python function support (`api/index.py` & `vercel.json`).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/mozhi.git
cd mozhi

# Install Python dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Install Frontend dependencies
npm install
```

### 3. Run Development Servers
```bash
# Terminal 1: Start Backend API
python server.py

# Terminal 2: Start Frontend Dev Server
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🛠️ Production Build

```bash
# Compile and optimize frontend bundle
npm run build

# Preview production build
npm run preview
```

---

## ☁️ Deployment on Vercel

Mozhi Studio is configured for 1-click deployment on Vercel:

1. Push this repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com).
3. Vercel will automatically detect `vercel.json`, build the frontend into `dist/`, and deploy the serverless Python API handlers.

---

## 📜 License

MIT License. Designed with ❤️ for e-learning creators.
