# Content Security Policy (CSP) Reference

Content Security Policy headers configured on Traefik and Next.js.

---

## 1. Directives

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://media.circle.example.com;
  media-src 'self' blob: https://media.circle.example.com;
  connect-src 'self' wss://api.circle.example.com https://api.circle.example.com;
  frame-ancestors 'none';
```
