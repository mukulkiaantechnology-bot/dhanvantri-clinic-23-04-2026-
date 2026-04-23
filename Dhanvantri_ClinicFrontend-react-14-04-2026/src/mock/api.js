import { users } from "./users";
import { dashboardData } from "./dashboard";
import { products } from "./products";
import { reports } from "./reports";
import { MOCK_CLINICS, MOCK_DOCTORS, MOCK_PATIENTS, MOCK_BOOKINGS, MOCK_STATS, MOCK_JWT_TOKEN, MOCK_CORPORATE_ADMIN } from "../data/mockDatabase";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = (data) => ({ success: true, status: "success", data });
const fail = (message) => {
  const error = new Error(message);
  error.response = { data: { message } };
  throw error;
};

const db = {
  users: [...users, { ...MOCK_CORPORATE_ADMIN, password: MOCK_CORPORATE_ADMIN.password || "corporate123", status: "active" }],
  clinics: [...MOCK_CLINICS],
  staff: [
    ...MOCK_DOCTORS,
    { id: 10001, userId: 3, name: "Demo Admin", email: "admin@evclinic.demo", role: "ADMIN", clinics: [10], clinicId: 10, status: "active", joined: "2024-01-15" },
    { id: 10002, userId: 2, name: "Corporate Admin", email: "corporate@gmail.com", role: "ADMIN", clinics: [10, 13, 14], clinicId: 10, status: "active", joined: "2024-02-15" }
  ],
  patients: Object.entries(MOCK_PATIENTS).flatMap(([clinicKey, list]) =>
    (Array.isArray(list) ? list : []).map((p) => ({
      ...p,
      clinicId: Number(clinicKey),
      email: p.email || `${p.name.toLowerCase().replace(/\s+/g, ".")}@test.com`
    }))
  ),
  bookings: Object.entries(MOCK_BOOKINGS).flatMap(([clinicKey, list]) =>
    (Array.isArray(list) ? list : []).map((b) => ({
      ...b,
      clinicId: Number(clinicKey),
      createdAt: b.createdAt || new Date().toISOString()
    }))
  ),
  registrations: [
    { id: 501, firstName: "Ali", lastName: "Khan", email: "alikhan@test.com", address: "Main Road", plan: { id: 1, name: "Starter" }, status: "PENDING", createdAt: new Date().toISOString() },
    { id: 502, firstName: "Sara", lastName: "Josef", email: "saraj@test.com", address: "Market Street", plan: { id: 2, name: "Professional" }, status: "APPROVED", createdAt: new Date().toISOString() }
  ],
  plans: [
    { id: 1, name: "Starter", price: 99, duration: "Monthly", features: ["Appointments", "Billing", "Patient Records"], isActive: true },
    { id: 2, name: "Professional", price: 199, duration: "Monthly", features: ["Everything in Starter", "Lab", "Radiology", "Pharmacy"], isActive: true },
    { id: 3, name: "Enterprise", price: 499, duration: "Monthly", features: ["Everything in Professional", "Multi Clinic", "Priority Support"], isActive: true }
  ],
  alerts: [
    { id: 701, type: "WARNING", message: JSON.stringify({ text: "Two clinics subscription expiring in 7 days", type: "EXPIRY" }), createdAt: new Date().toISOString() },
    { id: 702, type: "INFO", message: JSON.stringify({ text: "Daily backup completed", type: "SYSTEM" }), createdAt: new Date().toISOString() }
  ],
  invoices: [
    { id: "INV-1001", invoiceNumber: "INV-1001", patientName: "Rahul Gupta", clinicName: "Husri Clinic", amount: 1200, status: "Paid", issuedDate: "2024-04-01", dueDate: "2024-04-10", description: JSON.stringify({ note: "Monthly Subscription - Husri Clinic", base: 1000, tax: 200, users: 5 }), clinic: MOCK_CLINICS[0] },
    { id: "INV-1002", invoiceNumber: "INV-1002", patientName: "Sunita Devi", clinicName: "proclinic", amount: 850, status: "Unpaid", issuedDate: "2024-04-05", dueDate: "2024-04-15", description: JSON.stringify({ note: "Service Billing - proclinic", base: 700, tax: 150, pharmacy: true }), clinic: MOCK_CLINICS[1] },
    { id: "INV-1003", invoiceNumber: "INV-1003", patientName: "Rahul Gupta", clinicName: "test 's Clinic", amount: 2500, status: "Paid", issuedDate: "2024-04-08", dueDate: "2024-04-18", description: JSON.stringify({ note: "Advanced Plan - Multi Clinic", base: 2100, tax: 400, users: 20 }), clinic: MOCK_CLINICS[2] },
    { id: "INV-1004", invoiceNumber: "INV-1004", patientName: "Meena Kapoor", clinicName: "Husri Clinic", amount: 1500, status: "Unpaid", issuedDate: "2024-04-12", dueDate: "2024-04-22", description: JSON.stringify({ note: "Pharmacy Module Extension", base: 1270, tax: 230, pharmacy: true }), clinic: MOCK_CLINICS[0] }
  ],
  auditLogs: [
    { id: 1, timestamp: new Date().toISOString(), action: "LOGIN", performedBy: "Corporate Admin", ipAddress: "192.168.1.1", details: "Successful login to dashboard" },
    { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), action: "UPDATE_CLINIC", performedBy: "Super Admin", ipAddress: "192.168.1.1", details: "Updated Husri Clinic subscription plan" },
    { id: 3, timestamp: new Date(Date.now() - 7200000).toISOString(), action: "CREATE_INVOICE", performedBy: "System", ipAddress: "127.0.0.1", details: "Generated monthly invoice for proclinic" },
    { id: 4, timestamp: new Date(Date.now() - 86400000).toISOString(), action: "DELETE_STAFF", performedBy: "Corporate Admin", ipAddress: "192.168.1.5", details: "Deleted temporary staff member ID: 504" }
  ],
  templates: [
    { id: 1, name: "General Assessment", fields: [{ id: "symptoms", label: "Symptoms", type: "textarea" }], department: "GENERAL", specialty: "General", clinicId: 10 },
    { id: 2, name: "Pediatric Intake", fields: [{ id: "weight", label: "Weight", type: "number" }], department: "PEDIATRICS", specialty: "Pediatrics", clinicId: 13 }
  ],
  reports: [{ id: 9001, patientId: 2101, title: "General Report", content: "Normal", createdAt: new Date().toISOString() }],
  documents: [
    {
      id: 1,
      clinicId: 10,
      patientId: 2101,
      patientName: "Rahul Gupta",
      type: "Previous History",
      createdAt: new Date().toISOString(),
      archived: false,
      data: { fileName: "history-rahul.pdf", notes: "Outside treatment summary", fileData: null }
    },
    {
      id: 2,
      clinicId: 10,
      patientId: 2102,
      patientName: "Sunita Devi",
      type: "Outside Lab Report",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      archived: true,
      data: { fileName: "outside-lab-sunita.pdf", notes: "CBC from external center", fileData: null }
    },
    {
      id: 3,
      clinicId: 10,
      staffId: 10001,
      staffName: "Demo Admin",
      staffRole: "ADMIN",
      type: "Passport Copy",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      archived: true,
      data: { fileName: "demo-admin-passport.pdf", notes: "KYC document", fileData: null }
    }
  ],
  pharmacyInventory: products.filter((p) => p.category === "PHARMACY").map((p) => ({
    id: p.id,
    clinicId: 10,
    name: p.name,
    brandName: "EV Generic",
    batchNumber: `BATCH-${p.id}-APR`,
    sku: `SKU-${p.id}`,
    quantity: p.stock,
    unitPrice: p.price,
    expiryDate: "2027-12-31"
  })),
  pharmacySales: [
    {
      id: 9101,
      patientId: 2101,
      patientName: "Rahul Gupta",
      saleMode: "REGISTERED",
      source: "POS",
      paymentStatus: "Pending",
      status: "Pending",
      corporateBilling: false,
      items: [{ inventoryId: 3, quantity: 2, price: 30 }],
      amount: 60,
      testName: "Paracetamol 500mg x2",
      createdAt: new Date().toISOString()
    },
    {
      id: 9102,
      patientId: null,
      patientName: "Outside Patient - Meera Singh",
      saleMode: "OUTSIDE",
      source: "OUTSIDE_PRESCRIPTION",
      paymentStatus: "Pending",
      status: "Pending",
      corporateBilling: true,
      corporateInfo: { companyName: "ABC Infra Ltd", userName: "Meera Singh", employeeCode: "EMP-445" },
      outsidePatient: { name: "Meera Singh", phone: "9876543210", prescriptionRef: "DR-OUT-111" },
      items: [{ inventoryId: 3, quantity: 3, price: 30 }],
      amount: 90,
      testName: "Paracetamol 500mg x3",
      createdAt: new Date().toISOString()
    }
  ],
  labOrders: [
    { id: 1, clinicId: 10, patientId: 2101, patientName: "Rahul Gupta", testName: "CBC", type: "LAB", status: "PENDING", paymentStatus: "Pending", price: 450, result: "", createdAt: new Date().toISOString() },
    {
      id: 2,
      clinicId: 10,
      patientId: 2101,
      patientName: "Rahul Gupta",
      type: "PHARMACY",
      status: "Pending",
      paymentStatus: "Pending",
      source: "DOCTOR_ORDER",
      amount: 120,
      createdAt: new Date().toISOString(),
      items: [{ inventoryId: 3, medicineName: "Paracetamol 500mg", quantity: 4, unitPrice: 30 }],
      testName: "Paracetamol 500mg x4",
      result: { notes: "After meal, twice daily" }
    },
    {
      id: 3,
      clinicId: 10,
      patientId: 2102,
      patientName: "Sunita Devi",
      type: "PHARMACY",
      status: "Completed",
      paymentStatus: "Paid",
      source: "DOCTOR_ORDER",
      amount: 90,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      items: [{ inventoryId: 3, medicineName: "Paracetamol 500mg", quantity: 3, unitPrice: 30 }],
      testName: "Paracetamol 500mg x3",
      result: { notes: "Completed dispensing" }
    },
    {
      id: 4,
      clinicId: 10,
      patientId: 2101,
      patientName: "Rahul Gupta",
      type: "RADIOLOGY",
      status: "PENDING",
      paymentStatus: "Pending",
      testName: "Chest X-Ray",
      price: 1200,
      result: "",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      clinicId: 10,
      patientId: 2102,
      patientName: "Sunita Devi",
      type: "RADIOLOGY",
      status: "IMAGE_UPLOADED",
      paymentStatus: "Paid",
      paid: true,
      testName: "USG Abdomen",
      price: 1500,
      result: JSON.stringify({ type: "image_attachment", fileName: "usg-abdomen.png", notes: "Image captured. Awaiting radiologist report." }),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 6,
      clinicId: 10,
      patientId: 2101,
      patientName: "Rahul Gupta",
      type: "RADIOLOGY",
      status: "COMPLETED",
      paymentStatus: "Paid",
      paid: true,
      testName: "Knee X-Ray",
      price: 1300,
      result: JSON.stringify({ notes: "No acute fracture seen. Mild soft-tissue swelling." }),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
    }
  ],
  assessments: [
    {
      id: 80101,
      clinicId: 10,
      patientId: 2101,
      patientName: "Rahul Gupta",
      templateId: 1,
      data: {
        templateId: 1,
        patientId: 2101,
        diagnosis: "Viral fever with mild dehydration",
        advice: "Hydration and rest for 2 days",
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      },
      type: "Clinical Assessment",
      status: "Completed",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      visitDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 80102,
      clinicId: 10,
      patientId: 2102,
      patientName: "Sunita Devi",
      templateId: 1,
      data: {
        templateId: 1,
        patientId: 2102,
        diagnosis: "Gastric irritation",
        advice: "Light diet and prescribed antacid course",
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      },
      type: "Clinical Assessment",
      status: "Completed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  departments: [
    { id: 1, name: "General OPD", type: "CLINICAL", clinicId: 10, createdAt: new Date().toISOString() },
    { id: 2, name: "Emergency", type: "CLINICAL", clinicId: 10, createdAt: new Date().toISOString() },
    { id: 3, name: "Pharmacy", type: "SUPPORT", clinicId: 10, createdAt: new Date().toISOString() },
    { id: 4, name: "Radiology", type: "SERVICE", clinicId: 13, createdAt: new Date().toISOString() },
    { id: 5, name: "Laboratory", type: "SERVICE", clinicId: 14, createdAt: new Date().toISOString() }
  ],
  services: [
    { id: 1, name: "Complete Blood Count (CBC)", description: "Standard blood test", price: 450, type: "LAB", isActive: true, clinicId: 10 },
    { id: 2, name: "Chest X-Ray", description: "Radiology imaging", price: 1200, type: "RADIOLOGY", isActive: true, clinicId: 10 },
    { id: 3, name: "General Consultation", description: "Routine checkup", price: 500, type: "CONSULTATION", isActive: true, clinicId: 10 },
    { id: 4, name: "Vitamin D Test", description: "Biochemistry test", price: 900, type: "LAB", isActive: true, clinicId: 13 },
    { id: 5, name: "USG Abdomen", description: "Ultrasound scan", price: 1500, type: "RADIOLOGY", isActive: true, clinicId: 14 }
  ],
  bookingConfigs: {
    10: { enabled: true, selectedDoctors: [], services: ["General Consultation", "Follow-up"], timeSlots: ["09:00", "09:30", "10:00"], offDays: [0], holidays: [], doctorAvailability: {} },
    13: { enabled: true, selectedDoctors: [], services: ["CBC", "X-Ray"], timeSlots: ["10:00", "10:30", "11:00"], offDays: [0, 6], holidays: [], doctorAvailability: {} },
    14: { enabled: true, selectedDoctors: [], services: ["ECG", "Lab Collection"], timeSlots: ["08:30", "09:00", "09:30"], offDays: [0], holidays: [], doctorAvailability: {} }
  }
};
const ensureClinicSeedData = () => {
  const requiredClinics = [10, 13, 14];
  requiredClinics.forEach((cid) => {
    const clinicName = db.clinics.find((c) => Number(c.id) === cid)?.name || `Clinic ${cid}`;
    const hasDoctor = db.staff.some((s) =>
      String(s.role || "").toUpperCase() === "DOCTOR" &&
      (Number(s.clinicId) === cid || (Array.isArray(s.clinics) && s.clinics.map(Number).includes(cid)))
    );
    if (!hasDoctor) {
      db.staff.push({
        id: nextId(),
        userId: nextId(),
        name: `Dr ${clinicName.split(" ")[0]} Kumar`,
        email: `doctor${cid}@evclinic.demo`,
        role: "DOCTOR",
        roles: ["DOCTOR"],
        status: "active",
        clinicId: cid,
        clinics: [cid],
        department: "General OPD",
        specialty: "General Medicine",
        joined: new Date().toISOString().slice(0, 10)
      });
    }
    const hasReception = db.staff.some((s) =>
      String(s.role || "").toUpperCase() === "RECEPTIONIST" &&
      (Number(s.clinicId) === cid || (Array.isArray(s.clinics) && s.clinics.map(Number).includes(cid)))
    );
    if (!hasReception) {
      db.staff.push({
        id: nextId(),
        userId: nextId(),
        name: `${clinicName.split(" ")[0]} Reception`,
        email: `reception${cid}@evclinic.demo`,
        role: "RECEPTIONIST",
        roles: ["RECEPTIONIST"],
        status: "active",
        clinicId: cid,
        clinics: [cid],
        department: "Front Desk",
        joined: new Date().toISOString().slice(0, 10)
      });
    }
    const hasPatient = db.patients.some((p) => Number(p.clinicId) === cid);
    if (!hasPatient) {
      db.patients.push({
        id: nextId(),
        clinicId: cid,
        name: `Patient ${clinicName.split(" ")[0]}`,
        phone: "9999999999",
        email: `patient${cid}@demo.com`,
        status: "active",
        createdAt: new Date().toISOString()
      });
    }
  });
};

