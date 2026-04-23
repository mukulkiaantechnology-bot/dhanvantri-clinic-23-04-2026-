import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute from './utils/ProtectedRoute';
// Landing Page Components
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import ClinicSystemHighlight from './components/ClinicSystemHighlight';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ClinicSelection from './pages/auth/ClinicSelection';
// Layout
import DashboardLayout from './components/layout/DashboardLayout';
// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Clinics from './pages/superadmin/Clinics';
import Modules from './pages/superadmin/Modules';
import Admins from './pages/superadmin/Admins';
import AuditLogs from './pages/superadmin/AuditLogs';
import Settings from './pages/superadmin/Settings';
import Invoices from './pages/superadmin/Invoices';
import UserManagement from './pages/superadmin/UserManagement';
import Plans from './pages/superadmin/Plans';
// Clinic Admin Pages
import ClinicAdminDashboard from './pages/clinicadmin/Dashboard';
import Staff from './pages/clinicadmin/Staff';
import Forms from './pages/clinicadmin/Forms';
import BookingLink from './pages/clinicadmin/BookingLink';
import ModulesView from './pages/clinicadmin/ModulesView';
import ClinicAuditLogs from './pages/clinicadmin/ClinicAuditLogs';
import ClinicSettings from './pages/clinicadmin/ClinicSettings';
import Departments from './pages/clinicadmin/Departments';
import ClinicServices from './pages/clinicadmin/ClinicServices';
// Reception Pages
import ReceptionDashboard from './pages/reception/Dashboard';
import Calendar from './pages/reception/Calendar';
import Bookings from './pages/reception/Bookings';
import PatientManagement from './pages/reception/Patients';
import Billing from './pages/reception/Billing';
import TokenQueue from './pages/reception/TokenQueue';
// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import Assessments from './pages/doctor/Assessments';
import DoctorPatients from './pages/doctor/Patients';
import Orders from './pages/doctor/Orders';
import Revenue from './pages/doctor/Revenue';
import MedicalReport from './pages/doctor/MedicalReport';
import MedicalReportForm from './pages/doctor/MedicalReportForm';
import MedicalReportList from './pages/doctor/MedicalReportList';
// Public Pages
// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientRecords from './pages/patient/PatientRecords';
import BookAppointment from './pages/patient/BookAppointment';
import AppointmentStatus from './pages/patient/AppointmentStatus';
import PatientSettings from './pages/patient/Settings';
import PatientBilling from './pages/patient/Billing';
import HelpSupport from './pages/patient/HelpSupport';
import PatientDocumentsView from './pages/patient/Documents';
// Accounting Pages
import AccountingDashboard from './pages/accounting/AccountingDashboard';
import AccountingReports from './pages/accounting/Reports';
// Document Controller Pages
import DocumentControllerDashboard from './pages/document-controller/Dashboard';
import UploadDocuments from './pages/document-controller/UploadDocuments';
import PatientDocuments from './pages/document-controller/PatientDocuments';
import StaffDocuments from './pages/document-controller/StaffDocuments';
import DocumentReports from './pages/document-controller/DocumentReports';
import DocumentArchive from './pages/document-controller/DocumentArchive';
import RadiologyDashboard from './pages/radiologist/RadiologyDashboard';
import RadiologyRequests from './pages/radiologist/RadiologyRequests';
import RadiologyUploadImages from './pages/radiologist/RadiologyUploadImages';
import RadiologyUploadReport from './pages/radiologist/RadiologyUploadReport';
import RadiologyHistory from './pages/radiologist/RadiologyHistory';
import RadiologyReports from './pages/radiologist/RadiologyReports';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PharmacyPrescriptions from './pages/pharmacy/PharmacyPrescriptions';
import PharmacyMedicineSale from './pages/pharmacy/PharmacyMedicineSale';
import PharmacyInventory from './pages/pharmacy/PharmacyInventory';
import PharmacyStockAlert from './pages/pharmacy/PharmacyStockAlert';
import PharmacyReports from './pages/pharmacy/PharmacyReports';
import LabDashboard from './pages/laboratory/LabDashboard';
import LabRequests from './pages/laboratory/LabRequests';
import LabSampleCollection from './pages/laboratory/LabSampleCollection';
import LabEnterResults from './pages/laboratory/LabEnterResults';
import LabUploadReport from './pages/laboratory/LabUploadReport';
import LabHistory from './pages/laboratory/LabHistory';
import LabReports from './pages/laboratory/LabReports';
import './App.css';
import FromLinkBookAppointment from './pages/patient/FromLinkBookAppointment';
import ClinicPublicBooking from './pages/patient/ClinicPublicBooking';
import TokenDisplay from './pages/public/TokenDisplay';
const LandingPage = () => (<div className="app">
    <Header />
    <main>
      <Hero />
      <About />
      <Services />
      <ClinicSystemHighlight />
      <Features />
      <Pricing />
      <FinalCTA />
    </main>
    <Footer />
  </div>);
