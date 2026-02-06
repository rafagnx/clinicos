import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToasterOriginal } from "@/components/ui/toaster"
import './index.css'
import './src/registerSW' // PWA Registration

// --- ALL PAGES ARE LAZY LOADED for fastest initial paint ---
const Login = React.lazy(() => import('./pages/Login'))
const PlanilhaLP = React.lazy(() => import('./pages/PlanilhaLP'))
const Layout = React.lazy(() => import('./Layout'))
const Auth = React.lazy(() => import('./pages/Auth'))
const AcceptInvitation = React.lazy(() => import('./pages/AcceptInvitation'))
const Organization = React.lazy(() => import('./pages/Organization'))
const Financial = React.lazy(() => import('./pages/Financial'))

const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Agenda = React.lazy(() => import('./pages/Agenda'))
const Patients = React.lazy(() => import('./pages/Patients'))

const MedicalRecords = React.lazy(() => import('./pages/MedicalRecords'))
const ClinicSettings = React.lazy(() => import('./pages/ClinicSettings'))
const Professionals = React.lazy(() => import('./pages/Professionals'))
const WhatsAppSettings = React.lazy(() => import('./pages/WhatsAppSettings'))
const Promotions = React.lazy(() => import('./pages/Promotions'))
const Reports = React.lazy(() => import('./pages/Reports'))
const Chat = React.lazy(() => import('./pages/Chat'))
const Profile = React.lazy(() => import('./pages/Profile'))
const AgendaReports = React.lazy(() => import('./pages/AgendaReports'))
const ViewMedicalRecord = React.lazy(() => import('./pages/ViewMedicalRecord'))
const NewMedicalRecord = React.lazy(() => import('./pages/NewMedicalRecord'))
const PatientHistory = React.lazy(() => import('./pages/PatientHistory'))
const ImportPatients = React.lazy(() => import('./pages/ImportPatients'))
const ProcedureTypes = React.lazy(() => import('./pages/settings/ProcedureTypes'))
const RetentionConfig = React.lazy(() => import('./pages/settings/RetentionConfig'))
const Marketing = React.lazy(() => import('./pages/Marketing'))
const TreatmentPlans = React.lazy(() => import('./pages/TreatmentPlans'))
const TreatmentPlanDetails = React.lazy(() => import('./pages/TreatmentPlanDetails'))
const Retention = React.lazy(() => import('./pages/Retention'))

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const AdminOrganizations = React.lazy(() => import('./pages/admin/AdminOrganizations'))
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'))
const AdminFinancial = React.lazy(() => import('./pages/admin/AdminFinancial'))
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'))
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'))
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'))

// ULTRA-MINIMAL Loading Fallback - Pure CSS, no JS overhead
const PageLoader = () => (
    <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #020617, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Carregando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
)

const queryClient = new QueryClient()

// --- SELF HEALING: Reset Astronomical Tokens ---
// Goal: Prevent 431 Request Header Fields Too Large (Render/Vercel)
try {
    for (const key in localStorage) {
        if (key.includes('-auth-token') || key === 'clinicos-token') {
            const raw = localStorage.getItem(key);
            // Tokens over 12KB are rejected by most proxies. Standard is ~2-4KB.
            if (raw && raw.length > 12000) {
                console.warn('🛡️ Removing astronomical token (' + raw.length + ' bytes) to prevent server rejection.');
                localStorage.removeItem(key);
                window.location.reload(); // Force clean start
            }
        }
    }
} catch (e) { console.error("Auto-cleanup failed", e); }
// -------------------------------------------------------------

const App = () => {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Route - Direct imports, no Suspense needed */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PlanilhaLP />} />

                    {/* Lazy loaded routes */}
                    <Route path="/register" element={<Auth />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

                    {/* Organization Setup */}
                    <Route path="/organization/new" element={<Organization />} />

                    {/* Admin - Dedicated System */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="organizations" element={<AdminOrganizations />} />
                        <Route path="financial" element={<AdminFinancial />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="reports" element={<AdminReports />} />
                    </Route>

                    {/* Authenticated Routes */}
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/Financial" element={<Financial />} />
                        <Route path="/Agenda" element={<Agenda />} />
                        <Route path="/Patients" element={<Patients />} />

                        <Route path="/MedicalRecords" element={<MedicalRecords />} />
                        <Route path="/ClinicSettings" element={<ClinicSettings />} />
                        <Route path="/Settings/Procedures" element={<RetentionConfig />} />
                        <Route path="/Settings/Retention" element={<RetentionConfig />} />
                        <Route path="/Settings/ProcedureTypes" element={<ProcedureTypes />} />
                        <Route path="/Professionals" element={<Professionals />} />
                        <Route path="/WhatsAppSettings" element={<WhatsAppSettings />} />
                        <Route path="/Promotions" element={<Promotions />} />
                        <Route path="/Reports" element={<Reports />} />
                        <Route path="/Chat" element={<Chat />} />
                        <Route path="/Profile" element={<Profile />} />
                        <Route path="/Marketing" element={<Marketing />} />

                        {/* Subroutes */}
                        <Route path="/AgendaReports" element={<AgendaReports />} />
                        <Route path="/ViewMedicalRecord" element={<ViewMedicalRecord />} />
                        <Route path="/NewMedicalRecord" element={<NewMedicalRecord />} />
                        <Route path="/PatientHistory" element={<PatientHistory />} />
                        <Route path="/ImportPatients" element={<ImportPatients />} />
                        <Route path="/TreatmentPlans" element={<TreatmentPlans />} />
                        <Route path="/TreatmentPlanDetails" element={<TreatmentPlanDetails />} />
                        <Route path="/Retention" element={<Retention />} />
                    </Route>
                </Routes>
            </Suspense>
            <Toaster />
            <ToasterOriginal />
        </Router>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)