const nextId = () => Date.now() + Math.floor(Math.random() * 1000);
const currentClinicId = () => Number(JSON.parse(localStorage.getItem("ev_clinic") || "{}")?.id || 10);
const parseQuery = (url) => Object.fromEntries(new URLSearchParams(url.split("?")[1] || ""));
const toPlainObject = (payload) => {
  if (payload instanceof FormData) {
    const obj = {};
    for (const [key, value] of payload.entries()) {
      obj[key] = value;
    }
    return obj;
  }
  return payload || {};
};
const findPatientById = (patientId) => db.patients.find((p) => Number(p.id) === Number(patientId));
const getClinicScopedPatients = (clinicId) => db.patients.filter((p) => Number(p.clinicId || clinicId) === Number(clinicId));
const getClinicScopedInventory = (clinicId) => db.pharmacyInventory.filter((m) => Number(m.clinicId || clinicId) === Number(clinicId));
const normalizeLabStatus = (rawStatus) => {
  const s = String(rawStatus || "").toUpperCase().replace(/\s+/g, "_");
  if (s === "IMAGE_UPLOADED") return "Image Uploaded";
  if (s === "SAMPLE_COLLECTED") return "Sample Collected";
  if (["COMPLETED", "RESULT_UPLOADED", "PUBLISHED"].includes(s)) return "Completed";
  if (s === "REJECTED") return "Rejected";
  return "Pending";
};
const enrichLabOrder = (order, clinicId) => {
  const patient = findPatientById(order.patientId)
    || getClinicScopedPatients(clinicId).find((p) => String(p.name || "").toLowerCase() === String(order.patientName || "").toLowerCase())
    || order.patient
    || null;
  const testStatus = normalizeLabStatus(order.testStatus || order.status);
  return {
    ...order,
    clinicId: Number(order.clinicId || clinicId),
    type: String(order.type || "LAB").toUpperCase(),
    patientId: order.patientId || patient?.id || null,
    patient,
    patientName: order.patientName || patient?.name || "Unknown Patient",
    paymentStatus: order.paymentStatus || (order.paid ? "Paid" : "Pending"),
    testStatus,
    status: testStatus,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString()
  };
};
const getTemplateById = (templateId) => db.templates.find((t) => Number(t.id) === Number(templateId));
const getCurrentPatient = (clinicId = currentClinicId()) => {
  const user = getCurrentUser();
  if (!user) return null;
  const byUser = db.patients.find((p) => Number(p.userId) === Number(user.id));
  if (byUser) return byUser;
  const byEmail = db.patients.find((p) => String(p.email || "").toLowerCase() === String(user.email || "").toLowerCase());
  if (byEmail) return byEmail;
  if (String(user.role || "").toUpperCase() === "PATIENT") {
    return getClinicScopedPatients(clinicId)[0] || db.patients[0] || null;
  }
  return null;
};
const normalizeDocumentRecord = (record, clinicId) => {
  const patient = record.patientId ? findPatientById(record.patientId) : null;
  const staffMember = record.staffId
    ? db.staff.find((s) => Number(s.id) === Number(record.staffId) || Number(s.userId) === Number(record.staffId))
    : null;
  const normalizedData = record.data || {
    notes: record.notes || "",
    fileName: record.fileName || "",
    fileData: record.fileData || null
  };
  const docType = record.type || record.documentType || record.category || "General Document";
  return {
    ...record,
    clinicId: Number(record.clinicId || clinicId || patient?.clinicId || staffMember?.clinicId || 10),
    patientId: record.patientId || patient?.id || null,
    patientName: record.patientName || patient?.name || "",
    staffId: record.staffId || staffMember?.id || null,
    staffName: record.staffName || staffMember?.name || staffMember?.email || "",
    staffRole: record.staffRole || staffMember?.role || "",
    type: docType,
    documentType: docType,
    data: normalizedData,
    archived: Boolean(record.archived),
    createdAt: record.createdAt || new Date().toISOString()
  };
};
const enrichAssessment = (assessment) => {
  const patient = findPatientById(assessment.patientId);
  const template = getTemplateById(assessment.templateId);
  return {
    ...assessment,
    patientId: assessment.patientId,
    patient,
    patientName: assessment.patientName || patient?.name || "Unknown Patient",
    formtemplate: template || assessment.formtemplate || null,
    status: assessment.status || "Completed"
  };
};
const enrichReport = (report) => {
  const patient = findPatientById(report.patientId);
  const template = getTemplateById(report.templateId);
  const doctor = report.doctor || db.staff.find((s) => Number(s.userId || s.id) === Number(report.doctorId));
  return {
    ...report,
    patient,
    template,
    doctor,
    reportDate: report.reportDate || report.createdAt || new Date().toISOString()
  };
};
const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const normalizeClinicModules = (modules) => ({
  pharmacy: Boolean(modules?.pharmacy ?? true),
  radiology: Boolean(modules?.radiology ?? true),
  laboratory: Boolean(modules?.laboratory ?? modules?.lab ?? true),
  billing: Boolean(modules?.billing ?? true),
  reports: Boolean(modules?.reports ?? true)
});
const normalizeClinicPayload = (payload, existing = {}) => {
  const data = toPlainObject(payload);
  const plan = String(data.subscriptionPlan || existing.subscriptionPlan || "Monthly");
  const userLimit = toNumber(data.numberOfUsers ?? existing.userLimit, 5);
  const unitAmount = toNumber(data.subscriptionAmount ?? existing.subscriptionAmount, 0);
  const gstPercent = toNumber(data.gstPercent ?? existing.gstPercent, 18);
  const totalBase = unitAmount * Math.max(userLimit, 1);
  const totalWithTax = totalBase + (totalBase * gstPercent / 100);
  let subscriptionDays = toNumber(data.subscriptionDays ?? existing.subscriptionDays, 30);
  if (plan === "Trial") subscriptionDays = 7;
  if (plan === "Manual") subscriptionDays = toNumber(data.manualDays, subscriptionDays || 30);
  if (plan === "Monthly") subscriptionDays = toNumber(data.subscriptionDuration, 1) * 30;
  return {
    name: String(data.name || existing.name || "New Clinic"),
    location: String(data.location || existing.location || "Main Center"),
    contact: String(data.contact || existing.contact || ""),
    email: String(data.email || existing.email || ""),
    adminName: String(data.adminName || existing.adminName || "Admin"),
    adminEmail: String(data.email || data.adminEmail || existing.adminEmail || existing.email || ""),
    password: String(data.password || existing.password || "admin123"),
    subscriptionPlan: plan,
    subscriptionDuration: toNumber(data.subscriptionDuration ?? existing.subscriptionDuration, 1),
    subscriptionDays,
    gstPercent,
    userLimit,
    subscriptionAmount: unitAmount,
    totalPayable: totalWithTax,
    status: String(existing.status || "active"),
    logo: data.logo || existing.logo || "",
    modules: normalizeClinicModules(existing.modules || data.modules),
    createdDate: existing.createdDate || new Date().toISOString(),
    isExpired: false,
    daysRemaining: subscriptionDays
  };
};
const getClinicNameById = (id) => db.clinics.find((c) => Number(c.id) === Number(id))?.name || `Clinic #${id}`;
db.clinics = db.clinics.map((clinic) => ({
  ...clinic,
  modules: normalizeClinicModules(clinic.modules)
}));
ensureClinicSeedData();
const ensurePatientUserMapping = () => {
  const patientUser = db.users.find((u) => String(u.role || "").toUpperCase() === "PATIENT");
  if (!patientUser) return;
  const clinic10Patients = getClinicScopedPatients(10);
  if (clinic10Patients.length === 0) return;
  const target = clinic10Patients[0];
  target.userId = patientUser.id;
  target.email = patientUser.email || target.email;
};
ensurePatientUserMapping();
const ensurePharmacySeedData = () => {
  const cid = 10;
  const existing = getClinicScopedInventory(cid);
  if (existing.length >= 3) return;
  const seeds = [
    { name: "Azithromycin 500mg", brandName: "EV Care", batchNumber: "AZ-APR-01", sku: "SKU-AZ500", quantity: 48, unitPrice: 85, expiryDate: "2027-11-30" },
    { name: "Vitamin C Tablets", brandName: "NutraPlus", batchNumber: "VC-APR-02", sku: "SKU-VC100", quantity: 12, unitPrice: 25, expiryDate: "2027-09-15" },
    { name: "Cough Syrup 100ml", brandName: "Relief Pharma", batchNumber: "CS-APR-03", sku: "SKU-CS100", quantity: 8, unitPrice: 65, expiryDate: "2027-06-30" }
  ];
  seeds.forEach((s) => db.pharmacyInventory.push({ id: nextId(), clinicId: cid, ...s }));
};
ensurePharmacySeedData();
const normalizeInvoice = (invoice) => {
  const patient = invoice.patient || findPatientById(invoice.patientId);
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const computedSubtotal = Number(invoice.subtotal ?? items.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const computedTax = Number(invoice.totalTax ?? invoice.taxSummary?.totalTax ?? 0);
  const computedAmount = (invoice.totalAmount ?? invoice.amount ?? (computedSubtotal + computedTax));
  const totalAmount = Number(computedAmount || 0);
  const rawStatus = String(invoice.status || "Pending").toLowerCase();
  const status = rawStatus === "paid" ? "Paid" : rawStatus === "cancelled" ? "Cancelled" : "Pending";
  return {
    ...invoice,
    patient,
    clinicId: Number(invoice.clinicId || invoice.clinic?.id || patient?.clinicId || 10),
    patientName: invoice.patientName || patient?.name || invoice.patientName || "Unknown",
    subtotal: Number(invoice.subtotal ?? Math.max(0, totalAmount - computedTax)),
    totalTax: computedTax,
    gstRate: Number(invoice.gstRate ?? invoice.taxSummary?.gstRate ?? 0),
    taxSummary: invoice.taxSummary || null,
    placeOfSupply: invoice.placeOfSupply || "",
    clinicState: invoice.clinicState || "",
    totalAmount,
    status,
    createdAt: invoice.createdAt || invoice.issuedDate || new Date().toISOString()
  };
};
const cleanUrl = (url) => url
  .replace(/^https?:\/\/[^/]+\/api/, "")
  .replace(/^https?:\/\/[^/]+\/mock-api/, "")
  .replace(/^\/mock-api/, "");

export const login = async (email, password) => {
  await delay();
  const found = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!found) return fail("Invalid credentials");
  const role = String(found.role || "").toUpperCase();
  let assignedClinicIds = [];
  if (role === "SUPER_ADMIN") {
    assignedClinicIds = db.clinics.map((c) => c.id);
  } else {
    const directClinics = Array.isArray(found.clinics) ? found.clinics : [];
    const staffMatches = db.staff.filter((s) =>
      Number(s.userId) === Number(found.id) ||
      String(s.email || "").toLowerCase() === String(found.email || "").toLowerCase()
    );
    const staffClinicIds = staffMatches.flatMap((s) => {
      if (Array.isArray(s.clinics) && s.clinics.length > 0) return s.clinics;
      if (s.clinicId != null) return [s.clinicId];
      return [];
    });
    assignedClinicIds = [...new Set([...directClinics, ...staffClinicIds].map((id) => Number(id)).filter(Boolean))];
  }
  const user = { ...found, roles: [found.role], clinics: assignedClinicIds, isMockUser: true };
  localStorage.setItem("ev_user", JSON.stringify(user));
  localStorage.setItem("ev_token", MOCK_JWT_TOKEN);
  return user;
};

