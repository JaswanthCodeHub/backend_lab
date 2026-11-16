# Lab 4: Registration, Login and JWT Authentication

> **🔗 Live Deployment URL:** [https://backend-lab-h2hp.onrender.com/](https://backend-lab-h2hp.onrender.com/) *(or local server at `http://localhost:3000`)*

---

## 📋 Student & Curriculum Information

| Field | Details |
|---|---|
| **Student Name** | Vemuri Jaswanth |
| **Registration Number** | 252U1R1256 |
| **Section** | CSE-CORE-2E |
| **Course** | Backend Development Fundamentals |
| **Faculty** | Mr Yugandhar Gurjalwar |
| **Institution** | Aurora Deemed-to-be-University |
| **GitHub Repository** | [https://github.com/JaswanthCodeHub/backend_lab](https://github.com/JaswanthCodeHub/backend_lab) |
| **Repository Path** | `lab-04/` in course GitHub repository |

---

## 🎯 Objective

Implement a secure, production-standard user authentication and authorization subsystem in an **Express.js** and **SQLite** backend application. Configure robust user registration (`POST /register`) with duplicate account prevention and one-way password hashing using **bcrypt**, build secure user login (`POST /login`) verifying credentials with `bcrypt.compare`, and issue digitally signed stateless **JSON Web Tokens (JWT)** via `jwt.sign` for authenticated sessions. Enforce strict input validation, eliminate plain-text credential persistence, apply parameterized SQL queries against SQL injection, and return precise HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **Node.js** | Server-side JavaScript runtime environment executing non-blocking asynchronous I/O |
| **Express.js** | Minimalist web application framework providing routing, body parsing, and middleware handling |
| **SQLite** | Serverless, zero-configuration, transactional relational database engine |
| **sqlite & sqlite3** | Promise-based SQLite client wrapper and native C++ SQLite database driver for Node.js |
| **bcrypt** | Cryptographic library implementing the Blowfish-based adaptive one-way password hashing algorithm |
| **jsonwebtoken (JWT)** | Industry-standard implementation for signing, transmitting, and verifying stateless JSON Web Tokens |
| **Nodemon** | Automated development supervisor that monitors source files and restarts the server on code changes |
| **REST Client / Postman** | API testing environment for constructing HTTP requests and validating response payloads and status codes |
| **Git & GitHub** | Distributed version control and remote code repository management |
| **Render** | Cloud hosting platform for deploying and running the Node.js production service |

---

## 📁 Project Structure

```text
lab-04/
├── database/            # SQLite storage directory (auto-created on server launch)
│   └── users.db         # Persistent SQLite database file containing user table
├── node_modules/        # Installed npm dependencies (git-ignored)
├── screenshots/         # Functional verification evidence screenshots
│   └── .gitkeep         # Preserves screenshots directory in version control
├── .gitignore           # Excludes node_modules, .env, *.db, and logs from Git
├── lab-04.http          # Automated REST Client request test suite
├── package.json         # Project metadata, run scripts, and npm dependencies
├── package-lock.json    # Deterministic dependency tree lockfile
├── README.md            # Comprehensive Lab 4 academic and architectural documentation
└── server.js            # Express application entry point, database setup, and route handlers
```

---

## 🗄️ Database Structure

**Database File:** `database/users.db`  
**Table:** `user`

```sql
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  name TEXT,
  password TEXT
);
```

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique sequential identifier assigned to each registered user |
| `username` | TEXT | UNIQUE | Case-sensitive unique account login handle |
| `name` | TEXT | None | Full legal or display name of the registered user |
| `password` | TEXT | None | 60-character cryptographic bcrypt hash (plain-text passwords are never stored) |

### Cryptographic Storage Guarantee

Under no circumstances is a raw, plain-text password stored in the database. When a user submits credentials during registration, `server.js` processes the string through `bcrypt.hash(password, 10)` before executing the SQL `INSERT` statement. The resulting hash string conforms to the modular crypt format:

$$\underbrace{\$2b\$}_{\text{Algorithm}} \overbrace{10\$}^{\text{Cost Factor}} \underbrace{\text{22-char salt}}_{\text{Random Salt}} \overbrace{\text{31-char hash value}}^{\text{Digest}}$$

---

## 🔌 Database Initialization & Architecture

The application implements an asynchronous lifecycle startup routine via `initializeDBAndServer()`:

1. **Synchronous Directory Verification:** Checks whether `database/` exists using `fs.existsSync(dbDir)` and creates it synchronously using `fs.mkdirSync(dbDir, {recursive: true})` before attempting SQLite initialization, preventing fatal `SQLITE_CANTOPEN` errors on fresh container or cloud checkouts.
2. **Database Driver Connection:** Resolves the absolute database path via `path.join(__dirname, 'database', 'users.db')` and initializes the SQLite driver with asynchronous promise handling using `open()`.
3. **Automated Schema Provisioning:** Executes `db.exec()` with `CREATE TABLE IF NOT EXISTS user ...` to guarantee that the required relational table and constraints exist before the server accepts incoming HTTP connections.
4. **Environment-Aware Port Binding:** Binds the Express listener to `process.env.PORT || 3000` to support dynamic port allocation by cloud infrastructure (such as Render) while defaulting to `3000` for local development.
5. **Fail-Fast Error Handling:** Traps unhandled database errors during initialization, prints a descriptive error log to standard output, and exits the process immediately with code `1`.

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js**: v18.x or v20.x LTS recommended
- **npm**: v9.x or later (bundled with Node.js)
- **SQLite CLI**: (Optional, for direct terminal database queries)

### Step-by-Step Setup

1. **Navigate to the Lab 4 directory:**
   ```powershell
   cd "lab-04"
   ```

2. **Install project dependencies:**
   ```powershell
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   A `.env` file can be placed in `lab-04/` for custom port overrides (strictly excluded from Git):
   ```env
   PORT=3000
   ```

4. **Start the Application:**
   - **Development Mode (with auto-reload via Nodemon):**
     ```powershell
     npm run dev
     ```
   - **Production Mode:**
     ```powershell
     npm start
     ```

5. **Local Server Verification:**
   ```
   http://localhost:3000/
   ```

---

## 📡 API Endpoints Directory

| Method | Endpoint | Live Render Link | Description | Success Status | Error Status |
|:---:|---|:---:|---|:---:|:---:|
| **GET** | `/` | [Open Live Link](https://backend-lab-h2hp.onrender.com/) | API status and student verification | `200 OK` | — |
| **GET** | `/register` | [Open Live Link](https://backend-lab-h2hp.onrender.com/register) | Registration endpoint info & sample payload format | `200 OK` | — |
| **POST** | `/register` | [API Endpoint](https://backend-lab-h2hp.onrender.com/register) | Register new user with hashed password | `201 Created` | `400 Bad Request`, `500 Error` |
| **GET** | `/login` | [Open Live Link](https://backend-lab-h2hp.onrender.com/login) | Login endpoint info & sample payload format | `200 OK` | — |
| **POST** | `/login` | [API Endpoint](https://backend-lab-h2hp.onrender.com/login) | Authenticate user credentials and issue signed JWT | `200 OK` | `400 Bad Request`, `500 Error` |
| **ALL** | `/*` | [Open Live Link (404 Test)](https://backend-lab-h2hp.onrender.com/notfound) | Catch-all handler for undefined paths | — | `404 Not Found` |

---

## 📝 Request & Response Specifications

### 1. Welcome & Status Check (`GET /`)
- **Method:** `GET`
- **URL:** `http://localhost:3000/`
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "message": "Lab 4: Registration, Login and JWT Authentication",
    "student": {
      "name": "Vemuri Jaswanth",
      "registrationNumber": "252U1R1256",
      "section": "CSE-CORE-2E",
      "faculty": "Mr Yugandhar Gurjalwar",
      "college": "Aurora Deemed-to-be-University"
    },
    "status": "Online",
    "endpoints": {
      "register": "POST /register",
      "login": "POST /login"
    }
  }
  ```

---

### 2. User Registration (`POST /register`)

#### Scenario A: Successful User Registration
- **Method:** `POST`
- **URL:** `http://localhost:3000/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth",
    "name": "Vemuri Jaswanth",
    "password": "securePassword123"
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:**
  ```text
  User registered successfully
  ```

#### Scenario B: Duplicate Username Registration
- **Method:** `POST`
- **URL:** `http://localhost:3000/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth",
    "name": "Vemuri Jaswanth",
    "password": "securePassword123"
  }
  ```
- **Response Status:** `400 Bad Request`
- **Response Body:**
  ```text
  Username already exists
  ```

#### Scenario C: Missing Mandatory Registration Fields
- **Method:** `POST`
- **URL:** `http://localhost:3000/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth",
    "name": "Vemuri Jaswanth"
  }
  ```
- **Response Status:** `400 Bad Request`
- **Response Body:**
  ```text
  Username, name and password are required
  ```

---

### 3. User Login & Token Generation (`POST /login`)

#### Scenario A: Successful Authentication
- **Method:** `POST`
- **URL:** `http://localhost:3000/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth",
    "password": "securePassword123"
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN1ZGhhcnNoYW4iLCJpYXQiOjE3OTQ2NTY4MDB9.somerandomsignaturestring..."
  }
  ```

#### Scenario B: Unknown Username
- **Method:** `POST`
- **URL:** `http://localhost:3000/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "unregistered_user",
    "password": "securePassword123"
  }
  ```
- **Response Status:** `400 Bad Request`
- **Response Body:**
  ```text
  Invalid username
  ```

#### Scenario C: Incorrect Password
- **Method:** `POST`
- **URL:** `http://localhost:3000/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth",
    "password": "wrongPasswordXYZ"
  }
  ```
- **Response Status:** `400 Bad Request`
- **Response Body:**
  ```text
  Invalid password
  ```

#### Scenario D: Missing Login Fields
- **Method:** `POST`
- **URL:** `http://localhost:3000/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "jaswanth"
  }
  ```
- **Response Status:** `400 Bad Request`
- **Response Body:**
  ```text
  Username and password are required
  ```

---

### 4. Undefined Route Handler (`ALL /*`)
- **Method:** `GET` / `POST` / `PUT` / `DELETE`
- **URL:** `http://localhost:3000/undefined-route`
- **Response Status:** `404 Not Found`
- **Response Body:**
  ```text
  Page not found
  ```

---

## 🔒 Security Architecture & Cryptographic Principles

### 1. One-Way Password Hashing vs. Two-Way Encryption
- **Encryption** is a two-way mathematical transformation designed for confidentiality. Data encrypted with a key can be decrypted back into plain text using the matching key. Storing encrypted passwords creates a catastrophic single point of failure: if an attacker compromises the decryption key, every user password in the entire database is instantly revealed.
- **Hashing** is a strictly one-way mathematical function that maps an arbitrary input string to a fixed-length cryptographic digest. There is no decryption key and no mathematical algorithm to reverse the hash back into the password. During authentication, the incoming candidate password is fed into the same algorithm, and the resulting digest is compared against the stored hash.

### 2. bcrypt Algorithm & Salt Rounds
- `bcrypt` uses an adaptive salt-based hash derived from the Blowfish block cipher.
- A **salt** is a cryptographically secure random string concatenated with the password before hashing. This ensures that two users who choose the exact same password will have completely distinct hash outputs in the database, completely invalidating pre-computed **Rainbow Table attacks**.
- **Work Factor (Cost):** The parameter `10` passed to `bcrypt.hash(password, 10)` dictates the number of hashing rounds as $2^{10} = 1024$ iterations. This intentional computational cost makes brute-force dictionary attacks infeasible for attackers while remaining imperceptibly fast (under 100ms) for legitimate login attempts.

### 3. Anatomy of a JSON Web Token (JWT)
A JSON Web Token consists of three base64url-encoded parts separated by periods (`.`):

```
HEADER.PAYLOAD.SIGNATURE
```

1. **Header:** Identifies the signing algorithm (e.g. `HS256` for HMAC with SHA-256) and the token type (`JWT`).
   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```
2. **Payload:** Contains the claims (user metadata). In our implementation, we strictly store the identity claim:
   ```json
   {
     "username": "jaswanth",
     "iat": 1794656800
   }
   ```
   > [!IMPORTANT]
   > The JWT payload is only Base64URL encoded, **not encrypted**. Anyone in possession of the token can decode and view its claims at [jwt.io](https://jwt.io). Therefore, sensitive data such as passwords, credit card numbers, or secret keys must **never** be included in the token payload.
3. **Signature:** Generated by taking the encoded header, the encoded payload, a secret key, and the algorithm specified in the header:
   ```
   HMACSHA256(
     base64UrlEncode(header) + "." + base64UrlEncode(payload),
     secretKey
   )
   ```
   The signature guarantees token integrity. If an attacker tampers with the username in the payload, the signature will no longer match, and the token verification will be immediately rejected.

### 4. SQL Injection Immunity
All database interactions use SQLite prepared statements with parameter binding placeholders (`?`):
```javascript
const selectUserQuery = 'SELECT * FROM user WHERE username = ?;'
const existingUser = await db.get(selectUserQuery, [username])
```
User-supplied inputs are never concatenated directly into SQL query strings. The database engine compiles the query structure first, treating bound parameters exclusively as literal values.

---

## 🧪 SQLite CLI Verification

The state of the database and verification of hashed passwords can be inspected directly using the SQLite CLI:

```bash
sqlite3 database/users.db
```

```sql
-- Format tabular terminal display:
.headers on
.mode column

-- View all registered user records:
SELECT id, username, name, password FROM user;

-- Verify specific user lookup:
SELECT id, username, name, password FROM user WHERE username = 'jaswanth';

-- Exit SQLite CLI:
.exit
```

**Expected SQLite Output:**
```text
id  username    name              password
--  ----------  ----------------  ------------------------------------------------------------
1   jaswanth  Vemuri Jaswanth  $2b$10$WpZ9mZ8E9YwQjE7vJqG9NuX9zQ7fE8rY6uT5wR4eP3oI2uY1tT0eO
```
*Note that the `password` column contains the 60-character bcrypt hash rather than plain text.*

---

## 📸 Screenshots Directory & Evidence

All verification screenshots captured during testing are stored in the [`screenshots/`](screenshots/) directory:

### 1. Express Server Startup with Nodemon
- **Local Server Endpoint:** `http://localhost:3000/`
- **Render Live URL:** [https://backend-lab-h2hp.onrender.com/](https://backend-lab-h2hp.onrender.com/)

Shows Nodemon starting the server cleanly on port 3000 and logging database connectivity:
![Server Startup](screenshots/01-server-start-nodemon.png)

### 2. Successful User Registration (`POST /register` -> `201 Created`)
- **Render Endpoint:** `https://backend-lab-h2hp.onrender.com/register`
- **Expected HTTP Status:** `201 Created`

Demonstrates registering a new user with `username`, `name`, and `password`:
![User Registration Success](screenshots/02-register-user-success.png)

### 3. Duplicate Username Rejection (`POST /register` -> `400 Bad Request`)
- **Render Endpoint:** `https://backend-lab-h2hp.onrender.com/register`
- **Expected HTTP Status:** `400 Bad Request`

Demonstrates rejection of a username that already exists in the database:
![Duplicate Registration 400](screenshots/03-register-duplicate-user-400.png)

### 4. Successful User Login & JWT Generation (`POST /login` -> `200 OK`)
- **Render Endpoint:** `https://backend-lab-h2hp.onrender.com/login`
- **Expected HTTP Status:** `200 OK`

Demonstrates authenticating valid credentials and returning a signed `{ jwt_token }`:
![Login Success JWT](screenshots/04-login-user-success-jwt.png)

### 5. Invalid Username Rejection (`POST /login` -> `400 Bad Request`)
- **Render Endpoint:** `https://backend-lab-h2hp.onrender.com/login`
- **Expected HTTP Status:** `400 Bad Request`

Demonstrates login rejection when the username does not exist:
![Invalid Username 400](screenshots/05-login-invalid-username-400.png)

### 6. Invalid Password Rejection (`POST /login` -> `400 Bad Request`)
- **Render Endpoint:** `https://backend-lab-h2hp.onrender.com/login`
- **Expected HTTP Status:** `400 Bad Request`

Demonstrates login rejection when the provided password fails `bcrypt.compare`:
![Invalid Password 400](screenshots/06-login-invalid-password-400.png)

### 7. SQLite CLI Database Inspection
- **Inspection Command:** `npm run db`

Displays the `user` table proving passwords are stored strictly as bcrypt hashes:
![SQLite CLI Table](screenshots/07-sqlite-cli-users-table.png)

### 8. JWT Token Decoding on jwt.io
- **Verification Portal:** [https://jwt.io](https://jwt.io)

Displays the token decoded into Header, Payload (`{ username }`), and verified Signature:
![JWT.io Inspection](screenshots/08-jwt-io-token-inspection.png)

### 9. REST Client Complete Test Suite (`lab-04.http`)
Shows the end-to-end execution of all six registration and login test cases:
![REST Client Test Suite](screenshots/09-rest-client-test-suite.png)

### 10. Clean Server Implementation (`server.js`)
Shows the production Express.js implementation with 0 comments and structured error handling:
![Server Implementation](screenshots/10-server-implementation.png)

---

## ❗ Notes: Problems Faced and Solutions

| # | Challenge / Error | Root Cause | Diagnosis & Resolution |
|:---:|---|---|---|
| **1** | **Missing C++ Bindings (`Could not locate bindings file`)** | On Windows with Node.js v26, npm v11 blocks automated post-install scripts by default, causing missing compiled binaries for `sqlite3` and `bcrypt`. | Ran prebuild download scripts directly via `npx prebuild-install -r napi` for `sqlite3` and `npx @mapbox/node-pre-gyp install` for `bcrypt` to download precompiled `.node` native binary artifacts without needing a C++ compiler. |
| **2** | **Terminal Launch Error (`conpty.node blocked by policy`)** | Antigravity IDE terminal failed on Windows due to system application control blocking the `conpty.node` native pseudoconsole driver. | Configured `"terminal.integrated.windowsEnableConpty": false` in IDE user settings, safely falling back to standard WinPTY terminal emulation. |
| **3** | **Database Directory Error (`SQLITE_CANTOPEN`)** | SQLite cannot create a database file if its parent folder does not exist on disk on a fresh repository checkout. | Added synchronous directory verification in `server.js` using `fs.existsSync(dbDir)` and `fs.mkdirSync(dbDir, {recursive: true})` before opening the SQLite database connection. |
| **4** | **Plain-Text Credential Vulnerability** | Storing plain-text passwords violates fundamental backend security practices and course guidelines. | Integrated `bcrypt` with a cost factor of 10 salt rounds to compute one-way mathematical hashes before writing records to the database. |
| **5** | **Sensitive Data Leakage in JWT Payload** | Putting passwords or private user data into token payloads exposes credentials because JWT payloads are merely Base64URL-encoded. | Restricted token claims strictly to `{ username: username }`, reserving sensitive user data on the secure backend. |

---

## 🚀 Deployment on Render

### Steps to Deploy

1. **Sign up** on [Render](https://render.com/) using your GitHub account.

2. **Create a New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository: `backend_lab`

3. **Configure the Service:**

   | Setting | Value |
   |---|---|
   | **Name** | `backend-lab-lab-04` |
   | **Root Directory** | `lab-04` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Environment Variable** | `NODE_VERSION: 20.18.0` |

4. **Deploy** and wait for the build to complete.

5. **Verify by visiting the deployed Render URLs:**
   - **Main Server / Student Info:** [https://backend-lab-h2hp.onrender.com/](https://backend-lab-h2hp.onrender.com/)
   - **GET Register Info:** [https://backend-lab-h2hp.onrender.com/register](https://backend-lab-h2hp.onrender.com/register)
   - **GET Login Info:** [https://backend-lab-h2hp.onrender.com/login](https://backend-lab-h2hp.onrender.com/login)
   - **POST User Registration:** `https://backend-lab-h2hp.onrender.com/register`
   - **POST User Login & Token Generation:** `https://backend-lab-h2hp.onrender.com/login`
   - **404 Route Not Found Test:** [https://backend-lab-h2hp.onrender.com/notfound](https://backend-lab-h2hp.onrender.com/notfound)

---

## 🎓 Viva Voce Questions & Answers

| # | Question | Comprehensive Answer |
|:---:|---|---|
| **1** | **Why must the HTTP `POST` method be used for login instead of `GET`?** | In HTTP `GET` requests, parameters are appended directly to the URL query string (`/login?username=admin&password=secret`). This causes sensitive passwords to be stored in plain text in browser histories, proxy logs, server access logs, and HTTP `Referer` headers. In contrast, `POST` encapsulates credentials inside the HTTP request body, which is encrypted in transit over HTTPS and never recorded in access logs or URLs. |
| **2** | **What is the fundamental difference between Hashing and Encryption?** | **Hashing** is a one-way mathematical function that converts input into a fixed-length digest that cannot be reversed. It is used for password verification without ever storing plain text. **Encryption** is a two-way mathematical process with a key, allowing encrypted data to be decrypted back to its original plain text. Encrypting passwords is unsafe because compromising the decryption key compromises all user accounts. |
| **3** | **What three components does `jwt.sign()` require to generate a token?** | `jwt.sign()` requires: (1) **Payload**: a JavaScript object containing identity claims (e.g., `{ username }`); (2) **Secret Key**: a private string used by the HMAC-SHA256 algorithm to generate the cryptographic signature; and (3) **Options (Optional)**: configuration settings such as token expiry duration (e.g., `{ expiresIn: '1h' }`) or signature algorithm. |
| **4** | **What should NEVER be included in a JWT token payload, and why?** | Sensitive data such as passwords, password hashes, credit card numbers, Social Security numbers, or private encryption keys should **never** be placed in a JWT payload. The payload of a JWT is not encrypted—it is merely Base64URL-encoded. Anyone who intercepts or possesses the token can decode and view the entire payload in plain text using tools like `jwt.io`. |
| **5** | **What is a "salt" in bcrypt and what do the "salt rounds" represent?** | A **salt** is a cryptographically secure string of random characters automatically generated and concatenated with the password before hashing. It guarantees that identical passwords generate completely different hashes, neutralizing pre-computed Rainbow Table attacks. The **salt rounds** (e.g. 10) define the work factor ($2^{10} = 1024$ computational iterations), making brute-force dictionary attacks computationally prohibitive for attackers. |

---

## 📜 Core Rules & Academic Integrity

- **Environment & Secrets:** `.env`, `node_modules/`, and local database files are excluded from Git via `.gitignore`.
- **Zero Plain-Text Credential Exposure:** Passwords are never stored, logged, or serialized in plain text.
- **Accurate HTTP Semantics:** Every endpoint returns semantically correct HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
- **Data Protection:** All database queries utilize parameterized prepared statements (`?`) to prevent SQL injection.
- **Originality:** Code and documentation are authored and maintained by the student.

---

## ✅ Conclusion

Through **Lab 4**, I achieved the following learning outcomes:
1. Designed a secure user registration workflow with validation and duplicate username prevention.
2. Integrated `bcrypt` to hash sensitive passwords using adaptive salts and a cost factor of 10.
3. Implemented secure credential verification using `bcrypt.compare` during user login.
4. Generated and signed stateless JSON Web Tokens (JWT) using `jsonwebtoken` with safe identity claims.
5. Deployed the complete Node.js application to Render with automated cloud hosting configuration.
6. Verified API behavior through comprehensive HTTP client test suites and direct SQLite database inspection.

---

## 👤 Author & Academic Attribution

**Vemuri Jaswanth**  
**Registration Number:** `252U1R1256`  
**Section:** `CSE-CORE-2E`  
**Department of Computer Science & Engineering**  
**Aurora Deemed-to-be-University**