const Unauthorized = () => <div className="p-20 text-center"><h1>Unauthorized Access</h1><p>You don't have permission to view this page.</p></div>;
// Inner wrapper reads clinicId from auth after AuthProvider mounts
const CurrencyWrapper = ({ children }) => {
    const { selectedClinic } = useAuth();
    return <CurrencyProvider clinicId={selectedClinic?.id}>{children}</CurrencyProvider>;
};
function App() {
    return (<ToastProvider>
      <Router>
        <AuthProvider>
          <AppProvider>
            <CurrencyWrapper>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />}/>
                <Route path="/login" element={<Login />}/>
                <Route path="/register" element={<Register />}/>
                <Route path="/book/:subdomain" element={<ClinicPublicBooking />}/>
                <Route path="/tokens/:subdomain" element={<TokenDisplay />}/>
                <Route path="/walkin/book/:clinicId" element={<FromLinkBookAppointment />}/>
                <Route path="/unauthorized" element={<Unauthorized />}/>

                {/* Protected Auth Routes */}
                <Route path="/select-clinic" element={<ProtectedRoute>
                      <ClinicSelection />
                    </ProtectedRoute>}/>

                {/* Role-Based Protected Dashboard Routes */}
                <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<SuperAdminDashboard />}/>
                          <Route path="clinics" element={<Clinics />}/>
                          <Route path="modules" element={<Modules />}/>
                          <Route path="admins" element={<Admins />}/>
                          <Route path="invoices" element={<Invoices />}/>
                          <Route path="audit-logs" element={<AuditLogs />}/>
                          <Route path="settings" element={<Settings />}/>
                          <Route path="registrations" element={<UserManagement />}/>
                          <Route path="plans" element={<Plans />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                <Route path="/clinic-admin/*" element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_ADMIN']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<ClinicAdminDashboard />}/>
                          <Route path="staff" element={<Staff />}/>
                          <Route path="forms" element={<Forms />}/>
                          <Route path="booking-link" element={<BookingLink />}/>
                          <Route path="modules" element={<ModulesView />}/>
                          <Route path="audit-logs" element={<ClinicAuditLogs />}/>
                          <Route path="settings" element={<ClinicSettings />}/>
                          <Route path="departments" element={<Departments />}/>
                          <Route path="services" element={<ClinicServices />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                <Route path="/reception/*" element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<ReceptionDashboard />}/>
                          <Route path="calendar" element={<Calendar />}/>
                          <Route path="bookings" element={<Bookings />}/>
                          <Route path="patients" element={<PatientManagement />}/>
                          <Route path="billing" element={<Billing />}/>
                          <Route path="token-queue" element={<TokenQueue />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                <Route path="/doctor/*" element={<ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<DoctorDashboard />}/>
                          <Route path="patients" element={<DoctorPatients />}/>
                          <Route path="assessments" element={<Assessments />}/>
                          <Route path="orders" element={<Orders />}/>
                          <Route path="revenue" element={<Revenue />}/>
                          <Route path="medical-report" element={<MedicalReportList />}/>
                          <Route path="medical-report/:id" element={<MedicalReport />}/>
                          <Route path="medical-report/new" element={<MedicalReportForm />}/>
                          <Route path="medical-report/edit/:id" element={<MedicalReportForm />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                <Route path="/patient/*" element={<ProtectedRoute allowedRoles={['PATIENT']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<PatientDashboard />}/>
                          <Route path="book" element={<BookAppointment />}/>
                          <Route path="status" element={<AppointmentStatus />}/>
                          <Route path="reports" element={<PatientRecords />}/>
                          <Route path="documents" element={<PatientDocumentsView />}/>
                          <Route path="medical-report/:id" element={<MedicalReport />}/>
                          <Route path="billing" element={<PatientBilling />}/>
                          <Route path="settings" element={<PatientSettings />}/>
                          <Route path="help" element={<HelpSupport />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                {/* Department-Specific Generic Routes */}
                <Route path="/lab/*" element={<ProtectedRoute allowedRoles={['LAB', 'LABORATORY']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<LabDashboard />}/>
                          <Route path="requests" element={<LabRequests />}/>
                          <Route path="sample-collection" element={<LabSampleCollection />}/>
                          <Route path="enter-results" element={<LabEnterResults />}/>
                          <Route path="upload-report" element={<LabUploadReport />}/>
                          <Route path="history" element={<LabHistory />}/>
                          <Route path="reports" element={<LabReports />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>
                <Route path="/radiology/*" element={<ProtectedRoute allowedRoles={['RADIOLOGY', 'RADIOLOGIST']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<RadiologyDashboard />}/>
                          <Route path="requests" element={<RadiologyRequests />}/>
                          <Route path="upload-images" element={<RadiologyUploadImages />}/>
                          <Route path="upload-report" element={<RadiologyUploadReport />}/>
                          <Route path="history" element={<RadiologyHistory />}/>
                          <Route path="reports" element={<RadiologyReports />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>
                <Route path="/pharmacy/*" element={<ProtectedRoute allowedRoles={['PHARMACY']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<PharmacyDashboard />}/>
                          <Route path="prescriptions" element={<PharmacyPrescriptions />}/>
                          <Route path="medicine-sale" element={<PharmacyMedicineSale />}/>
                          <Route path="inventory" element={<PharmacyInventory />}/>
                          <Route path="stock-alert" element={<PharmacyStockAlert />}/>
                          <Route path="reports" element={<PharmacyReports />}/>

                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>
                <Route path="/documents/*" element={<ProtectedRoute allowedRoles={['DOCUMENT_CONTROLLER', 'ADMIN', 'CLINIC_ADMIN']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<DocumentControllerDashboard />}/>
                          <Route path="upload" element={<UploadDocuments />}/>
                          <Route path="patient-documents" element={<PatientDocuments />}/>
                          <Route path="staff-documents" element={<StaffDocuments />}/>
                          <Route path="reports" element={<DocumentReports />}/>
                          <Route path="archive" element={<DocumentArchive />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>
                <Route path="/accounting/*" element={<ProtectedRoute allowedRoles={['ACCOUNTING', 'ACCOUNTS', 'ACCOUNTANT', 'ADMIN']}>
                      <DashboardLayout>
                        <Routes>
                          <Route index element={<AccountingDashboard />}/>
                          <Route path="billing" element={<Billing />}/>
                          <Route path="reports" element={<AccountingReports />}/>
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>}/>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
              </Routes>
            </CurrencyWrapper>
          </AppProvider>
        </AuthProvider>
      </Router>
    </ToastProvider>);
}
export default App;