export const logout = () => {
  localStorage.removeItem("ev_user");
  localStorage.removeItem("ev_token");
  localStorage.removeItem("ev_clinic");
};

export const getCurrentUser = () => JSON.parse(localStorage.getItem("ev_user") || "null");

export const getUsers = async () => {
  await delay();
  return [...db.users];
};

export const addUser = async (user) => {
  await delay();
  const created = { ...user, id: nextId(), status: user.status || "active" };
  db.users.push(created);
  return created;
};

export const deleteUser = async (id) => {
  await delay();
  const idx = db.users.findIndex((u) => Number(u.id) === Number(id));
  if (idx > -1) db.users.splice(idx, 1);
  return true;
};

async function handleRequest(method, url, payload = {}, config = {}) {
  await delay(250 + Math.floor(Math.random() * 250));
  const path = cleanUrl(url);
  const query = parseQuery(path);
  const pathname = path.split("?")[0];
  const clinicId = currentClinicId();

  if (pathname === "/auth/login" && method === "POST") {
    const user = await login(payload.email, payload.password);
    return ok({ token: MOCK_JWT_TOKEN, user, otpRequired: false });
  }
  if (pathname === "/auth/verify-otp" && method === "POST") {
    const user = getCurrentUser() || db.users[0];
    return ok({ token: MOCK_JWT_TOKEN, user });
  }
  if (pathname === "/auth/clinics/my" && method === "GET") {
    const currentUser = getCurrentUser();
    const currentRole = String(currentUser?.role || currentUser?.roles?.[0] || "").toUpperCase();
    if (currentRole === "SUPER_ADMIN") {
      return ok(db.clinics.map((c) => ({ ...c, role: "ADMIN" })));
    }
    const userClinicIds = Array.isArray(currentUser?.clinics)
      ? currentUser.clinics.map((id) => Number(id)).filter(Boolean)
      : [];
    return ok(
      db.clinics
        .filter((c) => userClinicIds.includes(Number(c.id)))
        .map((c) => ({ ...c, role: "ADMIN" }))
    );
  }
  if (pathname === "/auth/select-clinic" && method === "POST") {
    const clinic = db.clinics.find((c) => Number(c.id) === Number(payload.clinicId));
    if (clinic) localStorage.setItem("ev_clinic", JSON.stringify({ ...clinic, role: payload.role || "ADMIN" }));
    return ok({ token: MOCK_JWT_TOKEN, clinic });
  }
  if (pathname === "/auth/change-password" && method === "POST") return ok(true);

  if (pathname === "/super/dashboard/stats" && method === "GET") {
    const activeClinics = db.clinics.filter((c) => c.status === "active").length;
    return ok({ totalClinics: db.clinics.length, activeClinics, totalUsers: db.staff.length + db.patients.length, ...dashboardData });
  }
  if (pathname === "/super/alerts" && method === "GET") return ok(db.alerts);
  if (pathname === "/super/clinics" && method === "GET") return ok(db.clinics);
  if (pathname === "/super/clinics" && method === "POST") {
    const clinicId = nextId();
    const clinicData = normalizeClinicPayload(payload);
    const created = { id: clinicId, ...clinicData };
    db.clinics.push(created);
    if (created.email && !db.users.find((u) => u.email.toLowerCase() === created.email.toLowerCase())) {
      const userId = nextId();
      db.users.push({
        id: userId,
        name: created.adminName || created.name,
        email: created.email,
        password: created.password || "admin123",
        role: "ADMIN",
        status: "active"
      });
      db.staff.push({
        id: nextId(),
        userId,
        name: created.adminName || created.name,
        email: created.email,
        role: "ADMIN",
        status: "active",
        clinicId: clinicId,
        clinics: [clinicId],
        joined: new Date().toISOString().slice(0, 10)
      });
    }
    return ok(created);
  }
  if (/^\/super\/clinics\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.clinics.findIndex((c) => Number(c.id) === id);
    if (i > -1) {
      const merged = normalizeClinicPayload(payload, db.clinics[i]);
      db.clinics[i] = { ...db.clinics[i], ...merged };
      db.staff = db.staff.map((s) => {
        if (String(s.role).toUpperCase() === "ADMIN" && (Number(s.clinicId) === id || (s.clinics || []).includes(id))) {
          return { ...s, email: db.clinics[i].email || s.email, name: db.clinics[i].adminName || s.name };
        }
        return s;
      });
    }
    return ok(db.clinics[i]);
  }
  if (/^\/super\/clinics\/\d+\/status$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/")[3]);
    const clinic = db.clinics.find((c) => Number(c.id) === id);
    if (clinic) clinic.status = clinic.status === "active" ? "inactive" : "active";
    return ok(clinic);
  }
  if (/^\/super\/clinics\/\d+\/modules$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/")[3]);
    const clinic = db.clinics.find((c) => Number(c.id) === id);
    if (clinic) clinic.modules = normalizeClinicModules({ ...clinic.modules, ...payload });
    return ok(clinic);
  }
  if (/^\/super\/clinics\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.clinics = db.clinics.filter((c) => Number(c.id) !== id);
    return ok(true);
  }
  if (pathname === "/super/staff" && method === "GET") return ok(db.staff.map((s) => {
    const linkedUser = db.users.find((u) =>
      Number(u.id) === Number(s.userId) ||
      String(u.email || "").toLowerCase() === String(s.email || "").toLowerCase()
    );
    return {
      ...s,
      clinics: Array.isArray(s.clinics) ? s.clinics : (s.clinicId ? [s.clinicId] : []),
      userId: s.userId || linkedUser?.id || s.id
    };
  }));
  if (/^\/super\/clinics\/\d+\/admin$/.test(pathname) && method === "POST") {
    const data = toPlainObject(payload);
    const clinicTarget = Number(pathname.split("/")[3]);
    const userId = nextId();
    const assignedClinics = Array.isArray(data.clinicIds) && data.clinicIds.length > 0 ? data.clinicIds.map(Number) : [clinicTarget];
    const user = {
      id: userId,
      name: data.name || "Clinic Admin",
      email: data.email,
      password: data.password || "admin123",
      role: (data.role || "ADMIN").toUpperCase(),
      status: "active"
    };
    db.users.push(user);
    const created = {
      id: nextId(),
      userId,
      role: data.role || "ADMIN",
      status: "active",
      clinicId: assignedClinics[0],
      clinics: assignedClinics,
      name: data.name || "Clinic Admin",
      email: data.email,
      joined: new Date().toISOString().slice(0, 10)
    };
    db.staff.push(created);
    return ok(created);
  }
  if (/^\/super\/staff\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.staff.findIndex((s) => Number(s.id) === id);
    if (i > -1) {
      const data = toPlainObject(payload);
      const clinicIds = Array.isArray(data.clinicIds) ? data.clinicIds.map(Number) : db.staff[i].clinics || [db.staff[i].clinicId].filter(Boolean);
      db.staff[i] = {
        ...db.staff[i],
        ...data,
        clinics: clinicIds,
        clinicId: clinicIds[0] || db.staff[i].clinicId
      };
      if (db.staff[i].userId) {
        const uidx = db.users.findIndex((u) => Number(u.id) === Number(db.staff[i].userId));
        if (uidx > -1) {
          db.users[uidx] = {
            ...db.users[uidx],
            name: data.name || db.users[uidx].name,
            email: data.email || db.users[uidx].email,
            role: (data.role || db.users[uidx].role || "ADMIN").toUpperCase(),
            ...(data.password ? { password: data.password } : {})
          };
        }
      }
    }
    return ok(db.staff[i]);
  }
  if (/^\/super\/staff\/\d+\/status$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/")[3]);
    const s = db.staff.find((x) => Number(x.id) === id);
    if (s) s.status = s.status === "active" ? "inactive" : "active";
    return ok(s);
  }
  if (/^\/super\/staff\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    const staff = db.staff.find((s) => Number(s.id) === id);
    if (staff?.userId) db.users = db.users.filter((u) => Number(u.id) !== Number(staff.userId));
    db.staff = db.staff.filter((s) => Number(s.id) !== id);
    return ok(true);
  }
  if (pathname === "/super/registrations" && method === "GET") return ok(db.registrations);
  if (/^\/super\/registrations\/\d+\/approve$/.test(pathname) && method === "POST") {
    const id = Number(pathname.split("/")[3]);
    const reg = db.registrations.find((r) => Number(r.id) === id);
    if (reg) {
      reg.status = "APPROVED";
      const newClinicId = nextId();
      const planName = reg.plan?.name || "Starter";
      const subscriptionAmount = planName === "Enterprise" ? 499 : planName === "Professional" ? 199 : 99;
      const newClinic = normalizeClinicPayload({
        name: `${reg.firstName} ${reg.lastName} Clinic`,
        location: reg.address || "Main Center",
        contact: "9000000000",
        email: reg.email,
        password: "admin123",
        subscriptionPlan: "Monthly",
        subscriptionDuration: 1,
        subscriptionAmount,
        gstPercent: 18,
        numberOfUsers: 5
      }, { id: newClinicId });
      db.clinics.push({ id: newClinicId, ...newClinic });
      if (!db.users.find((u) => u.email.toLowerCase() === reg.email.toLowerCase())) {
        const userId = nextId();
        db.users.push({
          id: userId,
          name: `${reg.firstName} ${reg.lastName}`,
          email: reg.email,
          password: "admin123",
          role: "ADMIN",
          status: "active"
        });
        db.staff.push({
          id: nextId(),
          userId,
          name: `${reg.firstName} ${reg.lastName}`,
          email: reg.email,
          role: "ADMIN",
          status: "active",
          clinicId: newClinicId,
          clinics: [newClinicId],
          joined: new Date().toISOString().slice(0, 10)
        });
      }
    }
    return ok(reg);
  }
  if (/^\/super\/registrations\/\d+\/reject$/.test(pathname) && method === "POST") {
    const id = Number(pathname.split("/")[3]);
    const reg = db.registrations.find((r) => Number(r.id) === id);
    if (reg) reg.status = "REJECTED";
    return ok(reg);
  }
  if (pathname === "/super/plans" && method === "GET") return ok(db.plans);
  if (pathname === "/super/plans" && method === "POST") {
    const created = { id: nextId(), ...payload };
    db.plans.push(created);
    return ok(created);
  }
  if (/^\/super\/plans\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.plans.findIndex((p) => Number(p.id) === id);
    if (i > -1) db.plans[i] = { ...db.plans[i], ...payload };
    return ok(db.plans[i]);
  }
  if (/^\/super\/plans\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.plans = db.plans.filter((p) => Number(p.id) !== id);
    return ok(true);
  }
  if (pathname === "/super/profile" && method === "GET") {
    const user = getCurrentUser() || db.users[0];
    return ok({ name: user.name, email: user.email, role: user.role || "SUPER_ADMIN" });
  }
  if (pathname === "/super/profile" && method === "PATCH") {
    const user = getCurrentUser() || db.users[0];
    const updated = { ...user, name: payload.name || user.name, email: payload.email || user.email };
    localStorage.setItem("ev_user", JSON.stringify(updated));
    return ok({ name: updated.name, email: updated.email, role: updated.role || "SUPER_ADMIN" });
  }
  if (pathname === "/super/users/reset-password" && method === "POST") {
    const userId = Number(payload.userId);
    const user = db.users.find((u) => Number(u.id) === userId);
    if (!user) return fail("User not found");
    user.password = String(payload.password || "admin123");
    return ok(true);
  }
  if (pathname === "/super/impersonate/user" && method === "POST") {
    const userId = Number(payload.userId);
    const targetUser = db.users.find((u) => Number(u.id) === userId);
    if (!targetUser) return fail("User not found for impersonation");
    const mappedStaff = db.staff.find((s) => Number(s.userId) === userId || Number(s.id) === userId);
    const clinics = (mappedStaff?.clinics || (mappedStaff?.clinicId ? [mappedStaff.clinicId] : db.clinics.slice(0, 1).map((c) => c.id)))
      .map((cid) => ({ id: Number(cid), role: String(targetUser.role || "ADMIN").toUpperCase(), name: getClinicNameById(cid) }));
    const impersonated = {
      ...targetUser,
      roles: [String(targetUser.role || "ADMIN").toUpperCase()],
      clinics
    };
    localStorage.setItem("ev_user", JSON.stringify(impersonated));
    localStorage.setItem("ev_token", MOCK_JWT_TOKEN);
    return ok({ token: MOCK_JWT_TOKEN, user: impersonated });
  }
  if (pathname === "/super/impersonate/clinic" && method === "POST") {
    const clinicId = Number(payload.clinicId);
    const clinic = db.clinics.find((c) => Number(c.id) === clinicId);
    if (!clinic) return fail("Clinic not found");
    let adminStaff = db.staff.find((s) => String(s.role).toUpperCase() === "ADMIN" && ((s.clinics || []).includes(clinicId) || Number(s.clinicId) === clinicId));
    if (!adminStaff) {
      const fallbackUserId = nextId();
      const fallbackEmail = clinic.email || `admin.${clinicId}@evclinic.demo`;
      db.users.push({
        id: fallbackUserId,
        name: clinic.adminName || `${clinic.name} Admin`,
        email: fallbackEmail,
        password: "admin123",
        role: "ADMIN",
        status: "active"
      });
      adminStaff = {
        id: nextId(),
        userId: fallbackUserId,
        name: clinic.adminName || `${clinic.name} Admin`,
        email: fallbackEmail,
        role: "ADMIN",
        status: "active",
        clinicId,
        clinics: [clinicId],
        joined: new Date().toISOString().slice(0, 10)
      };
      db.staff.push(adminStaff);
    }
    const adminUser = db.users.find((u) => Number(u.id) === Number(adminStaff.userId)) || {
      id: adminStaff.userId || adminStaff.id,
      name: adminStaff.name,
      email: adminStaff.email,
      role: "ADMIN",
      status: "active"
    };
    const impersonated = {
      ...adminUser,
      role: "ADMIN",
      roles: ["ADMIN"],
      clinics: [{ id: clinicId, role: "ADMIN", name: clinic.name }],
      clinicId
    };
    localStorage.setItem("ev_user", JSON.stringify(impersonated));
    localStorage.setItem("ev_token", MOCK_JWT_TOKEN);
    localStorage.setItem("ev_clinic", JSON.stringify({ id: clinicId, name: clinic.name, role: "ADMIN", modules: clinic.modules }));
    return ok({ token: MOCK_JWT_TOKEN, user: impersonated });
  }
  if (pathname.startsWith("/super/invoices") && method === "GET") {
    const q = config?.params || {};
    let result = [...db.invoices];
    if (q.status && q.status !== "all") result = result.filter((i) => String(i.status).toLowerCase() === String(q.status).toLowerCase());
    if (q.month) result = result.filter((i) => String(i.issuedDate || i.createdAt || "").slice(5, 7) === String(q.month));
    if (q.clinicId) result = result.filter((i) => Number(i.clinic?.id || i.clinicId) === Number(q.clinicId));
    if (q.type && q.type !== "all") {
      if (q.type === "pharmacy") result = result.filter((i) => String(i.description || "").toLowerCase().includes("pharmacy"));
      if (q.type === "service") result = result.filter((i) => !String(i.description || "").toLowerCase().includes("pharmacy"));
    }
    if (q.search) {
      const s = String(q.search).toLowerCase();
      result = result.filter((i) =>
        String(i.invoiceNumber || i.id || "").toLowerCase().includes(s) ||
        String(i.clinicName || i.clinic?.name || "").toLowerCase().includes(s)
      );
    }
    return ok(result);
  }
  if (/^\/super\/invoices\/.+\/status$/.test(pathname) && method === "PATCH") {
    const id = pathname.split("/")[3];
    const inv = db.invoices.find((i) => String(i.id) === String(id));
    if (inv) inv.status = payload.status || inv.status;
    return ok(inv);
  }
  if (pathname === "/super/reports" && method === "GET") {
    return ok({
      totalRevenue: 50500,
      totalInvoices: db.invoices.length,
      paidInvoices: db.invoices.filter(i => i.status === "Paid").length,
      unpaidInvoices: db.invoices.filter(i => i.status === "Unpaid").length
    });
  }
  if (pathname === "/super/audit-logs" && method === "GET") return ok({ logs: db.auditLogs });

  if (pathname === "/clinic/stats" && method === "GET") return ok(MOCK_STATS[clinicId] || MOCK_STATS[10]);
  if (pathname === "/clinic/details" && method === "GET") return ok(db.clinics.find((c) => Number(c.id) === clinicId) || db.clinics[0]);
  if (pathname === "/clinic/details" && method === "PATCH") {
    const i = db.clinics.findIndex((c) => Number(c.id) === clinicId);
    if (i > -1) db.clinics[i] = { ...db.clinics[i], ...payload };
    return ok(db.clinics[i]);
  }
  if (pathname === "/clinic/staff" && method === "GET") {
    const rows = db.staff.filter((s) =>
      Number(s.clinicId) === clinicId ||
      (Array.isArray(s.clinics) && s.clinics.map(Number).includes(clinicId))
    );
    return ok(rows);
  }
  if (pathname === "/clinic/staff" && method === "POST") {
    const data = toPlainObject(payload);
    const created = {
      id: nextId(),
      userId: nextId(),
      clinicId,
      clinics: Array.isArray(data.clinics) && data.clinics.length ? data.clinics.map(Number) : [clinicId],
      status: "active",
      joined: new Date().toISOString().slice(0, 10),
      ...data
    };
    if (created.role && !created.roles) created.roles = [String(created.role).toUpperCase()];
    if (created.roles && !created.role) created.role = created.roles[0];
    db.staff.push(created);
    if (created.email) {
      db.users.push({
        id: created.userId,
        name: created.name,
        email: created.email,
        password: created.password || "password123",
        role: String(created.role || "DOCTOR").toUpperCase(),
        status: "active"
      });
    }
    return ok(created);
  }
  if (/^\/clinic\/staff\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.staff.findIndex((s) => Number(s.id) === id);
    if (i > -1) db.staff[i] = { ...db.staff[i], ...payload };
    return ok(db.staff[i]);
  }
  if (/^\/clinic\/staff\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.staff = db.staff.filter((s) => Number(s.id) !== id);
    return ok(true);
  }
  if (/^\/clinic\/users\/\d+\/reset-password$/.test(pathname) && method === "PUT") {
    const userId = Number(pathname.split("/")[3]);
    const target = db.users.find((u) => Number(u.id) === userId);
    if (!target) return fail("User not found");
    target.password = String(payload.password || "password123");
    return ok(true);
  }
  if (pathname === "/clinic/activities" && method === "GET") {
    const logs = db.auditLogs.map((l, idx) => ({
      id: l.id || idx + 1,
      timestamp: l.timestamp || new Date().toISOString(),
      action: l.action || "UPDATE",
      performedBy: l.performedBy || "Clinic Admin",
      ipAddress: l.ipAddress || "127.0.0.1",
      details: { clinicId, text: l.details || "Activity logged" }
    }));
    return ok(logs);
  }
  if (pathname === "/clinic/booking-config" && method === "GET") {
    const config = db.bookingConfigs[clinicId] || { enabled: true, selectedDoctors: [], services: [], timeSlots: ["09:00", "09:30"], offDays: [0], holidays: [], doctorAvailability: {} };
    return ok(config);
  }
  if (pathname === "/clinic/booking-config" && method === "POST") {
    db.bookingConfigs[clinicId] = { ...(db.bookingConfigs[clinicId] || {}), ...(payload.config || {}) };
    return ok(db.bookingConfigs[clinicId]);
  }
  if (/^\/clinic\/booking-config\/doctor\/\d+$/.test(pathname) && method === "GET") return ok({ available: true, slots: ["09:00", "09:30", "10:00"] });
  if (pathname === "/clinic/services" && method === "GET") return ok(db.services.filter((s) => Number(s.clinicId || clinicId) === clinicId));
  if (pathname === "/clinic/services" && method === "POST") {
    const created = { id: nextId(), clinicId, isActive: true, ...payload };
    db.services.push(created);
    return ok(created);
  }
  if (/^\/clinic\/services\/\d+$/.test(pathname) && method === "PUT") {
    const id = Number(pathname.split("/").pop());
    const i = db.services.findIndex((s) => Number(s.id) === id && Number(s.clinicId || clinicId) === clinicId);
    if (i > -1)
      db.services[i] = { ...db.services[i], ...payload };
    return ok(db.services[i]);
  }
  if (/^\/clinic\/services\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.services = db.services.filter((s) => !(Number(s.id) === id && Number(s.clinicId || clinicId) === clinicId));
    return ok(true);
  }

  if (pathname === "/forms/templates" && method === "GET") return ok(db.templates);
  if (pathname === "/forms/templates" && method === "POST") {
    const created = { id: nextId(), ...payload };
    db.templates.push(created);
    return ok(created);
  }
  if (/^\/forms\/templates\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.templates.findIndex((t) => Number(t.id) === id);
    if (i > -1) db.templates[i] = { ...db.templates[i], ...payload };
    return ok(db.templates[i]);
  }
  if (/^\/forms\/templates\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.templates = db.templates.filter((t) => Number(t.id) !== id);
    return ok(true);
  }

  if (pathname === "/departments" && method === "GET") return ok(db.departments.filter((d) => Number(d.clinicId || clinicId) === clinicId));
  if (pathname === "/departments" && method === "POST") {
    const created = { id: nextId(), clinicId, createdAt: new Date().toISOString(), ...payload };
    db.departments.push(created);
    return ok(created);
  }
  if (/^\/departments\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.departments = db.departments.filter((d) => !(Number(d.id) === id && Number(d.clinicId || clinicId) === clinicId));
    return ok(true);
  }
  if (pathname === "/departments/notifications" && method === "GET") return ok(db.alerts);
  if (pathname === "/departments/unread-count" && method === "GET") return ok({ count: db.alerts.length });
  if (/^\/departments\/notifications\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const alert = db.alerts.find((a) => Number(a.id) === id);
    if (alert) alert.status = payload.status;
    return ok(alert);
  }

  if (pathname === "/reception/patients" && method === "GET") {
    const search = (config?.params?.search || "").toLowerCase();
    const clinicPatients = db.patients.filter((p) => Number(p.clinicId || clinicId) === clinicId);
    const filtered = search ? clinicPatients.filter((p) => p.name.toLowerCase().includes(search)) : clinicPatients;
    return ok(filtered);
  }
  if (pathname === "/reception/patients" && method === "POST") {
    const created = { id: nextId(), status: "active", clinicId, ...payload };
    db.patients.push(created);
    return ok(created);
  }
  if (/^\/reception\/patients\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.patients.findIndex((p) => Number(p.id) === id);
    if (i > -1) db.patients[i] = { ...db.patients[i], ...payload };
    return ok(db.patients[i]);
  }
  if (pathname === "/reception/appointments" && method === "GET") {
    const rows = db.bookings
      .filter((b) => Number(b.clinicId || clinicId) === Number(clinicId))
      .map((b) => {
        const patient = findPatientById(b.patientId) || b.patient || null;
        const doctor = db.staff.find((s) => Number(s.id) === Number(b.doctorId)) || null;
        return {
          ...b,
          patientId: b.patientId || patient?.id,
          patientName: b.patientName || patient?.name || "Unknown Patient",
          patient,
          doctor
        };
      });
    return ok(rows);
  }
  if (pathname === "/reception/appointments" && method === "POST") {
    const created = { id: nextId(), status: "pending", clinicId, createdAt: new Date().toISOString(), ...payload };
    db.bookings.push(created);
    return ok(created);
  }
  if (/^\/reception\/appointments\/\d+\/status$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/")[3]);
    const booking = db.bookings.find((b) => Number(b.id) === id);
    if (booking) booking.status = payload.status;
    return ok(booking);
  }
  if (/^\/reception\/appointments\/\d+\/check-in$/.test(pathname) && method === "POST") {
    const id = Number(pathname.split("/")[3]);
    const booking = db.bookings.find((b) => Number(b.id) === id);
    if (booking) booking.status = "Checked In";
    return ok(booking);
  }
  if (pathname === "/reception/stats" && method === "GET") {
    const clinicPatients = db.patients.filter((p) => Number(p.clinicId || clinicId) === Number(clinicId));
    const clinicBookings = db.bookings.filter((b) => Number(b.clinicId || clinicId) === Number(clinicId));
    const today = new Date().toISOString().split("T")[0];
    const todaysAppointments = clinicBookings.filter((b) => String(b.date || "").slice(0, 10) === today).length;
    const pendingApprovals = clinicBookings.filter((b) => String(b.status || "").toLowerCase() === "pending").length;
    return ok({ totalPatients: clinicPatients.length, todaysAppointments, pendingApprovals, tokenQueue: clinicBookings.length });
  }
  if (pathname === "/reception/activities" && method === "GET") {
    const clinicPatients = db.patients.filter((p) => Number(p.clinicId || clinicId) === Number(clinicId)).length;
    const clinicBookings = db.bookings.filter((b) => Number(b.clinicId || clinicId) === Number(clinicId));
    const now = new Date().toISOString();
    return ok([
      { id: nextId(), action: "Patients Synced", status: "Success", time: now, createdAt: now, details: `Loaded ${clinicPatients} patients` },
      { id: nextId(), action: "Appointments Synced", status: "Success", time: now, createdAt: now, details: `Loaded ${clinicBookings.length} appointments` },
      ...db.alerts.slice(0, 3).map((a) => ({
        id: a.id,
        action: a.type || "Alert",
        status: "Info",
        time: a.createdAt || now,
        createdAt: a.createdAt || now,
        details: a.message
      }))
    ]);
  }

  if (pathname === "/doctor/queue" && method === "GET") {
    const clinicQueue = db.bookings
      .filter((b) => Number(b.clinicId || clinicId) === Number(clinicId))
      .map((b) => {
        const patientFromId = findPatientById(b.patientId);
        const patientFromName = !patientFromId && b.patientName
          ? getClinicScopedPatients(clinicId).find((p) => String(p.name || "").toLowerCase() === String(b.patientName || "").toLowerCase())
          : null;
        const patient = patientFromId || patientFromName || b.patient || null;
        return {
          ...b,
          patientId: b.patientId || patient?.id || null,
          patientName: b.patientName || patient?.name || "Unknown Patient",
          patient
        };
      });
    const hasCheckedIn = clinicQueue.some((b) => String(b.status || "").toLowerCase() === "checked in");
    if (!hasCheckedIn && clinicQueue.length > 0) {
      clinicQueue[0] = { ...clinicQueue[0], status: "Checked In" };
    }
    return ok(clinicQueue.filter((b) => ["pending", "confirmed", "checked in", "approved"].includes(String(b.status || "").toLowerCase())));
  }
  if (pathname === "/doctor/patients" && method === "GET") {
    const clinicPatients = getClinicScopedPatients(clinicId);
    const patientWithRecords = clinicPatients.map((p) => ({
      ...p,
      medicalrecord: db.assessments
        .filter((a) => Number(a.patientId) === Number(p.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));
    return ok(patientWithRecords);
  }
  if (pathname === "/doctor/orders" && method === "GET") return ok(db.labOrders.filter((o) => Number(o.clinicId || clinicId) === Number(clinicId)));
  if (pathname === "/doctor/orders" && method === "POST") {
    const patient = findPatientById(payload.patientId);
    const normalizedType = String(payload.type || "").toUpperCase();
    const created = {
      id: nextId(),
      clinicId,
      patientId: Number(payload.patientId),
      patientName: patient?.name || payload.patientName || "Unknown Patient",
      type: normalizedType === "PRESCRIPTION" ? "PHARMACY" : normalizedType,
      status: "PENDING",
      date: payload.date || new Date().toISOString(),
      details: Array.isArray(payload.items) ? payload.items.map((i) => `${i.medicineName || i.testName} x${i.quantity || 1}`).join(", ") : payload.items || "",
      result: {
        notes: payload.notes || "",
        items: Array.isArray(payload.items) ? payload.items : []
      },
      priority: payload.priority || "routine"
    };
    db.labOrders.push(created);
    return ok(created);
  }
  if (pathname === "/doctor/prescription-inventory" && method === "GET") return ok(db.pharmacyInventory.filter((i) => Number(i.quantity || 0) > 0));
  if (pathname === "/doctor/templates" && method === "GET") return ok(db.templates.filter((t) => Number(t.clinicId || clinicId) === Number(clinicId) || !t.clinicId));
  if (pathname === "/doctor/assessments" && method === "POST") {
    const patient = findPatientById(payload.patientId);
    const assessmentData = payload.assessmentData || {};
    const created = {
      id: nextId(),
      clinicId,
      patientId: Number(payload.patientId),
      patientName: patient?.name || "Unknown Patient",
      templateId: Number(assessmentData.templateId || 0),
      data: assessmentData,
      type: "Clinical Assessment",
      status: "Completed",
      createdAt: new Date().toISOString(),
      visitDate: new Date().toISOString()
    };
    db.assessments.unshift(created);
    const snapshot = Array.isArray(assessmentData.ordersSnapshot) ? assessmentData.ordersSnapshot : [];
    snapshot.forEach((order) => {
      if (!order?.testName) return;
      db.labOrders.unshift({
        id: nextId(),
        clinicId,
        patientId: created.patientId,
        patientName: created.patientName,
        type: String(order.type || "LAB").toUpperCase(),
        status: "PENDING",
        date: new Date().toISOString(),
        details: order.details || "",
        quantity: order.quantity || 1,
        testName: order.testName,
        result: { notes: order.details || "" }
      });
    });
    return ok(enrichAssessment(created));
  }
  if (pathname === "/doctor/assessments" && method === "GET") {
    const list = db.assessments
      .filter((a) => Number(a.clinicId || clinicId) === Number(clinicId))
      .map(enrichAssessment);
    return ok(list);
  }
  if (pathname === "/doctor/revenue" && method === "GET") {
    const clinicInvoices = db.invoices
      .map(normalizeInvoice)
      .filter((inv) => Number(inv.clinic?.id || inv.clinicId || clinicId) === Number(clinicId));
    const totalPaid = clinicInvoices
      .filter((inv) => String(inv.status || "").toLowerCase() === "paid")
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalPending = clinicInvoices
      .filter((inv) => String(inv.status || "").toLowerCase() !== "paid")
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    return ok({ totalEarnings: totalPaid, totalOutstanding: totalPending, total: totalPaid + totalPending, paid: totalPaid, pending: totalPending });
  }
  if (pathname === "/doctor/activities" && method === "GET") return ok(db.alerts);
  if (pathname === "/doctor/stats" && method === "GET") {
    const clinicBookings = db.bookings.filter((b) => Number(b.clinicId || clinicId) === Number(clinicId));
    const today = new Date().toISOString().slice(0, 10);
    const clinicAssessments = db.assessments.filter((a) => Number(a.clinicId || clinicId) === Number(clinicId));
    return ok({
      totalPatients: getClinicScopedPatients(clinicId).length,
      pendingQueue: clinicBookings.filter((b) => ["pending", "confirmed", "checked in"].includes(String(b.status || "").toLowerCase())).length,
      todayPatients: clinicBookings.filter((b) => String(b.date || "").slice(0, 10) === today).length,
      totalTreated: clinicAssessments.length,
      pendingAppointments: clinicBookings.filter((b) => String(b.status || "").toLowerCase() === "checked in").length,
      completedAppointments: clinicAssessments.filter((a) => String(a.createdAt || "").slice(0, 10) === today).length
    });
  }
  if (/^\/doctor\/history\/\d+$/.test(pathname) && method === "GET") {
    const pid = Number(pathname.split("/").pop());
    return ok(db.assessments.filter((a) => Number(a.patientId) === pid).map(enrichAssessment));
  }
  if (/^\/doctor\/patients\/\d+\/profile$/.test(pathname) && method === "GET") {
    const pid = Number(pathname.split("/")[3]);
    return ok(db.patients.find((p) => Number(p.id) === pid));
  }

  if (pathname === "/billing/invoices" && method === "GET") {
    const rows = db.invoices
      .map(normalizeInvoice)
      .filter((inv) => Number(inv.clinicId || clinicId) === Number(clinicId));
    return ok(rows);
  }
  if (pathname === "/billing/dashboard-stats" && method === "GET") {
    const rows = db.invoices
      .map(normalizeInvoice)
      .filter((inv) => Number(inv.clinicId || clinicId) === Number(clinicId));
    const today = new Date().toISOString().slice(0, 10);
    const incomeToday = rows
      .filter((inv) => inv.status === "Paid" && String(inv.createdAt || "").slice(0, 10) === today)
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const unpaidTotal = rows
      .filter((inv) => inv.status !== "Paid")
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    return ok({
      incomeToday,
      unpaidTotal,
      totalRevenue: rows.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0),
      pendingInvoices: rows.filter((inv) => inv.status === "Pending").length,
      invoices: rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
    });
  }
  if (/^\/billing\/pending\/\d+$/.test(pathname) && method === "GET") {
    const patientId = Number(pathname.split("/").pop());
    const orders = db.pharmacySales
      .filter((sale) => Number(sale.clinicId || clinicId) === Number(clinicId))
      .filter((sale) => Number(sale.patientId) === patientId && String(sale.paymentStatus || "").toLowerCase() !== "paid")
      .map((sale) => ({
        id: sale.id,
        type: "pharmacy",
        description: sale.testName || "Pharmacy medicine sale",
        amount: Number(sale.amount || 0),
        serviceType: "PHARMACY",
        source: sale.source || "POS"
      }));
    return ok({ consultations: [], orders });
  }
  if (pathname === "/billing" && method === "POST") {
    const invoiceId = `INV-${nextId()}`;
    const created = normalizeInvoice({
      id: invoiceId,
      invoiceNumber: invoiceId,
      createdAt: new Date().toISOString(),
      clinicId,
      status: payload.status || "Pending",
      ...payload,
      subtotal: payload.subtotal || (payload.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
      totalTax: Number(payload.totalTax || payload.taxSummary?.totalTax || 0),
      gstRate: Number(payload.gstRate || payload.taxSummary?.gstRate || 0),
      taxSummary: payload.taxSummary || null,
      placeOfSupply: payload.placeOfSupply || "",
      clinicState: payload.clinicState || "",
      totalAmount: payload.totalAmount || payload.amount || (payload.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    });
    db.invoices.unshift(created);
    return ok(created);
  }
  if (/^\/billing\/invoices\/.+$/.test(pathname) && method === "PATCH") {
    const id = pathname.split("/").pop();
    const inv = db.invoices.find((i) => String(i.id) === String(id));
    if (inv) Object.assign(inv, payload);
    const linkedSale = db.pharmacySales.find((sale) => String(sale.invoiceId) === String(id));
    if (linkedSale && payload.status) {
      linkedSale.paymentStatus = payload.status;
      if (String(payload.status).toLowerCase() === "paid") linkedSale.paid = true;
    }
    return ok(normalizeInvoice(inv));
  }
  if (pathname === "/billing/corporate-pharmacy-summary" && method === "GET") {
    const month = config?.params?.month || new Date().toISOString().slice(0, 7);
    const monthlyCorporate = db.pharmacySales.filter((sale) =>
      Number(sale.clinicId || clinicId) === Number(clinicId) &&
      sale.corporateBilling &&
      String(sale.createdAt || "").slice(0, 7) === month
    );
    const userConsumptionMap = new Map();
    const medicineConsumptionMap = new Map();
    monthlyCorporate.forEach((sale) => {
      const companyName = sale.corporateInfo?.companyName || "Corporate Account";
      const userName = sale.corporateInfo?.userName || sale.patientName || "Unknown User";
      const employeeCode = sale.corporateInfo?.employeeCode || "";
      const key = `${companyName}::${userName}::${employeeCode}`;
      const lineItems = Array.isArray(sale.items) ? sale.items : [];
      const normalizedMedicines = lineItems.map((line) => {
        const inventoryItem = db.pharmacyInventory.find((inv) => Number(inv.id) === Number(line.inventoryId));
        return {
          name: inventoryItem?.name || line.name || "Medicine",
          quantity: Number(line.quantity || 0),
          amount: Number(line.price || inventoryItem?.unitPrice || 0) * Number(line.quantity || 0)
        };
      });
      const totalAmount = normalizedMedicines.reduce((sum, m) => sum + m.amount, 0);
      if (!userConsumptionMap.has(key)) {
        userConsumptionMap.set(key, {
          companyName,
          userName,
          employeeCode,
          medicines: [],
          totalAmount: 0
        });
      }
      const bucket = userConsumptionMap.get(key);
      bucket.totalAmount += totalAmount;
      normalizedMedicines.forEach((med) => {
        const existing = bucket.medicines.find((m) => m.name === med.name);
        if (existing) existing.quantity += med.quantity;
        else bucket.medicines.push({ name: med.name, quantity: med.quantity });
        medicineConsumptionMap.set(med.name, (medicineConsumptionMap.get(med.name) || 0) + med.quantity);
      });
    });
    const userConsumption = Array.from(userConsumptionMap.values());
    const medicineConsumption = Array.from(medicineConsumptionMap.entries()).map(([name, quantity]) => ({ name, quantity }));
    return ok({
      month,
      totalBills: monthlyCorporate.length,
      totalUsers: userConsumption.length,
      totalAmount: userConsumption.reduce((sum, u) => sum + Number(u.totalAmount || 0), 0),
      userConsumption,
      medicineConsumption
    });
  }

  if (pathname === "/patient/appointments" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const rows = db.bookings
      .filter((b) => Number(b.clinicId || clinicId) === Number(clinicId))
      .filter((b) => !patient || Number(b.patientId) === Number(patient.id) || String(b.patientEmail || "").toLowerCase() === String(patient.email || "").toLowerCase())
      .map((b) => {
        const doctor = db.staff.find((s) => Number(s.id) === Number(b.doctorId) || Number(s.userId) === Number(b.doctorId));
        const normalizedStatus = ["confirmed", "approved"].includes(String(b.status || "").toLowerCase()) ? "Confirmed"
          : ["cancelled", "rejected"].includes(String(b.status || "").toLowerCase()) ? "Cancelled"
            : "Pending";
        return {
          ...b,
          patientId: b.patientId || patient?.id || null,
          patientName: b.patientName || patient?.name || b.name || "Patient",
          clinic: db.clinics.find((c) => Number(c.id) === Number(b.clinicId || clinicId)),
          doctor,
          status: normalizedStatus,
          createdAt: b.createdAt || new Date().toISOString(),
          date: b.date || b.createdAt || new Date().toISOString(),
          time: b.time || "10:00 AM",
          service: b.service || "Medical Consultation"
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ok(rows);
  }
  if (/^\/patient\/appointments\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    const patient = getCurrentPatient(clinicId);
    db.bookings = db.bookings.filter((b) => {
      if (Number(b.id) !== id) return true;
      if (!patient) return false;
      return Number(b.patientId) !== Number(patient.id);
    });
    return ok(true);
  }
  if (pathname === "/patient/records" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const pid = Number(patient?.id || NaN);
    const assessments = db.assessments.filter((a) => Number(a.patientId) === pid).map(enrichAssessment);
    const serviceOrders = db.labOrders
      .filter((o) => Number(o.patientId) === pid)
      .filter((o) => ["LAB", "RADIOLOGY", "PHARMACY"].includes(String(o.type || "").toUpperCase()))
      .map((o) => enrichLabOrder(o, clinicId));
    const prescriptions = assessments.filter((a) => Array.isArray(a.data?.ordersSnapshot) && a.data.ordersSnapshot.some((o) => o.type === "PHARMACY"));
    const medical_reports = db.reports.filter((r) => Number(r.patientId) === pid).map(enrichReport);
    const documents = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => Number(d.patientId) === pid && !d.archived);
    return ok({ assessments, serviceOrders, prescriptions, medical_reports, documents });
  }
  if (pathname === "/patient/invoices" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const rows = db.invoices
      .map(normalizeInvoice)
      .filter((inv) => Number(inv.clinicId || clinicId) === Number(clinicId))
      .filter((inv) => !patient || Number(inv.patientId) === Number(patient.id) || String(inv.patientName || "").toLowerCase() === String(patient.name || "").toLowerCase())
      .map((inv) => ({
        ...inv,
        date: inv.date || inv.createdAt,
        service: inv.service || "Medical Services"
      }));
    return ok(rows);
  }
  if (pathname === "/patient/activity" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const invoices = db.invoices
      .map(normalizeInvoice)
      .filter((inv) => !patient || Number(inv.patientId) === Number(patient.id))
      .slice(0, 3)
      .map((inv) => ({
        id: `act-inv-${inv.id}`,
        type: "BILLING",
        title: `Invoice ${inv.status}`,
        description: `${inv.id} - ${Number(inv.totalAmount || 0).toFixed(2)}`,
        date: inv.createdAt,
        clinic: db.clinics.find((c) => Number(c.id) === Number(inv.clinicId || clinicId))?.name || getClinicNameById(clinicId)
      }));
    const docs = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => !patient || Number(d.patientId) === Number(patient.id))
      .slice(0, 3)
      .map((d) => ({
        id: `act-doc-${d.id}`,
        type: "DOCUMENT",
        title: d.type || "Document uploaded",
        description: d.documentType || "Clinical document",
        date: d.createdAt,
        clinic: getClinicNameById(d.clinicId || clinicId)
      }));
    return ok([...invoices, ...docs].sort((a, b) => new Date(b.date) - new Date(a.date)));
  }
  if (pathname === "/patient/clinics" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const clinicIds = new Set();
    if (patient?.clinicId) clinicIds.add(Number(patient.clinicId));
    db.bookings.filter((b) => Number(b.patientId) === Number(patient?.id)).forEach((b) => clinicIds.add(Number(b.clinicId || clinicId)));
    if (clinicIds.size === 0) clinicIds.add(Number(clinicId));
    return ok(db.clinics.filter((c) => clinicIds.has(Number(c.id))));
  }
  if (pathname === "/patient/public-clinics" && method === "GET") return ok(db.clinics.filter((c) => c.status === "active"));
  if (pathname === "/patient/public-book" && method === "POST") {
    const patient = getCurrentPatient(Number(payload.clinicId || clinicId));
    const created = {
      id: nextId(),
      clinicId: Number(payload.clinicId || clinicId),
      patientId: patient?.id || payload.patientId || null,
      patientName: payload.name || patient?.name || "Patient",
      patientEmail: payload.email || patient?.email || "",
      doctorId: Number(payload.doctorId || 0) || null,
      date: payload.date || new Date().toISOString().slice(0, 10),
      time: payload.time || "10:00 AM",
      service: payload.service || "Medical Consultation",
      status: "Pending",
      source: payload.source || "PATIENT_PORTAL",
      createdAt: new Date().toISOString(),
      notes: payload.notes || ""
    };
    db.bookings.push(created);
    return ok(created);
  }
  if (pathname === "/patient/book" && method === "POST") {
    const patient = getCurrentPatient(Number(payload.clinicId || clinicId));
    const created = {
      id: nextId(),
      clinicId: Number(payload.clinicId || clinicId),
      patientId: patient?.id || payload.patientId || null,
      patientName: payload.name || patient?.name || "Patient",
      patientEmail: payload.email || patient?.email || "",
      doctorId: Number(payload.doctorId || 0) || null,
      date: payload.date || new Date().toISOString().slice(0, 10),
      time: payload.time || "10:30 AM",
      service: payload.service || "Medical Consultation",
      status: "Pending",
      source: payload.source || "PATIENT_APP",
      createdAt: new Date().toISOString(),
      notes: payload.notes || ""
    };
    db.bookings.push(created);
    return ok(created);
  }
  if (/^\/patient\/doctors\/\d+$/.test(pathname) && method === "GET") {
    const cid = Number(pathname.split("/").pop());
    return ok(db.staff.filter((s) => Number(s.clinicId || s.clinics?.[0]) === cid && String(s.role).includes("DOCTOR")));
  }
  if (/^\/patient\/booking-details\/\d+$/.test(pathname) && method === "GET") {
    const cid = Number(pathname.split("/").pop());
    const doctors = db.staff
      .filter((s) => String(s.role || "").toUpperCase().includes("DOCTOR"))
      .filter((s) => Number(s.clinicId || s.clinics?.[0] || cid) === cid)
      .map((d) => ({ id: d.userId || d.id, name: d.name || "Doctor", specialty: d.specialty || "General Medicine" }));
    const configSlots = db.bookingConfigs?.[cid]?.timeSlots || ["09:00", "09:30", "10:00", "10:30", "11:00"];
    return ok({ slotDuration: 20, maxDays: 30, doctors, timeSlots: configSlots });
  }
  if (/^\/public\/clinic\/[^/]+$/.test(pathname) && method === "GET") {
    const slugOrId = pathname.split("/").pop();
    const clinic = db.clinics.find((c) => String(c.id) === slugOrId || c.name.toLowerCase().replace(/\s+/g, "") === String(slugOrId).toLowerCase());
    return ok(clinic || db.clinics[0]);
  }
  if (/^\/public\/clinic\/\d+\/doctors$/.test(pathname) && method === "GET") {
    const cid = Number(pathname.split("/")[3]);
    return ok(db.staff.filter((s) => Number(s.clinicId || s.clinics?.[0]) === cid && String(s.role).includes("DOCTOR")));
  }
  if (/^\/public\/doctor\/\d+\/availability$/.test(pathname) && method === "GET") return ok(["09:00", "09:30", "10:00", "10:30"]);
  if (pathname === "/public/book" && method === "POST") {
    const created = { id: nextId(), status: "pending", ...payload };
    db.bookings.push(created);
    return ok(created);
  }
  if (pathname === "/patient/documents" && method === "GET") {
    const patient = getCurrentPatient(clinicId);
    const rows = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => Number(d.clinicId || clinicId) === Number(clinicId))
      .filter((d) => !d.archived)
      .filter((d) => !patient || Number(d.patientId) === Number(patient.id))
      .map((d) => ({
        ...d,
        name: d.data?.fileName || d.name || "Document",
        url: d.data?.fileData || d.url || null
      }));
    return ok(rows);
  }
  if (/^\/patient\/documents\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.documents = db.documents.filter((d) => Number(d.id) !== id);
    return ok(true);
  }
  if (/^\/patient\/clinics\/\d+\/patients\/\d+\/documents$/.test(pathname) && method === "POST") {
    const cid = Number(pathname.split("/")[3]);
    const patient = getCurrentPatient(cid);
    const pathPid = Number(pathname.split("/")[5]);
    const created = normalizeDocumentRecord({
      id: nextId(),
      clinicId: cid,
      patientId: Number(payload.patientId || pathPid || patient?.id || 0),
      patientName: payload.patientName || patient?.name || "",
      type: payload.type || payload.documentType || "OTHER",
      name: payload.name || payload.fileName || "Document",
      url: payload.url || null,
      notes: payload.notes || "",
      data: {
        fileName: payload.name || payload.fileName || "Document",
        fileData: payload.url || payload.fileData || null,
        notes: payload.notes || ""
      },
      createdAt: new Date().toISOString(),
      archived: false
    }, cid);
    db.documents.push(created);
    return ok(created);
  }

  if (pathname === "/medical-reports" && method === "GET") {
    const clinicReports = db.reports
      .filter((r) => Number(r.clinicId || clinicId) === Number(clinicId))
      .map(enrichReport);
    return ok(clinicReports);
  }
  if (pathname === "/medical-reports" && method === "POST") {
    const patient = findPatientById(payload.patientId);
    const doctor = db.staff.find((s) => Number(s.userId || s.id) === Number(getCurrentUser()?.id));
    const created = {
      id: nextId(),
      createdAt: new Date().toISOString(),
      clinicId,
      reportDate: payload.reportDate || new Date().toISOString(),
      ...payload,
      patientName: payload.patientName || patient?.name,
      patient,
      doctorId: doctor?.userId || doctor?.id,
      doctor,
      template: getTemplateById(payload.templateId)
    };
    db.reports.push(created);
    return ok(enrichReport(created));
  }
  if (pathname === "/medical-reports/templates" && method === "GET") return ok(db.templates);
  if (/^\/medical-reports\/\d+$/.test(pathname) && method === "GET") {
    const id = Number(pathname.split("/").pop());
    return ok(db.reports.find((r) => Number(r.id) === id));
  }
  if (/^\/medical-reports\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.reports.findIndex((r) => Number(r.id) === id);
    if (i > -1) db.reports[i] = { ...db.reports[i], ...payload, template: getTemplateById(payload.templateId || db.reports[i].templateId) };
    return ok(enrichReport(db.reports[i]));
  }

  if (pathname === "/document-controller/records" && method === "GET") {
    const archived = String(config?.params?.archived ?? query.archived ?? "false") === "true";
    const patientIdParam = Number(config?.params?.patientId ?? query.patientId ?? NaN);
    const list = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => Number(d.clinicId || clinicId) === Number(clinicId))
      .filter((d) => Boolean(d.archived) === archived)
      .filter((d) => Number.isNaN(patientIdParam) || Number(d.patientId) === Number(patientIdParam));
    return ok(list);
  }
  if (pathname === "/document-controller/records" && method === "POST") {
    const created = normalizeDocumentRecord({
      id: nextId(),
      createdAt: new Date().toISOString(),
      archived: false,
      clinicId,
      ...payload
    }, clinicId);
    db.documents.push(created);
    return ok(created);
  }
  if (pathname === "/document-controller/staff-records" && method === "GET") {
    const list = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => Number(d.clinicId || clinicId) === Number(clinicId))
      .filter((d) => d.staffId);
    return ok(list);
  }
  if (pathname === "/document-controller/staff-records" && method === "POST") {
    const created = normalizeDocumentRecord({
      id: nextId(),
      createdAt: new Date().toISOString(),
      archived: false,
      clinicId,
      ...payload
    }, clinicId);
    db.documents.push(created);
    return ok(created);
  }
  if (pathname === "/document-controller/stats" && method === "GET") {
    const scoped = db.documents
      .map((d) => normalizeDocumentRecord(d, clinicId))
      .filter((d) => Number(d.clinicId || clinicId) === Number(clinicId));
    return ok({
      total: scoped.length,
      archived: scoped.filter((d) => d.archived).length,
      pending: scoped.filter((d) => !d.archived).length
    });
  }

  if (pathname.startsWith("/lab/orders") && method === "GET") {
    const requestedType = String(query.type || "LAB").toUpperCase();
    const requestedStatus = String(query.status || "").trim().toLowerCase();
    const rows = db.labOrders
      .filter((o) => Number(o.clinicId || clinicId) === Number(clinicId))
      .filter((o) => String(o.type || "LAB").toUpperCase() === requestedType)
      .map((o) => enrichLabOrder(o, clinicId))
      .filter((o) => {
        if (!requestedStatus) return true;
        return String(o.testStatus || "").toLowerCase() === requestedStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ok(rows);
  }
  if (pathname === "/lab/orders/complete" && method === "POST") {
    const order = db.labOrders.find((o) => Number(o.id) === Number(payload.orderId));
    if (order) {
      let parsedResult = null;
      try {
        parsedResult = typeof payload.result === "string" ? JSON.parse(payload.result) : payload.result;
      } catch (e) {
        parsedResult = null;
      }
      const isRadiologyImageStep =
        String(order.type || "").toUpperCase() === "RADIOLOGY" &&
        parsedResult?.type === "image_attachment";
      Object.assign(order, {
        status: isRadiologyImageStep ? "IMAGE_UPLOADED" : "COMPLETED",
        testStatus: isRadiologyImageStep ? "Image Uploaded" : "Completed",
        result: payload.result,
        price: payload.price ?? order.price ?? 0,
        paid: Boolean(payload.paid),
        paymentStatus: payload.paid ? "Paid" : (order.paymentStatus || "Pending"),
        updatedAt: new Date().toISOString()
      });
    }
    return ok(order ? enrichLabOrder(order, clinicId) : order);
  }
  if (pathname === "/lab/orders/reject" && method === "POST") {
    const order = db.labOrders.find((o) => Number(o.id) === Number(payload.orderId));
    if (order) {
      order.status = "REJECTED";
      order.testStatus = "Rejected";
      order.updatedAt = new Date().toISOString();
    }
    return ok(order ? enrichLabOrder(order, clinicId) : order);
  }
  if (pathname === "/lab/orders/collect-sample" && method === "POST") {
    const order = db.labOrders.find((o) => Number(o.id) === Number(payload.orderId));
    if (order) {
      order.status = "SAMPLE_COLLECTED";
      order.testStatus = "Sample Collected";
      order.updatedAt = new Date().toISOString();
    }
    return ok(order ? enrichLabOrder(order, clinicId) : order);
  }

  if (pathname === "/pharmacy/inventory" && method === "GET") return ok(getClinicScopedInventory(clinicId));
  if (pathname === "/pharmacy/inventory" && method === "POST") {
    const created = { id: nextId(), clinicId, quantity: 0, ...payload };
    db.pharmacyInventory.push(created);
    return ok(created);
  }
  if (/^\/pharmacy\/inventory\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.pharmacyInventory.findIndex((m) => Number(m.id) === id);
    if (i > -1) db.pharmacyInventory[i] = { ...db.pharmacyInventory[i], ...payload };
    return ok(db.pharmacyInventory[i]);
  }
  if (/^\/pharmacy\/inventory\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.pharmacyInventory = db.pharmacyInventory.filter((m) => Number(m.id) !== id);
    return ok(true);
  }
  if (pathname === "/pharmacy/inventory/low-stock" && method === "GET") {
    const threshold = Number(config?.params?.threshold ?? 10);
    return ok(getClinicScopedInventory(clinicId).filter((m) => Number(m.quantity ?? 0) <= threshold));
  }
  if (pathname === "/pharmacy/orders" && method === "GET") {
    const rows = db.labOrders
      .filter((o) => Number(o.clinicId || clinicId) === Number(clinicId))
      .filter((o) => String(o.type || "").toUpperCase().includes("PHARMACY"))
      .map((o) => ({
        ...o,
        patient: findPatientById(o.patientId) || o.patient || null,
        status: ["completed", "dispensed"].includes(String(o.status || "").toLowerCase()) ? "Completed" : "Pending",
        paymentStatus: o.paymentStatus || (o.paid ? "Paid" : "Pending")
      }));
    return ok(rows);
  }
  if (pathname === "/pharmacy/orders/process" && method === "POST") {
    const orderId = Number(payload.orderId);
    const idx = db.labOrders.findIndex((o) => Number(o.id) === orderId);
    if (idx > -1) {
      db.labOrders[idx] = {
        ...db.labOrders[idx],
        status: "Completed",
        paymentStatus: "Paid",
        paid: true,
        amount: Number(payload.amount || db.labOrders[idx].amount || 0),
        processedAt: new Date().toISOString(),
        result: {
          ...(db.labOrders[idx].result || {}),
          notes: db.labOrders[idx].result?.notes || "Dispensed by pharmacy",
          items: Array.isArray(payload.items) ? payload.items : db.labOrders[idx].items || []
        }
      };
      return ok(db.labOrders[idx]);
    }
    return ok({ id: nextId(), ...payload, processedAt: new Date().toISOString() });
  }
  if (pathname === "/pharmacy/pos" && method === "GET") {
    return ok(db.pharmacySales.filter((s) => Number(s.clinicId || clinicId) === Number(clinicId)));
  }
  if (pathname === "/pharmacy/pos" && method === "POST") {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const subtotal = Number(payload.subtotal || items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0));
    const totalTax = Number(payload.totalTax || payload.taxSummary?.totalTax || 0);
    const amount = Number(payload.totalAmount || (subtotal + totalTax));
    const patient = findPatientById(payload.patientId);
    const patientName = payload.saleMode === "OUTSIDE"
      ? (payload.outsidePatient?.name || "Outside Patient")
      : (patient?.name || "Unknown Patient");
    const itemNames = items.map((line) => {
      const inv = db.pharmacyInventory.find((m) => Number(m.id) === Number(line.inventoryId));
      return `${inv?.name || "Medicine"} x${line.quantity}`;
    }).join(", ");
    items.forEach((line) => {
      const inv = db.pharmacyInventory.find((m) => Number(m.id) === Number(line.inventoryId));
      if (inv) inv.quantity = Math.max(0, Number(inv.quantity || 0) - Number(line.quantity || 0));
    });
    const created = {
      id: nextId(),
      clinicId,
      createdAt: new Date().toISOString(),
      paymentStatus: "Pending",
      status: "Pending",
      saleMode: payload.saleMode || "REGISTERED",
      source: payload.source || "POS",
      corporateBilling: Boolean(payload.corporateBilling),
      corporateInfo: payload.corporateInfo || null,
      outsidePatient: payload.outsidePatient || null,
      patientId: payload.patientId || null,
      patientName,
      items,
      amount,
      subtotal,
      totalTax,
      gstRate: Number(payload.gstRate || payload.taxSummary?.gstRate || 0),
      taxSummary: payload.taxSummary || null,
      placeOfSupply: payload.placeOfSupply || "",
      testName: itemNames,
      paid: false
    };
    db.pharmacySales.unshift(created);
    const autoInvoice = normalizeInvoice({
      id: `INV-${nextId()}`,
      invoiceNumber: `INV-${nextId()}`,
      patientId: created.patientId || null,
      patientName: created.patientName,
      createdAt: created.createdAt,
      status: "Pending",
      sourceType: created.saleMode === "OUTSIDE" ? "OUTSIDE_RX" : "PHARMACY_POS",
      corporateBilling: created.corporateBilling,
      companyName: created.corporateInfo?.companyName,
      items: created.items.map((line) => {
        const inv = db.pharmacyInventory.find((m) => Number(m.id) === Number(line.inventoryId));
        return {
          description: inv?.name || "Medicine",
          serviceType: "pharmacy",
          amount: Number(line.price || 0) * Number(line.quantity || 0)
        };
      }),
      subtotal: created.subtotal,
      totalTax: created.totalTax,
      gstRate: created.gstRate,
      taxSummary: created.taxSummary,
      placeOfSupply: created.placeOfSupply,
      totalAmount: amount
    });
    db.invoices.unshift(autoInvoice);
    created.invoiceId = autoInvoice.id;
    return ok(created);
  }
  if (/^\/pharmacy\/pos\/\d+$/.test(pathname) && method === "PATCH") {
    const id = Number(pathname.split("/").pop());
    const i = db.pharmacySales.findIndex((s) => Number(s.id) === id);
    if (i > -1) db.pharmacySales[i] = { ...db.pharmacySales[i], ...payload };
    return ok(db.pharmacySales[i]);
  }
  if (/^\/pharmacy\/pos\/\d+$/.test(pathname) && method === "DELETE") {
    const id = Number(pathname.split("/").pop());
    db.pharmacySales = db.pharmacySales.filter((s) => Number(s.id) !== id);
    return ok(true);
  }
  if (pathname === "/pharmacy/notifications" && method === "GET") return ok({ count: getClinicScopedInventory(clinicId).filter((m) => Number(m.quantity || 0) < 20).length });
  if (pathname === "/pharmacy/reports" && method === "GET") {
    const day = String(config?.params?.date || new Date().toISOString().split("T")[0]);
    const rows = db.pharmacySales.filter((s) => Number(s.clinicId || clinicId) === Number(clinicId) && String(s.createdAt || "").slice(0, 10) === day);
    const shifts = {
      Morning: { count: 0, revenue: 0, medicines: [] },
      Evening: { count: 0, revenue: 0, medicines: [] },
      Night: { count: 0, revenue: 0, medicines: [] }
    };
    const medAgg = new Map();
    const byShift = (d) => {
      const h = new Date(d).getHours();
      if (h >= 6 && h < 14) return "Morning";
      if (h >= 14 && h < 22) return "Evening";
      return "Night";
    };
    rows.forEach((s) => {
      const shiftName = byShift(s.createdAt);
      shifts[shiftName].count += 1;
      shifts[shiftName].revenue += Number(s.amount || 0);
      (s.items || []).forEach((it) => {
        const inv = db.pharmacyInventory.find((m) => Number(m.id) === Number(it.inventoryId));
        const name = inv?.name || it.name || "Medicine";
        medAgg.set(name, (medAgg.get(name) || 0) + Number(it.quantity || 0));
      });
    });
    const medicines = Array.from(medAgg.entries()).map(([name, quantity]) => ({ name, quantity }));
    return ok({
      daily: {
        totalCount: rows.length,
        totalRevenue: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
        medicines
      },
      shifts: {
        Morning: { ...shifts.Morning, medicines },
        Evening: { ...shifts.Evening, medicines },
        Night: { ...shifts.Night, medicines }
      },
      staticInsights: reports
    });
  }

  if (pathname === "/dashboard/stats" && method === "GET") return ok(MOCK_STATS[clinicId] || MOCK_STATS[10]);
  if (pathname.startsWith("/menu") && method === "GET") return ok([]);
  if (pathname === "/public/plans" && method === "GET") return ok(db.plans.filter((p) => p.isActive));
  if (pathname === "/public/register" && method === "POST") {
    const created = { id: nextId(), status: payload.userType === "PATIENT" ? "APPROVED" : "PENDING", createdAt: new Date().toISOString(), ...payload };
    db.registrations.unshift(created);
    if (payload.userType === "PATIENT") {
      db.users.push({ id: nextId(), name: `${payload.firstName} ${payload.lastName}`.trim(), email: payload.email, password: payload.password, role: "PATIENT", status: "active" });
    }
    return ok(created);
  }

  return ok({});
}

export const mockHttp = {
  get: async (url, config = {}) => ({ data: await handleRequest("GET", url, {}, config) }),
  post: async (url, data = {}, config = {}) => ({ data: await handleRequest("POST", url, data, config) }),
  patch: async (url, data = {}, config = {}) => ({ data: await handleRequest("PATCH", url, data, config) }),
  put: async (url, data = {}, config = {}) => ({ data: await handleRequest("PUT", url, data, config) }),
  delete: async (url, config = {}) => ({ data: await handleRequest("DELETE", url, {}, config) })
};

export const request = handleRequest;

