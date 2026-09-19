# CORS Configuration Reference

Cross-Origin Resource Sharing (CORS) rules and origin whitelists in CIRCLE.

---

## 1. Whitelisted Origins
In development:
- `http://localhost:3000` (Next.js web & admin)
- `exp://localhost:8081` (Expo development server)

In production:
- `https://circle.example.com`
- `https://admin.circle.example.com`

---

## 2. Allowed Methods & Headers
- **Methods:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- **Headers:** `Content-Type`, `Authorization`, `X-Requested-With`, `X-Client-Version`.
- **Credentials:** `true` (enables cookies and authorization headers across origins).
