# 🧭 User Agent Tracker — Tailwind Dashboard

A full-stack **Next.js + TailwindCSS** application to track users, their login activity, inactivity, and site visits.  
The dashboard provides real-time monitoring of agents’ working hours, active/inactive time, and daily/weekly reports.

---

## 🚀 Features

✅ **User Authentication**
- Secure JWT-based login & registration  
- OTP email verification  

✅ **Agent Tracking**
- Auto logout after 5 mins of inactivity  
- Tracks sessions, working hours, and inactivity  

✅ **Visit Monitoring**
- Records user visits automatically  
- Auto refreshes when tab reopens  

✅ **Reports**
- Daily and weekly summary reports  
- CSV and JSON export options  

✅ **Frontend**
- Responsive TailwindCSS dashboard  
- Dynamic charts, cards, and status indicators  

---

## 🧩 Project Structure

```
user-agent-tracker-tailwind/
│
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable UI components
├── models/                 # Mongoose models (Users, Visits, Sessions)
├── scripts/                # Seeders and backend scripts
├── styles/                 # Tailwind global styles
├── .env                    # Environment variables
├── tailwind.config.js      # TailwindCSS config
├── next.config.js          # Next.js config
├── postcss.config.js       # PostCSS setup
├── package.json            # Dependencies & scripts
└── envfile.sh              # Shell helper for environment setup
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone <repo_url>
cd user-agent-tracker-tailwind
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a **.env** file in the root (if not already present):

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
BASE_URL=http://localhost:3000
```

### 4️⃣ Run Database Seed Script (Optional)

This will generate 10 dummy agents with sample data.

```bash
node scripts/seed.js
```

### 5️⃣ Run the Development Server

```bash
npm run dev
```

Your app will now be live at:  
👉 **http://localhost:3000**

---

## 🧮 Scripts

| Command | Description |
|----------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build project for production |
| `npm start` | Run production build |
| `node scripts/seed.js` | Seed dummy agents and sessions |

---

## 🧠 API Overview

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/register` | POST | Register a new user |
| `/api/login` | POST | Login user and get JWT |
| `/api/verify-otp` | POST | Verify email OTP |
| `/api/reports` | GET | Get today’s report |
| `/api/reports/weekly` | GET | Get weekly summary |
| `/api/reports/agents` | GET | Get agent performance |
| `/api/visits` | POST | Record a visit |
| `/api/logout` | POST | Logout user |

---

## 📊 Dashboard Summary

- **📈 Weekly Summary** → Shows past 7/14/30 days  
- **👨‍💼 Agents Performance** → Shows today’s data  
- **📄 Export Options** → Download reports as JSON or CSV  
- **⚡ Status Indicator** → Live user activity (Active / Inactive / Offline)  

---

## 🧑‍💻 Tech Stack

- **Frontend:** Next.js (App Router), React, TailwindCSS  
- **Backend:** Node.js, Express.js (API Routes in Next.js)  
- **Database:** MongoDB + Mongoose  
- **Auth:** JWT + OTP Email Verification  
- **UI Enhancements:** Gradient Cards, Blurred Backgrounds, Responsive Design  

---

## 🧰 Requirements

- Node.js ≥ 18  
- npm ≥ 9  
- MongoDB Database URI  

---

## 🧾 License

This project is open-source and free to use for educational or personal purposes.
