# Project Overview: EV Clinic Management System (EV-CMS)

## 1. Project Purpose & Business Problem
The **EV Clinic Management System (HIS)** is a multi-tenant, enterprise-grade healthcare orchestration platform. 

### **The Business Problem**
Healthcare providers often struggle with fragmented data, manual billing errors, and poor coordination between departments (Lab, Radiology, Clinical). Existing solutions are often either too simple for multi-clinic operations or too complex for daily clinical use.

### **The Solution**
EV-CMS provides a unified, secure, and logically isolated environment where:
*   **Multi-tenancy** allows a single infrastructure to serve thousands of clinics.
*   **Role-Based Access (RBAC)** ensures staff only see what is necessary for their job.
*   **Automated Workflows** bridge the gap between a Doctor's assessment and the Receptionist's invoice.

---

## 2. User Roles & Access Hierarchy
1.  **Super Admin**: Global platform owner. Oversees all clinic entities.
2.  **Clinic Admin**: Tenant owner. Manages local staff, inventory, and facility settings.
3.  **Doctor**: Clinical practitioner. Conducts assessments, issues orders, and views histories.
4.  **Receptionist**: Operational front-desk. Manages bookings, check-ins, and payments.
5.  **Department Head (Lab/Rad)**: Specialized staff managing diagnostic queues.
6.  **Patient**: End-user. Books appointments and views personal health records.

---

## 3. Role-wise Dashboards (See & Do)

### **A. Super Admin Dashboard**
*   **SEE**: Global analytics (active clinics, total revenue, system load), audit logs across all clinics.
*   **DO**: Create new Clinic Entities, Toggle feature modules (Pharmacy, Lab, etc.), Create Clinic Admins, Revoke clinic access.

### **B. Clinic Admin Dashboard**
*   **SEE**: Local staff performance, daily clinic revenue, patient traffic trends.
*   **DO**: Recruit/Manage staff (Doctors/Nurses), Customize assessment templates, Generate unique booking links, Manage clinic-specific pricing.

### **C. Receptionist Dashboard**
*   **SEE**: Master Calendar, Patient queue status (Waiting/Checked-in/With Doctor), Pending billing list.
*   **DO**: Register new patients, Approve/Reschedule bookings, Check-in patients, Generate invoices, Collect payments (Cash/POS).

### **D. Doctor Dashboard**
*   **SEE**: Personal daily schedule, longitudinal patient medical history, previous scan results.
*   **DO**: Record clinical assessments, Issue Lab/Radiology orders, Sign e-prescriptions, View personal revenue reports.

### **E. Patient Portal (Mobile-First)**
*   **SEE**: Upcoming/Past appointments, Downloadable medical reports, Paid/Unpaid invoices.
*   **DO**: Book appointments, Request online cancellations, Pay bills via credit card.

---

## 4. Core Backend Modules (Architectural Blocks)
1.  **Auth Module**: Multi-stage authentication (Global Login -> Clinic Selection). JWT lifecycle management.
2.  **User Module**: Profile management, multi-clinic relationship mapping.
3.  **Role & Permission Module**: Dynamic RBAC engine to validate user actions against their `activeRole`.
4.  **Clinical Module**: Assessments, EMR (Electronic Medical Records), Vitals tracking.
5.  **Operational Module**: Calendar engine, Booking state machine (Pending -> Approved -> Checked-in).
6.  **Financial Module**: Price-book management, Invoice generation, Transaction logging.
7.  **Diagnostic Module**: Laboratory and Radiology order queues and result entry.

---

## 5. High-Level Request Flow
1.  **Client**: Sends HTTPS request with `Authorization: Bearer <JWT>`.
2.  **API Gateway (Express)**: Routes request to the correct Controller.
3.  **Middlewares**: Auth verification -> Tenancy check (ClinicID) -> RBAC validation.
4.  **Controller**: Extracts data and calls the appropriate Service.
5.  **Service**: Executes business logic and communicates with the Repository.
6.  **Database (Prisma/MySQL)**: Atomic data persistence/retrieval.
7.  **Response**: Formatted JSON returned to Client.

---

## 6. Non-Functional Requirements
*   **Security**: AES-256 password hashing (Argon2/Bcrypt), Stateless JWT, Scoped SQL queries (Row-level security logic).
*   **Scalability**: Designed for horizontal scaling (Stateless) to support 100k+ users.
*   **Availability**: Support for DB Read-Replicas for reporting modules.
*   **Observability**: Centralized logging (Winston/Morgan) and Transaction Audit Trails.
*   **Multi-Tenancy**: Logical data isolation ensured by mandatory `clinicId` indexing on all tables.

---
*Created by: Senior Backend Architect*
*Last Updated: January 15, 2026*
