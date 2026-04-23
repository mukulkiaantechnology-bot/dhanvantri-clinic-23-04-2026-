# Backend Engineering Rules: EV Clinic HIS

## 1. TypeScript & Coding Standards
*   **Strict Mode**: `strict: true` is mandatory in `tsconfig.json`.
*   **Explicit Types**: Every function MUST have explicit return types and parameter types.
*   **Discouraged Types**: Use of `any` is a catastrophic failure. Use `unknown` or `Record<string, unknown>`.
*   **Asynchronous Code**: Always use `async/await`. Avoid raw `.then()` chains.

---

## 2. File & Naming Conventions
*   **Routes**: `*.routes.ts`
*   **Controllers**: `*.controller.ts` (Class-based, e.g., `PatientController`)
*   **Services**: `*.service.ts`
*   **Models**: `singular_snake_case` (DB) vs `PascalCase` (Prisma/TS).
*   **Constants**: `UPPER_SNAKE_CASE`.

---

## 3. API Response Standards
Every successful response MUST follow this structure:
```json
{
  "status": "success",
  "data": { ... },
  "message": "Human readable summary"
}
```

---

## 4. Error Handling Rules
*   **Throw Early**: Throw custom `AppError` exceptions in the Service layer.
*   **Catch Globally**: Never use `try-catch` in Controllers. Let the global Error Handler catch unhandled promise rejections.
*   **Sensitive Data**: Stack traces are ONLY shown if `NODE_ENV === "development"`.

---

## 5. Security Rules
*   **Hashing**: Never store plain-text passwords. Use `Argon2` or `Bcrypt` with a cost factor >= 12.
*   **JWT**: Tokens must expire after 1 hour (Access) or 7 days (Refresh). Use RS256 signing.
*   **SQL Injection**: Never use raw string interpolation for queries. Use Prisma's parameterized inputs.
*   **Input Sanitization**: Use `DOMPurify` (if applicable) or strict type-casting for all user-provided IDs.

---

## 6. Validation Rules
*   **Front-Gate Validation**: Every `POST`/`PATCH` request body must be validated against a **Zod** or **Joi** schema before reaching the service.
*   **Range Validation**: Numeric inputs (Amounts, Ages) must have strict min/max boundaries.

---

## 7. Commit & Branching Rules
*   **Branches**: 
    *   `main`: Production only.
    *   `feat/*`: For new features.
    *   `fix/*`: For bug fixes.
*   **Commit Messages**: Use **Conventional Commits**.
    *   `feat(auth): implement refresh token rotation`
    *   `fix(billing): resolve rounding error in UAE VAT`

---

## 8. Code Review Checklist (Peer Review)
1.  Is there any use of `any`?
2.  Is `clinicId` properly checked for data isolation?
3.  Are there unit tests for complex business logic?
4.  Is sensitive info (password/secret) being logged?
5.  Is the DB query optimized (no N+1 problems)?

---
*Created by: Lead Node.js Engineer*
