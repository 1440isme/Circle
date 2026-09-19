# Backend Middlewares, Guards & Interceptors

Request pipeline lifecycle across the NestJS backend.

---

## Pipeline Order

1. **Global Exception Filter:** Intercepts uncaught errors, formats standard JSON response structure with error codes and request IDs.
2. **Logging Interceptor:** Measures request latency, logs route, HTTP status code, and IP address.
3. **Authentication Guards (`JwtAuthGuard`):** Validates Bearer JWT header, extracts user context into `req.user`.
4. **Authorization Guards (`RolesGuard`, `CircleGuard`):** Evaluates user roles against `@Roles()` decorator.
5. **Validation Pipes (`ValidationPipe`):** Enforces class-validator schemas with `whitelist: true`, `forbidNonWhitelisted: true`, and automatic type casting.
