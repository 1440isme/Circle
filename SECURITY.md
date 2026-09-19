# Security Policy

Security guidelines and vulnerability disclosure protocol for CIRCLE.

---

## 1. Supported Versions

| Version | Supported |
|---|---|
| Develop (`develop`) | ✅ |
| Production Releases (`v1.x`) | ✅ |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or credential leak:
1. **Do NOT open a public issue.**
2. Report privately to the development team:
   - Trương Công Bình (`binhtruong@example.com`)
   - Ninh Thị Mỹ Hạnh (`hanhninh@example.com`)
3. If an API key or secret was accidentally committed, follow the [`agentic/skills/secrets-incident.md`](./agentic/skills/secrets-incident.md) playbook immediately.

---

## 3. Security Requirements

- All passwords must be hashed using bcrypt (cost 12).
- JWT tokens must use separate keys for access and refresh tokens.
- All client inputs must be sanitized to prevent XSS and SQL injection.
- Zero secrets committed to git (checked by CI pre-commit hooks).
