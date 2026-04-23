# EV Clinic System - End-to-End Role-Based Workflow

## 1) Purpose
This document explains the complete project workflow in simple English, based on the current implementation and role-based dashboards.

---

## 2) Unified Login Flow (Common for All Users)

1. User opens the application and lands on the `Login` page.
2. User enters `Work Email` and `Security Password`, or selects a quick demo role button.
3. User clicks `Access Dashboard`.
4. System validates credentials.
5. OTP/verification step is processed.
6. If the user is mapped to multiple clinics, the system asks the user to select a clinic.
7. System identifies the active role for that user.
8. User is redirected to the role-specific dashboard.
9. Protected routes ensure users can only access pages allowed for their role.
10. On `Sign Out`, session data is cleared and user returns to login.

---

## 3) Role-to-Dashboard Routing Map

- Super Admin -> `/super-admin`
- Clinic Admin -> `/clinic-admin`
- Doctor -> `/doctor`
- Receptionist -> `/reception`
- Pharmacy -> `/pharmacy`
- Lab Technician -> `/lab`
- Radiology -> `/radiology`
- Accountant -> `/accounting`
- Document Controller -> `/documents`
- Patient -> `/patient`

---

## 4) Role-Wise Functional Workflow

## A) Super Admin Workflow
1. Login as Super Admin.
2. Open Command Center dashboard.
3. Monitor global platform KPIs (clinics, users, requests).
4. Manage clinics, modules, admins, registrations, invoices, and plans.
5. Review audit logs and system-level governance.

## B) Clinic Admin Workflow
1. Login as Clinic Admin.
2. Enter clinic dashboard and confirm active clinic context.
3. Manage staff, departments, booking links, modules, and services/pricing.
4. Run operations for patients, billing, and assessment settings.
5. Use settings/audit for local clinic administration.

## C) Doctor Workflow
1. Login as Doctor.
2. Open clinical dashboard with today’s schedule.
3. Access patients and perform assessments.
4. Create orders (lab/radiology/clinical actions).
5. Generate medical reports and track treatment progress.

## D) Receptionist Workflow
1. Login as Receptionist.
2. Open front-desk dashboard.
3. Handle calendar, bookings, and patient registration.
4. Manage walk-ins, token queue, and appointment scheduling.
5. Process billing-related front-office tasks.

## E) Pharmacy Workflow
1. Login as Pharmacy user.
2. Open pharmacy dashboard.
3. Process prescriptions.
4. Track inventory, low stock, and daily sales.
5. Use reports for pharmacy operations.

## F) Lab Technician Workflow
1. Login as Lab user.
2. Open laboratory dashboard.
3. Receive lab requests and perform sample collection.
4. Process test results and update status.
5. Publish reports for doctor/patient consumption.

## G) Radiology Workflow
1. Login as Radiology user.
2. Open radiology dashboard.
3. Receive imaging requests.
4. Upload scans and supporting files.
5. Generate radiology reports and mark workflow completion.

## H) Accountant Workflow
1. Login as Accounting user.
2. Open accounting dashboard.
3. Review unpaid balances, revenue, and invoice states.
4. Manage billing entries and financial reports.
5. Monitor transaction-level financial summaries.

## I) Document Controller Workflow
1. Login as Document Controller.
2. Open document dashboard.
3. Upload external/internal clinical documents.
4. Map records to patients and document types.
5. Archive and retrieve records from document history.

## J) Patient Workflow
1. Login as Patient.
2. Open patient portal dashboard.
3. Book appointments and track upcoming visits.
4. Access reports, records, and uploaded documents.
5. View billing and personal settings.

---

## 5) Shared Platform Controls

- Role-Based Access Control (RBAC): each user sees only allowed modules.
- Clinic context control: multi-clinic users operate in selected clinic scope.
- Session persistence: user/token/clinic context stored for active session continuity.
- Central logout behavior: secure session clear and login redirect.

---

## 6) Typical End-to-End Patient Journey Across Roles

1. Receptionist registers patient and books appointment.
2. Doctor performs assessment and raises orders.
3. Lab/Radiology teams complete diagnostics and upload results.
4. Doctor reviews outputs and finalizes clinical notes/prescriptions.
5. Pharmacy dispenses medicines against prescriptions.
6. Accountant/reception closes billing and payment cycle.
7. Document Controller maintains records archive.
8. Patient views reports, documents, and billing from portal.

---

## 7) Executive Summary
The system uses one unified login entry, then routes each user to a dedicated dashboard based on role and clinic context. Every role works in a controlled module set, and together they form one connected clinical-operational-financial workflow from registration to diagnosis, treatment, billing, documentation, and patient self-service.

---

## 8) Patient Role Smoke Checklist (Demo Ready)

Use this as a quick client demo checklist for `patient@evclinic.demo`.

### A) Login and Entry
- [ ] Login with Patient credentials and land on `/patient`.
- [ ] Confirm selected clinic pill is visible and patient sidebar loads without blank page.
- [ ] Verify dashboard welcome card shows patient name and clinic name.

