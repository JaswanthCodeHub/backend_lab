# Lab 10 - Backend Development Fundamentals

An isolated Express.js backend application for **Lab 10**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Start the Server
- **Development Mode** (auto-reload on code change via nodemon):
  ```powershell
  npm run dev
  ```
- **Standard Mode**:
  ```powershell
  npm start
  ```

Server runs on: **http://localhost:3000** (or port configured in `server.js`)

---

## 📡 API Endpoints

| Method | Endpoint | Description | Response Type |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Welcome message & API Status | `application/json` |
| **GET** | `/about` | Lab / Student Metadata | `application/json` |
| **GET** | `/time` | Current Server Timestamp | `text/plain` |
| **GET** | `/api/health` | Health Check & Process Uptime | `application/json` |
| **ANY** | `/*` | 404 Route Not Found Handler | `text/plain` / `json` |

---

## 🧪 Testing with REST Client Extension

Open [`lab-10.http`](./lab-10.http) in VS Code:
1. Start the server (`npm run dev`).
2. Click **`Send Request`** above any request block in the `.http` file.
3. View the response in the interactive side panel.

---

## 📁 File Structure

```text
lab-10/
├── node_modules/        # Installed dependencies
├── .gitignore           # Ignores node_modules
├── lab-10.http       # REST Client request tests
├── package.json         # Scripts and dependencies
├── package-lock.json    # Exact dependency lockfile
├── README.md            # Lab 10 documentation
└── server.js            # Express server entry point
```
