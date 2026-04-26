# 🚀 Linkio – AI-Powered Hyperlocal Service Marketplace

> An AI-powered platform that seamlessly connects customers with trusted local service workers in real time.

---

## 📌 Problem Statement

In semi-urban and local communities, a critical gap exists between skilled workers and the customers who need them:

- **Workers** (plumbers, electricians, part-time service providers) struggle to find consistent employment and rely heavily on word-of-mouth, resulting in unstable income.
- **Customers** face delays, lack of transparency, and difficulty finding trustworthy service providers.
- **Existing platforms** are urban-centric, costly, and not accessible for users with low digital literacy.

👉 This supply-demand gap reduces economic efficiency and leaves both sides underserved.

---

## 💡 Solution

**Linkio** bridges this gap through an AI-powered hyperlocal marketplace.

- Workers can **register, get verified**, and receive jobs based on **skills + proximity**.
- Customers can request services using **simple text or voice input**.
- An **AI-powered NLP engine** matches requests with the **most suitable nearby workers**.

---

## ✨ Key Features

| Feature | Description |
|--------|------------|
| 💬 **In-App Chat** | Seamless communication between users and workers |
| 📍 **Live Location Tracking** | Real-time tracking of worker location |
| 🤖 **AI Chatbot** | Smart assistance and instant support |
| 🚨 **Emergency Services** | Quick-response system for urgent needs |
| 🏘️ **Hyperlocal Matching** | Connects users with nearby workers |
| 🌐 **Multi-Language Support** | Accessible across regional languages |
| 📊 **AI Analytics** | Tracks performance and service quality |

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| **Frontend** | React |
| **Backend** | Node.js |
| **Database** | Firebase |
| **AI / NLP** | Google Gemini |
| **Maps & Location** | Google Maps API |

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js (v18+)
- npm or yarn
- Firebase account
- Google Cloud account

---

### 📥 Installation

```bash
git clone https://github.com/your-username/linkio.git
cd linkio
npm install
```

---

### 🔑 Environment Variables (Frontend)

Create a `.env` file in the root:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

---

### ▶️ Run Frontend

```bash
npm start
```

---

## 🖥️ Backend Setup

```bash
cd backend
npm install
```

### 🔑 Environment Variables (Backend)

Create `.env` inside `/backend`:

```env
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI (Gemini)
GEMINI_API_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

### ▶️ Run Backend

```bash
node server.js
```

📍 Server runs at: `http://localhost:5000`

---

## 🌟 What Makes Linkio Unique

- ✅ **Hyperlocal-first design** (not adapted from urban platforms)
- ✅ **Voice + text input** for accessibility
- ✅ **AI-powered smart matching**
- ✅ **Real-time tracking & chat**
- ✅ **Multi-language support**
- ✅ **Emergency-ready services**

---

## 🤝 Contributing

```bash
# 1. Fork the repo
# 2. Create a branch
git checkout -b feature/your-feature-name

# 3. Commit changes
git commit -m "Add your feature"

# 4. Push
git push origin feature/your-feature-name
```

Then open a Pull Request 🚀

---

## 📄 License

Licensed under the **MIT License**.

---

## 👥 Contributors

- Amogh S Y  
- A Jatin Ram Chowdary 
- Apeksh A
- Arvadiya Om Dinesh

---

## 📬 Contact

For queries or collaboration:
- Open an issue
- Start a discussion in this repository

---

⭐ If you like this project, consider giving it a star!
