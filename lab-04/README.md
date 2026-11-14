# Lab 04 — Registration, Login and JWT

- Student name: [Enter student name]
- Registration number: [Enter registration number]
- Section: [Enter section]

## Objective
Implement registration and login using SQLite, bcrypt password hashes, and signed JWT tokens.

## Repository findings and technologies
Labs 02 and 03 use Node.js, Express, CommonJS, sqlite and sqlite3, with a database directory per lab. There is no shared database configuration. Lab 04 reuses this approach in db.js without changing previous labs or their book databases. Its existing port is 5002 (overridable with PORT). Technologies: Node.js 20+, Express 5, SQLite, bcrypt, jsonwebtoken; nodemon for development. No external database server or credentials are needed.

## Project structure
```text
lab-04/
  screenshots/README.md
  test/auth.test.js
  database/users.db       (generated locally; ignored by Git)
  server.js
  db.js
  package.json
  package-lock.json
  lab-04.http
  lab-04.postman_collection.json
  README.md
  .gitignore
```

## Installation and running
From the repository root:
```powershell
cd lab-04
npm install
npm start
```
Development: `npm run dev`. Automated verification: `npm test`.
Open http://localhost:5002/api/health to check database connectivity.
To override the port in PowerShell: `$env:PORT = '3000'`, then `npm start`.
Update the Postman baseUrl variable to match. Stop with Ctrl+C.