### B) Dashboard
- [ ] Verify all dashboard cards show non-zero/meaningful counts (Appointments, Medical Records, Documents, Bills).
- [ ] Check `Recent Activity Timeline` shows valid dates (no `Invalid Date`).
- [ ] Check `Quick Billing Overview` rows render amount + status correctly.
- [ ] Check `Upcoming` section shows records or valid empty state message.

### C) Reports & Records (`/patient/reports`)
- [ ] Verify top cards populate (Consultations, Prescriptions, Official Reports, Lab Results).
- [ ] Search bar filters records correctly by keyword.
- [ ] Type filter (`All/Report/Consultation/Prescription/Lab`) works.
- [ ] `View` button opens modal with full details.
- [ ] `Print Medical Report` generates downloadable PDF.
- [ ] `Delete` removes selected allowed record and refreshes list.

### D) Documents (`/patient/documents`)
- [ ] Existing documents list loads with date, type, source, and action buttons.
- [ ] `Upload Document` modal opens and clinic dropdown is populated.
- [ ] Upload form works with category + file (PDF/Image) and adds new row after submit.
- [ ] `View/PDF` opens preview/download correctly.
- [ ] `Delete` removes document and shows success feedback.

### E) Book Appointment (`/patient/book`)
- [ ] Clinic dropdown shows active clinics.
- [ ] After clinic select, specialist dropdown gets doctors.
- [ ] After doctor + date select, time slots dropdown becomes active.
- [ ] Submit creates appointment successfully and shows confirmation state.

### F) My Appointments (`/patient/status`)
- [ ] List loads patient-specific appointments only.
- [ ] Stats cards (`Total`, `Confirmed`, `Pending`) match list statuses.
- [ ] Search and status filters work.
- [ ] `Cancel` action updates appointment state/list.

### G) Billing (`/patient/billing`)
- [ ] Billing cards show totals (`Total Unpaid`, `Total Paid`, `Invoices Issued`) with real values.
- [ ] Invoice table shows valid dates (no `Invalid Date`), clinic, amount, status.
- [ ] `Details` opens modal with itemized lines and total.
- [ ] Unpaid/Pending invoice info banner appears where applicable.

### H) Settings (`/patient/settings`)
- [ ] Password form validation works (mismatch and min length check).
- [ ] Successful password update shows success message and clears fields.

### I) End-to-End Quick Flow Validation
- [ ] Book a new appointment from patient portal.
- [ ] Verify it appears in `My Appointments`.
- [ ] Upload a patient document and verify it appears in `Documents` and/or `Reports & Records`.
- [ ] Verify billing and dashboard counters remain consistent after actions.

### J) Demo Pass Criteria
- [ ] No white screen or route crash in any patient menu.
- [ ] No `Invalid Date` visible in patient pages.
- [ ] All core patient forms submit successfully.
- [ ] All patient lists refresh with submitted dummy data.





----------------------------------------------------------------------------------------------

Clinic Management System – Simple Client Flow
🔑 1. Login & Access

System me sab users ek hi login se enter karte hain.

👉 Login ke baad:

System automatically user ka role identify karta hai
Aur usko uske dashboard par le jata hai

👉 Agar user multiple clinics handle karta hai:

Wo clinic select karega
Aur ussi clinic ka data dikhega
👑 2. Super Admin (System Owner)

👉 Ye pura system control karta hai

Wo kya kar sakta hai:
Naye clinics create karna
Modules ON/OFF karna
Admin assign karna
Pura system monitor karna

👉 Simple:
“Ye system ka owner dashboard hai jahan se sab control hota hai”

🏥 3. Clinic Admin (Clinic Manager)

👉 Har clinic ka apna admin hota hai

Wo manage karta hai:
Staff (doctor, receptionist, etc.)
Departments
Services & pricing
Booking system

👉 Simple:
“Clinic chalane ka pura control yahan hota hai”

🧑‍💼 4. Reception (Front Desk)

👉 Patient ka entry point

Flow:
Patient aata hai
Receptionist usko register karta hai
Appointment book karta hai
Token / queue manage karta hai

👉 Simple:
“Patient jab clinic me aata hai, sab kaam yahi se start hota hai”

👨‍⚕️ 5. Doctor Consultation

👉 Doctor patient ko check karta hai

Doctor kya karta hai:
Patient history dekhta hai
Diagnosis karta hai
Tests likhta hai (Lab / X-ray)
Prescription deta hai

👉 Simple:
“Doctor treatment decide karta hai”

🧪 6. Lab & Radiology (Tests)

👉 Agar doctor test likhe:

Lab:
Sample collect
Test perform
Report generate
Radiology:
Scan / X-ray
Image upload
Report ready

👉 Reports automatically:

Doctor ko mil jati hain
Patient ko bhi visible hoti hain
💊 7. Pharmacy & Billing

👉 Doctor ke prescription ke baad:

Pharmacy:
Medicine dispense karti hai
Direct sale bhi possible hai (walk-in patient)
Stock automatically update hota hai

👉 Billing:

Har transaction invoice me convert hota hai
Data accounting me reflect hota hai

👉 Simple:
“Medicine dena aur billing yahan complete hoti hai”

💰 8. Accountant (Finance)

👉 Financial control

