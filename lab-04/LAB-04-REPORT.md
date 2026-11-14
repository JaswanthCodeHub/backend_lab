# BDF Lab Report 04 — Registration, Login and JWT

**Aurora Deemed-to-be-University · Department of Computer Science & Engineering**

| Field | Details |
|---|---|
| Student name | Vemuri Jaswanth |
| Registration number | 252U1R1256 |
| Section | CSE-CORE-2E |
| Course | Backend Development Fundamentals |
| Faculty | Mr Yugandhar Gurjalwar |
| Experiment | Lab 04 — Registration, Login and JWT |
| Source | [GitHub repository](https://github.com/JaswanthCodeHub/backend_lab) |

## 1. Aim

Build an Express API that registers users in SQLite, stores bcrypt password hashes, and issues a signed JSON Web Token after a successful login.

## 2. Tools and database design

Node.js runs the server, Express handles JSON requests, `sqlite` and `sqlite3` provide database access, bcrypt hashes and checks passwords, and `jsonwebtoken` signs login tokens. Postman and the [HTTP request file](lab-04.http) provide repeatable API scenarios.

The server initializes `database/users.db` using [db.js](db.js). The `users` table holds the following fields.

| Field | SQLite type and constraints | Purpose |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique row identifier |
| `username` | `TEXT UNIQUE NOT NULL` | Login identifier |
| `name` | `TEXT NOT NULL` | Display name |
| `password` | `TEXT NOT NULL` | bcrypt hash |

## 3. Implementation procedure

1. Start the server after SQLite opens and initializes the table. Express parses JSON requests and listens on port `5002` by default.
2. For `POST /register`, validate `username`, `name`, and `password`; check username availability; hash the password with 10 bcrypt salt rounds; and insert the row with SQL parameters. The `UNIQUE` constraint also prevents duplicates when two registrations arrive together.
3. For `POST /login`, validate both fields, find the user with a parameterized lookup, and compare the submitted password with the saved hash using `bcrypt.compare()`.
4. On successful login, return `jwt_token`. The HS256 token expires after one hour. Its only application claim is `username`; `iat` and `exp` are standard time claims.
5. Reject passwords beyond 72 UTF-8 bytes to avoid bcrypt truncation. Return a generic JSON error for unexpected database errors. The signing constant is for the classroom exercise.

## 4. Running the experiment

From the repository root, run the following commands. Run `npm start` as a separate step after the tests finish.

```powershell
cd lab-04
npm install
npm test
npm start
```

Import the [Postman collection](lab-04.postman_collection.json). Use `http://localhost:5002` and send the requests in collection order. For manual requests, choose **Body → raw → JSON** and set `Content-Type: application/json`. Register a fresh disposable username first and reuse it for the duplicate and login cases.

## 5. Test cases and expected output

| Scenario | Request | Expected status | Expected response |
|---|---|---|---|
| Valid registration | `POST /register` with username, name, and password | 201 | `User registered successfully` |
| Duplicate registration | `POST /register` with the same username | 400 | `Username already exists` |
| Missing registration field | `POST /register` without name | 400 | Required field message |
| Valid login | `POST /login` with matching credentials | 200 | JSON containing `jwt_token` |
| Unknown user | `POST /login` with an unregistered username | 400 | `Unknown username` |
| Incorrect password | `POST /login` with a wrong password | 400 | `Incorrect password` |
| Missing login field | `POST /login` without password | 400 | Required field message |

To verify the token, decode a disposable local token and inspect `username`, `iat`, and `exp`. Signature verification is a separate step performed by the integration test with `jwt.verify()`.

## 6. Evidence to capture

| Evidence | What the screenshot should show |
|---|---|
| Successful registration | `POST /register`, status 201, and confirmation |
| Duplicate registration | `POST /register`, status 400, and duplicate message |
| Successful login | `POST /login`, status 200, and a masked token |
| Incorrect password | `POST /login`, status 400, and error message |
| Unknown username | `POST /login`, status 400, and error message |
| SQLite user record | `users` table with a bcrypt hash for a disposable account |

Save evidence under [screenshots](screenshots/README.md). No screenshots have been captured for this report.

## 7. Observations and result

The implementation and tests are present. JavaScript syntax and JSON checks passed. The npm registry was unreachable during setup, and the offline cache lacked bcrypt. Server startup and the test suite were blocked by missing dependencies, so the expected HTTP responses above remain to be verified. Run `npm install` to regenerate the lockfile before using `npm ci`. The experiment is configured for local execution.

## 8. Viva questions

| Question | Answer |
|---|---|
| Why use bcrypt? | bcrypt stores a salted, one-way representation and can check a password by comparing it against the stored hash. |
| Why use SQL parameters? | SQLite treats bound values as data, so input cannot change the query structure. |
| Why define `UNIQUE` in SQLite? | SQLite enforces the username rule even when registrations arrive concurrently. |
| What does JWT verification check? | It checks the signature and expiry. Decoding reads the claims. |
| Why keep passwords out of the payload? | JWT payloads are readable by anyone who has the token. |

## 9. Conclusion

The experiment connects registration, password hashing, and signed token issuance in one Express service. The Postman collection and automated suite provide a repeatable way to check the expected behavior once dependencies are installed.

## References

- [Lab 03 README](../lab-03/README.md) provided the report structure and the reference for Express and SQLite setup.
- [Lab 04 README](README.md) provides the authentication API contract, setup commands, and Postman examples.
