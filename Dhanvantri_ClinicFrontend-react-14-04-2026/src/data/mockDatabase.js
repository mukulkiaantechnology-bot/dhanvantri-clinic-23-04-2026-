/**
 * FRONTEND MOCK DATABASE
 * Pure frontend demo data — no backend required.
 * Used for Corporate Admin multi-clinic demo.
 * When backend is ready, remove mock login bypass in AuthContext.
 */
// ─── MOCK CLINICS ────────────────────────────────────────────────────────────
export const MOCK_CLINICS = [
    {
        id: 10,
        name: 'Husri Clinic',
        location: 'Main Center',
        status: 'active',
        plan: 'Yearly',
        email: 'info@husri.online',
        phone: '+91-11-12345678',
        logo: null,
        totalPatients: 142,
        totalDoctors: 3,
        modules: { pharmacy: true, lab: true, radiology: false, billing: true }
    },
    {
        id: 13,
        name: 'proclinic',
        location: 'Branch 1',
        status: 'active',
        plan: 'Trial',
        email: 'proclinic@gmail.com',
        phone: '+91-22-87654321',
        logo: null,
        totalPatients: 218,
        totalDoctors: 3,
        modules: { pharmacy: true, lab: true, radiology: true, billing: true }
    },
    {
        id: 14,
        name: "test 's Clinic",
        location: 'Branch 2',
        status: 'active',
        plan: 'Monthly',
        email: 'test@gmail.com',
        phone: '+91-80-11223344',
        logo: null,
        totalPatients: 87,
        totalDoctors: 3,
        modules: { pharmacy: false, lab: true, radiology: false, billing: true }
    }
];
// ─── MOCK DOCTORS (3 per clinic) ─────────────────────────────────────────────
export const MOCK_DOCTORS = [
    // Husri Clinic (id: 10)
    {
        id: 1101, name: 'Dr. Ramesh Kumar', email: 'ramesh@evclinic.demo',
        role: 'DOCTOR', clinicId: 10, clinics: [10],
        specialization: 'Cardiology', status: 'active',
        phone: '+91-98110-01101', joined: '2024-01-15'
    },
    {
        id: 1102, name: 'Dr. Priya Sharma', email: 'priya@evclinic.demo',
        role: 'DOCTOR', clinicId: 10, clinics: [10],
        specialization: 'Neurology', status: 'active',
        phone: '+91-98110-01102', joined: '2024-02-20'
    },
    {
        id: 1103, name: 'Dr. Suresh Patel', email: 'suresh@evclinic.demo',
        role: 'DOCTOR', clinicId: 10, clinics: [10],
        specialization: 'Orthopedics', status: 'active',
        phone: '+91-98110-01103', joined: '2024-03-10'
    },
    // proclinic (id: 13)
    {
        id: 1201, name: 'Dr. Anita Singh', email: 'anita@evclinic.demo',
        role: 'DOCTOR', clinicId: 13, clinics: [13],
        specialization: 'Pediatrics', status: 'active',
        phone: '+91-98220-01201', joined: '2024-01-10'
    },
    {
        id: 1202, name: 'Dr. Vivek Mehra', email: 'vivek@evclinic.demo',
        role: 'DOCTOR', clinicId: 13, clinics: [13],
        specialization: 'Psychiatry', status: 'active',
        phone: '+91-98220-01202', joined: '2024-04-05'
    },
    {
        id: 1203, name: 'Dr. Kavita Joshi', email: 'kavita@evclinic.demo',
        role: 'DOCTOR', clinicId: 13, clinics: [13],
        specialization: 'Dermatology', status: 'active',
        phone: '+91-98220-01203', joined: '2024-02-28'
    },
    // test 's Clinic (id: 14)
    {
        id: 1301, name: 'Dr. Mohan Verma', email: 'mohan@evclinic.demo',
        role: 'DOCTOR', clinicId: 14, clinics: [14],
        specialization: 'General Medicine', status: 'active',
        phone: '+91-98330-01301', joined: '2024-03-01'
    },
    {
        id: 1302, name: 'Dr. Lakshmi Nair', email: 'lakshmi@evclinic.demo',
        role: 'DOCTOR', clinicId: 14, clinics: [14],
        specialization: 'Gynecology', status: 'active',
        phone: '+91-98330-01302', joined: '2024-05-15'
    },
    {
        id: 1303, name: 'Dr. Arjun Reddy', email: 'arjun@evclinic.demo',
        role: 'DOCTOR', clinicId: 14, clinics: [14],
        specialization: 'ENT', status: 'active',
        phone: '+91-98330-01303', joined: '2024-04-20'
    }
];
// ─── MOCK PATIENTS PER CLINIC ─────────────────────────────────────────────────
export const MOCK_PATIENTS = {
    10: [
        { id: 2101, name: 'Rahul Gupta', age: 35, gender: 'Male', phone: '+91-98001-01001', status: 'active', clinicId: 10 },
        { id: 2102, name: 'Sunita Devi', age: 42, gender: 'Female', phone: '+91-98001-01002', status: 'active', clinicId: 10 },
        { id: 2103, name: 'Amit Verma', age: 28, gender: 'Male', phone: '+91-98001-01003', status: 'active', clinicId: 10 },
    ],
    13: [
        { id: 2201, name: 'Meena Kapoor', age: 31, gender: 'Female', phone: '+91-98001-02001', status: 'active', clinicId: 13 },
        { id: 2202, name: 'Rajesh Shah', age: 55, gender: 'Male', phone: '+91-98001-02002', status: 'active', clinicId: 13 },
        { id: 2203, name: 'Pooja Mehta', age: 24, gender: 'Female', phone: '+91-98001-02003', status: 'active', clinicId: 13 },
    ],
    14: [
        { id: 2301, name: 'Suresh Babu', age: 47, gender: 'Male', phone: '+91-98001-03001', status: 'active', clinicId: 14 },
        { id: 2302, name: 'Usha Rani', age: 38, gender: 'Female', phone: '+91-98001-03002', status: 'active', clinicId: 14 },
    ]
};
// ─── MOCK BOOKINGS/APPOINTMENTS PER CLINIC ────────────────────────────────────
export const MOCK_BOOKINGS = {
    10: [
        { id: 3101, patientName: 'Rahul Gupta', doctorName: 'Dr. Ramesh Kumar', date: '2026-04-10', time: '10:00 AM', type: 'Consultation', status: 'confirmed', clinicId: 10 },
        { id: 3102, patientName: 'Sunita Devi', doctorName: 'Dr. Priya Sharma', date: '2026-04-10', time: '11:30 AM', type: 'Follow-up', status: 'pending', clinicId: 10 },
    ],
    13: [
        { id: 3201, patientName: 'Meena Kapoor', doctorName: 'Dr. Anita Singh', date: '2026-04-10', time: '09:00 AM', type: 'Consultation', status: 'confirmed', clinicId: 13 },
        { id: 3202, patientName: 'Rajesh Shah', doctorName: 'Dr. Vivek Mehra', date: '2026-04-10', time: '02:00 PM', type: 'New', status: 'pending', clinicId: 13 },
    ],
    14: [
        { id: 3301, patientName: 'Suresh Babu', doctorName: 'Dr. Mohan Verma', date: '2026-04-10', time: '11:00 AM', type: 'Follow-up', status: 'confirmed', clinicId: 14 },
    ]
};
// ─── MOCK DASHBOARD STATS PER CLINIC ─────────────────────────────────────────
export const MOCK_STATS = {
    10: { totalBookings: 142, todayAppointments: 8, todayRevenue: 24500, pendingBills: 6, staffCount: 12 },
    13: { totalBookings: 218, todayAppointments: 14, todayRevenue: 41200, pendingBills: 9, staffCount: 18 },
    14: { totalBookings: 87, todayAppointments: 5, todayRevenue: 12800, pendingBills: 3, staffCount: 8 },
};
// ─── MOCK CORPORATE ADMIN ────────────────────────────────────────────────────
export const MOCK_CORPORATE_ADMIN = {
    id: 9001,
    name: 'Corporate Admin',
    email: 'corporate@evclinic.demo',
    password: 'corporate123',
    role: 'ADMIN',
    roles: ['ADMIN'],
    clinics: [10, 13, 14], // Assigned to ALL 3 mock clinics
    isMockUser: true
};
// ─── MOCK ADMINS (for Super Admin dashboard) ────────────────────────────────
export const MOCK_ADMINS = [
    { id: 10001, name: "proclinic", email: "proclinic@gmail.com", role: "ADMIN", clinics: [13], status: "active", joined: "2024-03-20" },
    { id: 10002, name: "Demo Admin", email: "admin@evclinic.demo", role: "ADMIN", clinics: [10], status: "active", joined: "2024-01-15" },
    { id: 10003, name: "test 's Clinic", email: "test@gmail.com", role: "ADMIN", clinics: [14], status: "active", joined: "2024-04-10" }
];
// ─── MOCK TOKEN (frontend-only, never sent to real backend) ──────────────────
export const MOCK_JWT_TOKEN = 'mock_frontend_token_corporate_admin_do_not_use_in_backend';
// ─── HELPER: Is this a mock clinic? ─────────────────────────────────────────
export const isMockClinic = (id) => [10, 13, 14].includes(id);
// ─── HELPER: Get clinic-filtered mock data ────────────────────────────────────
export const getMockDataForClinic = (clinicId) => ({
    clinic: MOCK_CLINICS.find(c => c.id === clinicId),
    doctors: MOCK_DOCTORS.filter(d => d.clinicId === clinicId),
    patients: MOCK_PATIENTS[clinicId] || [],
    bookings: MOCK_BOOKINGS[clinicId] || [],
    stats: MOCK_STATS[clinicId] || {}
});
