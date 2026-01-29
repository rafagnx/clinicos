import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToasterOriginal } from "@/components/ui/toaster"
import './index.css'

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
import Leads from './pages/Leads'
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
import Marketing from './pages/Marketing'

import AdminDashboard from './pages/AdminDashboard'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AdminLayout from './pages/admin/AdminLayout'
import AdminFinancial from './pages/admin/AdminFinancial'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReports from './pages/admin/AdminReports'

const queryClient = new QueryClient()

// --- SELF HEALING: Remove huge images from Supabase tokens ---
try {
    for (const key in localStorage) {
        if (key.includes('-auth-token')) {
            const raw = localStorage.getItem(key);
            if (raw && raw.length > 950000) { // Check if huge (near 1MB limit)
                try {
                    const data = JSON.parse(raw);
                    // Check for base64 image in metadata
                    if (data?.user?.user_metadata?.image?.startsWith('data:image')) {
                        console.warn('🧹 Detected huge image in auth token. Cleaning up to prevent 431/Net errors...');
                        delete data.user.user_metadata.image;
                        localStorage.setItem(key, JSON.stringify(data));
                        // Force reload if we cleaned it, to ensure clean state? 
                        // No, let's just clean it. Next request will be fine.
                    }
                } catch (e) { /* ignore */ }
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
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/Financial" element={<Financial />} />
                    <Route path="/Agenda" element={<Agenda />} />
                    <Route path="/Patients" element={<Patients />} />
                    <Route path="/Leads" element={<Leads />} />
                    <Route path="/MedicalRecords" element={<MedicalRecords />} />
                    <Route path="/ClinicSettings" element={<ClinicSettings />} />
                    <Route path="/Settings/Procedures" element={<ProcedureTypes />} />
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
