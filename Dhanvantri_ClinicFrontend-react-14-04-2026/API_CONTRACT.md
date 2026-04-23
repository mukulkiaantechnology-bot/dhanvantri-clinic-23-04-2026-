# API Contract: EV Clinic Management System

## 1. Authentication APIs (`/api/auth`)
| Method | Endpoint | Auth | Roles | Description | Request Body | Response Success (200) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/login` | No | Public | Initial identity verification | `{email, password}` | `{token, user: {id, name}}` |
| `GET` | `/clinics/my` | Yes | All | Lists clinics user belongs to | N/A | `[{clinicId, name, role}]` |
| `POST` | `/select-clinic` | Yes | All | Generates final session token | `{clinicId}` | `{sessionToken, menuPermissions}` |
| `POST` | `/logout` | Yes | All | Invalidate current session | N/A | `{message: "Logged out"}` |

---

## 2. User Management APIs (`/api/users`)
| Method | Endpoint | Auth | Roles | Description | Request Body | Response Success (200/201) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/staff` | Yes | ClinicAdmin | Register new clinic staff | `{name, email, role, phone}` | `{id, name, status: "pending"}` |
| `GET` | `/staff` | Yes | ClinicAdmin | List all staff in active clinic | N/A | `[{id, name, role, status}]` |
| `GET` | `/staff/:id` | Yes | ClinicAdmin, Self | Get detailed staff profile | N/A | `{id, name, email, joinDate}` |
| `PATCH` | `/staff/:id` | Yes | ClinicAdmin | Update staff role or status | `{role?, status?}` | `{id, updated: true}` |
| `DELETE` | `/staff/:id` | Yes | ClinicAdmin | Revoke access for staff | N/A | `{message: "Access revoked"}` |

---

## 3. Role & Permission APIs (`/api/rbac`)
| Method | Endpoint | Auth | Roles | Description | Request Body | Response Success (200) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/roles` | Yes | ClinicAdmin, SuperAdmin | List available roles | N/A | `[{roleId, name, type}]` |
| `GET` | `/permissions/:role` | Yes | ClinicAdmin, SuperAdmin | Get permissions for a role | N/A | `[{action, resource}]` |

---

## 4. Main Business APIs (`/api/business`)

### **A. Patient Registry**
| Method | Endpoint | Auth | Roles | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/patients` | Yes | Reception, Doctor | Register new patient | `{name, dob, gender, phone, email}` |
| `GET` | `/patients` | Yes | Reception, Doctor | Search patients (MRN, Name) | `Query: ?search=XYZ` |
| `GET` | `/patients/:id` | Yes | Doctor, Reception | Get full medical file | N/A |

### **B. Appointments & Calendar**
| Method | Endpoint | Auth | Roles | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/appointments` | Yes | Reception, Patient | Book a new slot | `{doctorId, date, time, reason}` |
| `GET` | `/appointments` | Yes | Reception, Doctor | Fetch calendar view | `Query: ?start=...&end=...` |
| `PATCH` | `/appointments/:id` | Yes | Reception, Doctor | Status transition | `{status: "Approved/Check-In"}` |

### **C. Clinical (Doctors Only)**
| Method | Endpoint | Auth | Roles | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/assessments` | Yes | Doctor | Save clinical assessment | `{patientId, diagnosis, vitals, notes}` |
| `POST` | `/orders` | Yes | Doctor | Issue Lab/Radiology test | `{patientId, testType, priority}` |
| `POST` | `/prescriptions` | Yes | Doctor | Issue e-prescription | `{patientId, meds: [{id, dose}]}` |

### **D. Financial (Billing)**
| Method | Endpoint | Auth | Roles | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/billing/pending` | Yes | Reception | List patients ready for bill | N/A |
| `POST` | `/billing/invoice` | Yes | Reception | Generate final invoice | `{appointmentId, discount?}` |
| `POST` | `/billing/payment` | Yes | Reception | Record cash/card payment | `{invoiceId, amount, method}` |

---

## 5. Admin-Only APIs (Super Admin Tier) (`/api/super`)
| Method | Endpoint | Auth | Roles | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/clinics` | Yes | SuperAdmin | Onboard new clinic entity | `{name, subdomain, address}` |
| `PATCH` | `/clinics/:id/modules` | Yes | SuperAdmin | Configure enabled modules | `{pharmacy: true, lab: false}` |
| `GET` | `/audit-logs` | Yes | SuperAdmin | System-wide audit trail | `Query: ?clinicId=...` |

---

## 6. Standard Error Codes
*   `400_BAD_INPUT`: Validation failed.
*   `401_UNAUTHORIZED`: Token missing or invalid.
*   `403_FORBIDDEN`: Role doesn't have permission.
*   `404_NOT_FOUND`: Resource (Clinic/Patient/User) missing.
*   `409_CONFLICT`: Duplicate email or MRN.
*   `429_TOO_MANY_REQUESTS`: Rate limit exceeded.

---
*Created by: Senior Backend Architect*
