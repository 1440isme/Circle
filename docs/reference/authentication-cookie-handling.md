# Authentication & Cookie Handling Reference

Reference on token transmission, cookie policies, and security attributes.

---

## 1. Transmission Strategy
- **Access Tokens:** Transmitted exclusively in the `Authorization: Bearer <token>` header to mitigate CSRF vulnerabilities.
- **Refresh Tokens:** Stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie when invoked through web browsers, or returned in response JSON for mobile clients storing in hardware keystores (`SecureStore`).

---

## 2. Cookie Security Attributes
- `HttpOnly`: True (prevents JavaScript access, mitigating XSS token theft).
- `Secure`: True (transmitted only over HTTPS in staging and production).
- `SameSite`: `Strict` (prevents transmission during cross-site navigations).
