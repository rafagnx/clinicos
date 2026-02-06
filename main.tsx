import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToasterOriginal } from "@/components/ui/toaster"
import './index.css'
import './src/registerSW' // PWA Registration

import Layout from './Layout'
import Login from './pages/Login'
import Auth from './pages/Auth' // Keep for register if needed
import AcceptInvitation from './pages/AcceptInvitation'
import Organization from './pages/Organization' // New Org Page
import Financial from './pages/Financial' // New Financial Page
import PlanilhaLP from './pages/PlanilhaLP'

import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Patients from './pages/Patients'

import MedicalRecords from './pages/MedicalRecords'
import ClinicSettings from './pages/ClinicSettings'
import Professionals from './pages/Professionals'
import WhatsAppSettings from './pages/WhatsAppSettings'
import Promotions from './pages/Promotions'
import Reports from './pages/Reports'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import AgendaReports from './pages/AgendaReports'
import ViewMedicalRecord from './pages/ViewMedicalRecord'
import NewMedicalRecord from './pages/NewMedicalRecord'
import PatientHistory from './pages/PatientHistory'
import ImportPatients from './pages/ImportPatients'
import ProcedureTypes from './pages/settings/ProcedureTypes'
import RetentionConfig from './pages/settings/RetentionConfig'
import Marketing from './pages/Marketing'
import TreatmentPlans from './pages/TreatmentPlans'
import TreatmentPlanDetails from './pages/TreatmentPlanDetails'
import Retention from './pages/Retention'

import AdminDashboard from './pages/AdminDashboard'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AdminLayout from './pages/admin/AdminLayout'
import AdminFinancial from './pages/admin/AdminFinancial'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReports from './pages/admin/AdminReports'

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
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
                <Route path="/" element={<PlanilhaLP />} />

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
                    {/* <Route path="/Debug" element={<Dashboard />} /> */}
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
            </Routes >
            <Toaster />
            <ToasterOriginal />
        </Router >
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)
