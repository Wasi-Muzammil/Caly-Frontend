# 🗓️ Caly Frontend — AI-Assisted Smart Meeting Scheduler

Caly's frontend is built with **React** and gives users a clean, modern interface to schedule meetings intelligently. Users log in with Google, add participants, pick a date range, and Caly automatically finds and ranks the best available times.

---

## 🧠 What This Frontend Does

1. Lets users sign in securely with their Google account
2. Provides a simple form to enter meeting details and participants
3. Calls the backend and displays the top 5 ranked available slots
4. Lets the user pick a slot and confirm the meeting
5. Shows a dashboard of all upcoming and past meetings

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | Frontend framework and build tool |
| React Router v6 | Page navigation and routing |
| Tailwind CSS | Styling and layout |
| Axios | HTTP calls to the FastAPI backend |
| date-fns | Date formatting and manipulation |
| lucide-react | Clean icon library |
| react-hot-toast | Success and error notifications |
| React Context API | Global auth state management |

---

## 📁 Project Structure

```
caly-frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── .env                          # Backend URL (Secret)
│
└── src/
    ├── main.tsx                  # React app entry point
    ├── App.tsx                   # Route definitions
    │
    ├── context/
    │   └── AuthContext.tsx       # Stores JWT, user info, login/logout logic
    │
    ├── api/
    │   └── axios.ts              # Axios instance with JWT attached automatically
    │
    ├── pages/
    │   ├── LandingPage.tsx       # Public homepage with CTA
    │   ├── LoginPage.tsx         # Google OAuth login trigger
    │   ├── DashboardPage.tsx     # Lists all user meetings
    │   ├── NewMeetingPage.tsx    # Form to create a meeting and get suggestions
    │   ├── ConfirmMeetingPage.tsx # Pick a slot and confirm the meeting
    │
    ├── components/
    │   ├── Navbar.tsx            # Top navigation bar
    │   ├── ProtectedRoute.tsx    # Blocks unauthenticated users
    └── 
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Wasi-Muzammil/caly-frontend.git
cd caly-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Your .env File

Create a `.env` file in the root folder:

```env
VITE_API_URL=http://localhost:8000 || http://caly-backend.vercel.app
```

This tells the frontend where your FastAPI backend is running.

### 4. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000` to open the app.

> Make sure your backend is also running at `http://localhost:8000` before testing.

---

## 📄 Pages

### Landing Page `/`
The public homepage. Shows the app name, a short description, and a **Get Started** button that takes the user to login. Minimal and clean.

### Login Page `/login`
Shows a centered card with a **Continue with Google** button. Clicking it redirects the user to Google's login page via the backend. No username or password needed.

### Dashboard Page `/dashboard`
Shows all meetings the user has created or been invited to. Meetings are split into **Upcoming** and **Past** tabs. Each meeting shows the title, date, time, duration, participants, and status.

### New Meeting Page `/meetings/new`
A single scrollable form with three sections. First the user enters a title, duration, and optional priority toggle. Then they add participant emails. Then they pick a date range. Clicking **Find Available Slots** calls the backend and shows the ranked results below.

### Confirm Meeting Page `/meetings/confirm`
Shows the top 5 ranked slots as cards. Each card shows the date, time, duration, score, and tags like **Morning**, **Earliest**, or **Urgent Priority**. The user clicks **Select This Slot**, reviews a confirmation summary, and clicks **Confirm and Send Invites** to finalize.

---

## 🔐 How Auth Works on the Frontend

1. User clicks **Continue with Google** → browser redirects to backend `/auth/google`
2. After Google approval, backend redirects to `/auth/callback?token=<jwt>`
3. Frontend reads the token from the URL, stores it in `localStorage`
4. `AuthContext` makes the user and token available across the whole app
5. Axios automatically attaches the token to every API request via an interceptor
6. `ProtectedRoute` checks for a valid token — if missing, redirects to `/login`
7. If the backend returns a 401 error, Axios clears the token and redirects to `/login`


## 🔌 Backend API Calls

All API calls go through `src/api/axios.ts` which automatically attaches the JWT token.

| Action | Method | Endpoint |
|---|---|---|
| Get current user | GET | `/users/me` |
| Get slot suggestions | POST | `/meeting/suggest` |
| Confirm a meeting | POST | `/meeting/confirm` |
| List all meetings | GET | `/meeting/` |
| Get one meeting | GET | `/meeting/{id}` |

---

## ⚙️ Environment Variables

| Variable | What It Is |
|---|---|
| `VITE_API_URL` | The URL where your FastAPI backend is running |

---

> Built with React · Tailwind CSS · Vite · Google OAuth