import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToasterOriginal } from "@/components/ui/toaster"
import './index.css'

import Layout from './Layout'
// import Login from './pages/Login' // Deprecated
import Auth from './pages/Auth' // New Auth Page
import Organization from './pages/Organization' // New Org Page

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

const queryClient = new QueryClient()

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />

                {/* Authenticated Routes wrapped in Layout */}
                <Route path="*" element={
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/Dashboard" replace />} />

                            {/* Organization Setup */}
                            <Route path="/organization/new" element={<Organization />} />

                            <Route path="/Dashboard" element={<Dashboard />} />
                            <Route path="/Agenda" element={<Agenda />} />
                            <Route path="/Patients" element={<Patients />} />
                            <Route path="/Leads" element={<Leads />} />
                            <Route path="/MedicalRecords" element={<MedicalRecords />} />
                            <Route path="/ClinicSettings" element={<ClinicSettings />} />
                            <Route path="/Professionals" element={<Professionals />} />
                            <Route path="/WhatsAppSettings" element={<WhatsAppSettings />} />
                            <Route path="/Promotions" element={<Promotions />} />
                            <Route path="/Reports" element={<Reports />} />
                            <Route path="/Chat" element={<Chat />} />
                            <Route path="/Profile" element={<Profile />} />

                            {/* Subroutes */}
                            <Route path="/AgendaReports" element={<AgendaReports />} />
                            <Route path="/ViewMedicalRecord" element={<ViewMedicalRecord />} />
                            <Route path="/NewMedicalRecord" element={<NewMedicalRecord />} />
                            <Route path="/PatientHistory" element={<PatientHistory />} />
                            <Route path="/ImportPatients" element={<ImportPatients />} />
                        </Routes>
                    </Layout>
                } />
            </Routes>
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
