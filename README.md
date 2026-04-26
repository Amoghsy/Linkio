# Linkio – AI-Powered Hyperlocal Service Marketplace

>An AI-powered platform that seamlessly connects customers with trusted local service workers in real time.

---

## 📌 Problem Statement

In semi-urban and local communities, a critical gap exists between skilled workers and the customers who need them:

- **Workers** (plumbers, electricians, part-time service providers) struggle to find consistent employment and depend almost entirely on word-of-mouth, leading to unstable income.
- **Customers** face delays, lack of transparency, and difficulty finding trustworthy service providers.
- **Existing platforms** are mostly urban-focused, expensive, and inaccessible to people with low digital literacy.

This supply-demand disconnect reduces economic efficiency and leaves both sides underserved.

---

## 💡 Solution

**Linkio** is an AI-powered hyperlocal service marketplace designed to bridge this gap. It connects customers with nearby skilled workers in real time through an intuitive, accessible platform.

- Workers can easily **register, get verified**, and receive job opportunities based on their skills and location.
- Customers can **request services using simple text or voice input**.
- An **AI-based NLP engine** understands user needs and intelligently matches them with the most suitable available workers.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 💬 **In-App Chat** | Direct communication channel between customers and workers |
| 📍 **Live Location Tracking** | Real-time mapping to track worker location accurately |
| 🤖 **AI Chatbot** | Instant support and smart assistance for users |
| 🚨 **Emergency Service** | Quick-response support for urgent service needs |
| 🏘️ **Hyperlocal Job Matching** | Discovers and connects workers within nearby areas |
| 🌐 **Multi-Language Support** | Wider accessibility for users across language barriers |
| 📊 **AI Performance Analytics** | Data-driven quality tracking to improve service standards |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React |
| **Backend** | Node.js |
| **Database** | Firebase |
| **AI / NLP** | Google Gemini Model |
| **Maps & Location** | Google Maps API |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or above)
- npm or yarn
- Firebase account
- Google Cloud account (for Gemini API & Maps API keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/linkio.git
   cd linkio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory and add the following:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

---
5. 🖥️ BACKEND SETUP
cd backend
npm install
📄 Create .env in backend/
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
▶️ Run Backend
node server.js

Server runs on: http://localhost:5000

## 🌟 What Makes Linkio Unique

Unlike generic service platforms, Linkio is purpose-built for **semi-urban and local communities**:

- ✅ Hyperlocal-first approach — not an urban platform adapted for smaller areas
- ✅ Voice and text input — accessible even for users with low digital literacy
- ✅ AI-powered matching — faster, smarter connections between workers and customers
- ✅ Real-time transparency — live tracking and chat eliminate uncertainty
- ✅ Multi-language support — designed for India's diverse linguistic landscape
- ✅ Emergency-ready — built-in urgent service response capability

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

For queries or collaboration, feel free to reach out via the Issues tab or open a discussion in this repository.

---
## 📬 Contributors
Amogh SY, A Jatin Ram Chowdary,Arvadiya Om Dinesh and Apeksh A