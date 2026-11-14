# Required manual screenshots

Start the server and follow the API examples in the [Lab 04 README](../README.md). Use a disposable account. Include the full URL, method, request body, status, and response in each Postman screenshot.

1. `01-successful-registration.png` — POST /register with a fresh username, 201, and the success message.
2. `02-duplicate-registration.png` — Repeat registration, 400, and the duplicate username message.
3. `03-successful-login.png` — POST /login, 200, and the jwt_token field. Mask the token value.
4. `04-incorrect-password.png` — Use the registered username and a wrong password, 400, and the error message.
5. `05-unknown-username.png` — Use a username that has never been registered, 400, and the error message.
6. `06-database-hashed-password.png` — Open database/users.db in DB Browser for SQLite. Under Browse Data, select users and show the disposable account with a bcrypt hash in the password column.

These screenshots are pending. Optional evidence includes the missing-field responses and decoded JWT claims for a disposable token.