Wo dekhta hai:
Total billing
Pending payments
Revenue reports

👉 Corporate case me:

Monthly billing summary generate hoti hai

👉 Simple:
“Paise ka pura hisaab yahan manage hota hai”

📂 9. Document Management

👉 Saare records safe rehte hain

System:
Reports upload karta hai
Documents patient se link karta hai
Archive maintain karta hai

👉 Simple:
“Koi bhi report ya document kabhi bhi easily mil sakta hai”

🧑 10. Patient Portal

👉 Patient khud login kar sakta hai

Wo kya kar sakta hai:
Appointment book / cancel
Reports dekh
Documents download
Bills check

👉 Simple:
“Patient apna pura data khud access kar sakta hai”

🔄 11. Complete Patient Journey (Most Important)

👉 Client ko ye flow sabse easy samajh aayega:

Patient clinic aata hai
Receptionist usko register karta hai
Doctor check karta hai
Doctor tests likhta hai
Lab/Radiology reports banate hain
Doctor final treatment deta hai
Pharmacy medicines deti hai
Billing complete hoti hai
Patient apna data portal me dekh sakta hai



-------------------------------------------------------

Date :- 22-04-2026

haa de de or implement kr de perfect flow ke sath 

User items/services add karega

GST rate + place of supply set karega

Frontend utility tax split karegi:

same state => CGST + SGST

different state => IGST

Invoice payload me full breakup save hoga

Reception view, patient view, and print summary same tax data consume karenge



ye image bheji iska samjha

Haan, image dekh ke clear hai — ye clinic-admin/services ka “Add New Service/Test” modal hai, billing invoice modal nahi.

Iska matlab:

Ye screen service master create karti hai (name, category, price, description, active flag).
Yahin se hum GST flow ka starting point bana sakte hain by adding:
Default GST Rate (%)
optional HSN/SAC
Jab doctor/reception is service ko bill me add karega, tab:
service ka default GST rate auto-fill hoga
user place of supply set karega
utility decide karegi:
same state -> CGST + SGST
different state -> IGST
Is screenshot ke context me kya missing hai abhi
Abhi modal me:

GST rate field nahi hai
place of supply field nahi hai (ye invoice-time pe hona chahiye)
tax-inclusive/exclusive toggle nahi hai
Correct flow (image se linked)
Service creation (is modal me): base price + default GST rate save
Billing time (reception/pharmacy/service completion): place of supply set
Tax utility: split tax and calculate subtotal/tax/grand total
Invoice payload: full breakup persist
Views: reception + patient + print/PDF same saved breakup read kare
Agar tu bole to main next step me isi modal (Add New Service/Test) me GST rate field bhi add kar deta hoon taaki source se hi tax-ready services ban sakein.

haa kr de

Theek hai, ab main clinic-admin ke Add New Service/Test modal me Default GST Rate (%) add karke usko service data ke saath persist kar deta hoon, taaki billing flows me auto-use ho sake.

Ab main isi modal me Default GST Rate (%) field add kar raha hoon aur services list me bhi show karunga, taaki service create/edit ke time se GST config persist ho jaye.

Ho gaya — image wale modal me Default GST Rate (%) add kar diya.

Kya change kiya
Updated file: src/pages/clinicadmin/ClinicServices.jsx
Add New Service / Test form me new field add:
Default GST Rate (%)
Create/Edit dono flow me gstRate persist hoga:
naya service banate time payload me jayega
edit karte time existing gstRate preload hoga
Services table me bhi naya column add:
GST % (e.g. 18%)
Default behavior
Naya service open karega to default gstRate = 18
Agar backend/mock me gstRate missing ho to table me fallback 18% show karega
Validation
Lint check clean: koi error nahi.
Agar chahe to next step me main billing screens me service select hote hi us service ka GST auto-fill bhi wire kar deta hoon, taaki manual GST entry aur kam ho jaye.



-------------------------------------------------



haa kr de or testing bhi karwa dena

Done — client ke 3 points implement kar diye aur testing bhi kar di.

GST mode location-based

Backend me GST label (IGST vs CGST+SGST) ab clinic location aur place of supply compare karke decide ho raha hai.
State/codes normalization improve kiya (e.g. RJ, Maharashtra, etc. aliases handle).
Frontend tax utility me bhi same improved normalization laga diya.
Currency INR

Default currency USD se INR kar di in CurrencyContext.
Ab default formatting ₹ / Indian locale (en-IN) me aayega.
Invoice Remarks option

Reception invoice generate modal me Remarks (optional) field add ki.
Remarks API payload me ja raha hai.
Backend remarks persist kar raha hai (invoice metadata item ke form me).
Invoice details modal me remarks show ho raha hai.
PDF print me bhi Remarks: line aa rahi hai.
Testing status
Backend build: ✅
Frontend build: ✅
Live API smoke tests: ✅
Remarks save + fetch verified.
GST mode verified:
different location -> IGST
same location -> CGST_SGST
Aap ab UI pe invoice generate karke check karo:

place of supply change karke GST mode verify,
remarks डाल ke PDF download karo — note print hona chahiye,
amounts ₹ me दिखाई देंगे by default.