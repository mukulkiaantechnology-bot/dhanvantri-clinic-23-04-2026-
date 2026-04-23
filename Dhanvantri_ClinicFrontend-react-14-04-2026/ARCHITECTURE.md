# Backend System Architecture: EV Clinic Management System

## 1. Layered Architecture (The Clean Approach)
The system follows a **Separation of Concerns (SoC)** principle, ensuring that business logic is strictly decoupled from the transport layer.

### **The Layers**
1.  **Transport Layer (Routes)**: Defines endpoints and applies middlewares.
2.  **Controller Layer**: Handles HTTP requests, extracts parameters, and maps responses. No business logic.
3.  **Service Layer**: The "Brain". Core business logic, tax calculations, status transitions.
4.  **Repository Layer**: Encapsulates data access. Direct communication with Prisma.
5.  **Persistence Layer (Prisma/MySQL)**: Database schema and atomic SQL executions.

---

## 2. Folder Structure (Express + TypeScript)
```text
/src
├── api/
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request/Response handlers
│   └── middlewares/        # Auth, RBAC, Error, Logger
├── core/
│   ├── services/           # Business logic services
│   ├── repositories/       # Prisma query abstraction
│   └── interfaces/         # Global TS interfaces
├── database/
│   ├── prisma/             # Schema, migrations, client
│   └── seeds/              # Initial system data
├── utils/
│   ├── validation/         # Zod/Joi schemas
│   ├── errors/             # Custom Error classes
│   └── helpers/            # Date/Currency formatters
├── config/                 # Env vars, DB config, JWT secrets
└── app.ts                  # Express setup
```

---

## 3. Security & Authentication Flow
### **JWT Lifecycle**
1.  **Identity Phase**: `login` returns a `refresh_token` (HTTP-only cookie) and an `access_token` (JWT).
2.  **Discovery Phase**: `access_token` allows fetching user's clinics.
3.  **Session Phase**: `select-clinic` returns a scoped `session_token` containing `clinicId` and `activeRole`.
4.  **Rotation Phase**: `refresh_token` allows silent acquisition of new `access_tokens`.

### **Authorization Flow (RBAC Middleware)**
Every protected request undergoes:
*   **Decryption**: JWT extracted from `Bearer` header.
*   **Tenancy Check**: Resource ID must belong to `clinicId` in token.
*   **Role Check**: User's `activeRole` must exist in the `allowedRoles` array for that route.

---

## 4. Operational Strategies

### **Error Handling Strategy**
*   **Uniformity**: A global `ErrorHandler` middleware catches all exceptions.
*   **Custom Exceptions**: `AppError` class handles `statusCode`, `errorCode`, and `isOperational` flag.
*   **Sanitization**: Raw DB errors (Prisma errors) are never sent to the client; they are mapped to custom errors.

### **Logging Strategy**
*   **Development**: Morgan logs every incoming request.
*   **Production**: Winston records `info` and `error` logs to rotating files/cloud sinks.
*   **Audit**: Specialized `AuditService` records every modification (POST/PATCH/DELETE) in a dedicated table.

### **Environment Configuration**
*   Managed via `.env` with a strict validation on startup.
*   Levels: `NODE_ENV=development | staging | production`.

---

## 5. Scalability Considerations (100k+ Users)
*   **Horizontal Scaling**: No local session storage. API instances are completely stateless.
*   **Caching Layer**: Redis used for caching `Role-Permission` maps and `Medicine Catalogs`.
*   **Database Scaling**: 
    1.  Prisma `Accelerate` or `Read-Replicas` for reporting.
    2.  Indexes on `clinicId` and `patientId` for sub-50ms lookups.
*   **Rate Limiting**: `express-rate-limit` prevents brute force and DDoS.

---
*Created by: Senior Backend Architect*
