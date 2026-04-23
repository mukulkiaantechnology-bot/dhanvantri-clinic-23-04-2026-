export const users = [
  { id: 1, name: "Super Admin", email: "superadmin@evclinic.demo", password: "admin123", role: "SUPER_ADMIN", status: "active" },
  { id: 2, name: "Corporate Admin", email: "corporate@gmail.com", password: "123456", role: "ADMIN", status: "active" },
  { id: 3, name: "Clinic Admin", email: "admin@evclinic.demo", password: "admin123", role: "ADMIN", clinics: [10], status: "active" },
  { id: 4, name: "Doctor User", email: "doctor@evclinic.demo", password: "admin123", role: "DOCTOR", clinics: [10], status: "active" },
  { id: 5, name: "Reception User", email: "reception@evclinic.demo", password: "admin123", role: "RECEPTIONIST", clinics: [10], status: "active" },
  { id: 6, name: "Pharmacy User", email: "pharmacy@evclinic.demo", password: "admin123", role: "PHARMACY", clinics: [10], status: "active" },
  { id: 7, name: "Lab Tech User", email: "lab@evclinic.demo", password: "admin123", role: "LAB", clinics: [10], status: "active" },
  { id: 8, name: "Radiology User", email: "radiology@evclinic.demo", password: "admin123", role: "RADIOLOGY", clinics: [10], status: "active" },
  { id: 9, name: "Accountant User", email: "accountant@evclinic.demo", password: "admin123", role: "ACCOUNTING", clinics: [10], status: "active" },
  { id: 10, name: "Document Controller", email: "doccontrol@evclinic.demo", password: "admin123", role: "DOCUMENT_CONTROLLER", clinics: [10], status: "active" },
  { id: 11, name: "Patient User", email: "patient@evclinic.demo", password: "admin123", role: "PATIENT", clinics: [10], status: "active" }
];

