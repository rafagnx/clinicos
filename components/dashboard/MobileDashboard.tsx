import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";
import TodayAppointments from "@/components/dashboard/TodayAppointments";

// WE REUSE THE DESKTOP COMPONENTS FOR CONSISTENCY
import UpcomingAppointmentsWidget from "@/components/dashboard/UpcomingAppointmentsWidget";
import FinancialReportsWidget from "@/components/dashboard/FinancialReportsWidget";
import UrgentRemindersWidget from "@/components/dashboard/UrgentRemindersWidget";
import ReturnsAlertWidget from "@/components/dashboard/ReturnsAlertWidget";

interface MobileDashboardProps {
    user: any;
    stats: {
        todayAppointments: number;
        totalPatients: number;
        pendingConfirmations: number;
        activeProfessionals: number;
    };
    appointments: any[];
    patients?: any[];
    professionals?: any[];
    isDark?: boolean;
}

export default function MobileDashboard({ user, stats, appointments, patients = [], professionals = [], isDark = false }: MobileDashboardProps) {
    console.log("📱 MOBILE DASHBOARD - CLEAN VERSION");

    // Determine Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const firstName = (user?.name || "Usuário").split(" ")[0];

    // Using the PROP isDark now, verifying duplication removed

    return (
        <div className={cn("min-h-screen pb-20 p-4 space-y-6", isDark ? "bg-slate-950" : "bg-slate-50")}>

            {/* 1. Header Simple */}
            <div className="flex justify-between items-center pt-2">
                <div>
                    <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                        {greeting}, {firstName}!
                    </h1>
                    <p className={cn("text-sm capitalize", isDark ? "text-slate-400" : "text-slate-500")}>
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                {user?.avatar_url && (
                    <img src={user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                )}
            </div>

            {/* 2. Quick Stats Grid (2x2) */}
            <div className="grid grid-cols-2 gap-3">
                <StatsCard
                    title="Hoje"
                    value={stats.todayAppointments}
                    icon={Calendar}
                    color={isDark ? "indigo" : "blue"}
                    isDark={isDark}
                    trend="" trendUp={true}
                />
                <StatsCard
                    title="Pacientes"
                    value={stats.totalPatients}
                    icon={Users}
                    color={isDark ? "purple" : "indigo"}
                    isDark={isDark}
                    trend="" trendUp={true}
                />
                <StatsCard
                    title="Aguardando"
                    value={stats.pendingConfirmations}
                    icon={Clock}
                    color={isDark ? "amber" : "orange"}
                    isDark={isDark}
                    trend="" trendUp={true}
                />
                <StatsCard
                    title="Ativos"
                    value={stats.activeProfessionals}
                    icon={CheckCircle2}
                    color={isDark ? "emerald" : "green"}
                    isDark={isDark}
                    trend="" trendUp={true}
                />
            </div>

            {/* 3. Main Widgets Stack */}
            <div className="space-y-6">

                {/* Agenda do Dia (Priority) */}
                <TodayAppointments
                    isDark={isDark}
                    appointments={appointments.filter(a => {
                        if (!a?.date) return false;
                        const aptDate = String(a.date).includes('T') ? String(a.date).split('T')[0] : a.date;
                        return aptDate === format(new Date(), "yyyy-MM-dd");
                    })}
                    patients={patients}
                    professionals={professionals}
                    onStatusChange={() => { }}
                />

                <UpcomingAppointmentsWidget
                    isDark={isDark}
                    appointments={appointments}
                    patients={patients}
                    professionals={professionals}
                />

                <FinancialReportsWidget
                    isDark={isDark}
                    appointments={appointments}
                />
            </div>

        </div>
    );
}