## Database setup
Startup creates database/users.db and the following table if absent. Existing records are preserved. The server starts only after database initialization succeeds.
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL
);
```
Username and name are trimmed; usernames are case-sensitive. Passwords are not trimmed or silently truncated. Non-empty strings are required, and passwords over 72 UTF-8 bytes are rejected because bcrypt has a 72-byte limit. bcrypt.hash uses 10 salt rounds. SELECT and INSERT bind user values with `?` placeholders. UNIQUE protects against concurrent duplicates. Database errors return generic HTTP 500 responses.

To inspect the local database, open database/users.db in DB Browser for SQLite, choose Browse Data, and select users. Alternatively run:
```sql
SELECT id, username, name, password FROM users;
```
Only disposable classroom accounts should appear in screenshots. The password column must contain a bcrypt hash, never the submitted password. The generated database is not committed.

## API and Postman tests
All requests below use **POST**, header **Content-Type: application/json**, and Postman **Body > raw > JSON**. Run registration first, then the remaining requests. Use a fresh username consistently if jaswanth already exists; do not delete existing data just to repeat a test.

| Scenario | Complete URL | JSON request body | Status | Expected JSON response |
|---|---|---|---|---|
| Valid registration | http://localhost:5002/register | `{"username":"jaswanth","name":"Jaswanth","password":"Jaswanth123"}` | 201 | `{"message":"User registered successfully"}` |
| Duplicate registration | http://localhost:5002/register | `{"username":"jaswanth","name":"Jaswanth","password":"Jaswanth123"}` | 400 | `{"message":"Username already exists"}` |
| Missing registration field | http://localhost:5002/register | `{"username":"jaswanth","password":"Jaswanth123"}` | 400 | `{"message":"username, name and password are required non-empty strings"}` |
| Valid login | http://localhost:5002/login | `{"username":"jaswanth","password":"Jaswanth123"}` | 200 | `{"jwt_token":"<generated token>"}` |
| Unknown username | http://localhost:5002/login | `{"username":"unknown_user","password":"Jaswanth123"}` | 400 | `{"message":"Unknown username"}` |
| Incorrect password | http://localhost:5002/login | `{"username":"jaswanth","password":"Wrong123"}` | 400 | `{"message":"Incorrect password"}` |
| Missing login field | http://localhost:5002/login | `{"username":"jaswanth"}` | 400 | `{"message":"username and password are required non-empty strings"}` |

Import lab-04.postman_collection.json into Postman. Its baseUrl defaults to http://localhost:5002. Run the collection in order; its tests check status and response bodies. The collection uses a new disposable username per run. lab-04.http also provides the seven requests for VS Code REST Client. Neither file is proof that Postman was run.

Additional responses: invalid JSON -> 400; body over Express's default limit -> 413; unknown route -> 404; unexpected database failure -> 500. No response returns stored password hashes.

## JWT explanation and verification
Login retrieves the user and checks bcrypt.compare. jwt.sign signs an HS256 token valid for one hour. **username is the only application claim**. The library adds standard iat (issued at) and exp (expiry) claims. Passwords, hashes, name and id are absent.

To inspect a disposable local token, open https://jwt.io/ and paste the jwt_token value into its token decoder. Inspect username, iat and exp in the decoded payload. Do not paste the signing constant or production tokens. Decoding only reveals claims; it does not prove authenticity. The automated tests use jwt.verify locally to check the signature, expiry, exact claim keys, and rejection with a wrong key.

Per the assignment, JWT_SECRET is a classroom-only constant in server.js. It is intentionally not a production credential. Do not reuse it outside the lab. Lab 08 will move secret configuration to the environment. JWTs are signed, not encrypted; never put sensitive information in their payloads. This lab issues tokens; protected routes are outside its scope.

## Actual execution results (14 November 2026)
- JavaScript syntax checks passed for server.js, db.js and test/auth.test.js.
- Online dependency installation failed: ENOTFOUND registry.npmjs.org. Offline installation failed: bcrypt was not cached.
- No dependencies were installed successfully. The existing package-lock.json is preserved but stale; run npm install with network access to regenerate it before using npm ci or submitting.
- Automated tests could not execute their scenarios: MODULE_NOT_FOUND for bcrypt. Live server startup and database verification are blocked by missing packages.
- Postman has not been run. No screenshots or deployment were created.

## Automated test design
`npm test` uses Node's built-in test runner, actual HTTP requests, bcrypt, JWT verification and a temporary on-disk SQLite database. It starts a server on an available local port and cleans up its own test database. It does not modify database/users.db. Tests include all seven assignment scenarios, invalid types, Unicode password byte limits, SQL injection input, duplicate races, database persistence and constraints, malformed JSON, oversized requests, database errors and startup database failure. See the final execution report for actual results; Postman screenshots remain manual work.

## Screenshots
No screenshots have been fabricated. Follow screenshots/README.md and save all six required images there after running Postman and inspecting SQLite.

## Problems addressed and solutions
- Starter app had no authentication: added register/login routes and SQLite initialization.
- Starter README and request file used port 3000 while server used 5002: examples now consistently use the existing 5002 default.
- Duplicate check alone has a race: a UNIQUE constraint and constraint-error handling enforce uniqueness.
- bcrypt truncates inputs beyond 72 bytes: reject these inputs explicitly.
- Database and JSON errors could leak details or produce HTML: use generic JSON error responses.
- Tests should not alter assignment data: run against a temporary database and an ephemeral port.
- Unused starter cors/dotenv dependencies removed; no .env secret migration in this lab.

## Deployment
Not deployed. No public deployment URL is available. Use http://localhost:5002 locally. The classroom signing key must be replaced before any real deployment.

## GitHub submission
From the repository root, review the changes first:
```powershell
git status --short
git diff -- lab-04
npm --prefix lab-04 install
npm --prefix lab-04 test
git add -- lab-04
git diff --cached --stat
git diff --cached --check
git commit -m "Implement Lab 04 registration login and JWT"
git push origin HEAD
```
Only run commit/push yourself after review and adding the required screenshots. node_modules, environment files and local SQLite data are ignored. No changes have been committed or pushed automatically.

## Viva preparation
- Registration hashes the password before inserting; login compares against that hash.
- Hashing is one-way; a random salt prevents identical passwords having identical stored hashes.
- Parameterized SQL keeps input values separate from executable SQL.
- UNIQUE prevents duplicate usernames at the database level; NOT NULL requires values.
- 201 means created; 200 means successful login; 400 means invalid request or credentials for this assignment; 500 means server failure.
- JWT consists of header, payload and signature. Verification checks integrity; decoding alone does not.
- Returning distinct unknown-user and wrong-password messages follows this lab; real authentication services commonly use a generic failure message.
