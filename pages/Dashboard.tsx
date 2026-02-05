import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // DISABLED FOR STABILITY
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Clock, CheckCircle2, Settings, TrendingUp, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import TodayAppointments from "@/components/dashboard/TodayAppointments";
import BirthdaysList from "@/components/dashboard/BirthdaysList";
import UpcomingAppointmentsWidget from "@/components/dashboard/UpcomingAppointmentsWidget";
import FinancialReportsWidget from "@/components/dashboard/FinancialReportsWidget";
import UrgentRemindersWidget from "@/components/dashboard/UrgentRemindersWidget";
import ReturnsAlertWidget from "@/components/dashboard/ReturnsAlertWidget";
import ChatActivityWidget from "@/components/dashboard/ChatActivityWidget";
import WidgetSelector from "@/components/dashboard/WidgetSelector";
import StatsCard from "@/components/dashboard/StatsCard";
import ScintillatingClock from "@/components/dashboard/ScintillatingClock";

import MobileDashboard from "@/components/dashboard/MobileDashboard";

export default function Dashboard() {
  const { isDark, organization } = useOutletContext<{ isDark: boolean, organization: any }>();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [user, setUser] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Widget preferences with localStorage persistence
  const defaultWidgets = [
    { id: "upcoming_appointments", enabled: true, order: 0 },
    { id: "financial_reports", enabled: true, order: 1 },
    { id: "urgent_reminders", enabled: true, order: 2 },
    { id: "returns_alert", enabled: true, order: 3 }
  ];

  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard-widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = parsed.filter((w: any) => w.id !== 'chat_activity' && w.id !== 'today_appointments');
        return defaultWidgets.map(def => {
          const saved = migrated.find((w: any) => w.id === def.id);
          return saved || def;
        });
      }
    } catch (e) { }
    return defaultWidgets;
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => (base44.entities.Patient as any).filter({ status: "ativo" })
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => (base44.entities.Professional as any).filter({ status: "ativo" })
  });

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals : [];

  const stats = {
    todayAppointments: safeAppointments.filter(a => a?.date === today && a?.type !== 'compromisso').length,
    totalPatients: safePatients.length,
    pendingConfirmations: safeAppointments.filter(a => a?.status === "agendado" && a?.type !== 'compromisso').length,
    activeProfessionals: safeProfessionals.length
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case "upcoming_appointments": return <UpcomingAppointmentsWidget key={id} isDark={isDark} appointments={safeAppointments.filter(a => a?.type !== 'compromisso')} patients={safePatients} professionals={safeProfessionals} />;
      case "financial_reports": return <FinancialReportsWidget key={id} isDark={isDark} appointments={safeAppointments} />;
      case "urgent_reminders": return <UrgentRemindersWidget key={id} appointments={safeAppointments} patients={safePatients} promotions={[]} />;
      case "returns_alert": return <ReturnsAlertWidget key={id} />;
      default: return null;
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await base44.entities.Appointment.update(id, { status });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-today"] });
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  // Time-based greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (user?.name || user?.display_name || user?.full_name || "Usuário").split(" ")[0];

  if (isMobile) {
    return <MobileDashboard
      user={user}
      stats={stats}
      appointments={safeAppointments}
      patients={safePatients}
      professionals={safeProfessionals}
      isDark={isDark}
    />;
  }

  return (
    <div className={cn("px-4 md:px-6 lg:px-4 pb-4 md:pb-6 lg:pb-4 pt-0 max-w-7xl mx-auto space-y-4 md:space-y-6 min-h-screen relative overflow-hidden")}>

      {/* BACKGROUND KINETIC ENGINE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-mesh animate-mesh opacity-[0.15]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow delay-700 pointer-events-none" />
      </div>

      {/* Content Wrapper - Ensure z-index is higher than background */}
      <div className="relative z-10 space-y-4 md:space-y-8 mt-0">

        {/* HEADER REFINED SCALE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-[2.5rem] px-8 md:px-12 pb-8 md:pb-12 pt-6 glass-premium border-white/10 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]", isDark ? "bg-slate-950/40" : "bg-white/60")}
        >
          {/* Decorative Scintillation Engine */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-[2000ms]" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10 text-center md:text-left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                CENTRAL DE COMANDO {organization?.name ? `• ${organization.name.toUpperCase()}` : "• SISTEMA O.S."}
              </div>

              <div className="flex flex-col gap-2">
                <h1 className={cn("text-3xl md:text-5xl font-black tracking-tighter leading-[0.85] filter drop-shadow-sm", isDark ? "text-white" : "text-slate-900")}>
                  {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient-x select-none">
                    {firstName}
                  </span>!
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-2">
                  <ScintillatingClock isDark={isDark} />

                  <div className={cn("flex items-center justify-center gap-3 text-xs font-bold tracking-widest uppercase h-full", isDark ? "text-slate-400" : "text-slate-600")}>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto min-w-[400px]">
              <Button
                onClick={() => setSelectorOpen(true)}
                className={cn(
                  "flex-1 rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border shadow-lg backdrop-blur-md group",
                  isDark
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    : "bg-white/60 border-slate-200 text-slate-700 hover:bg-white"
                )}
              >
                <Settings className={cn("w-4 h-4 mr-3 relative z-10 transition-transform group-hover:rotate-90 duration-500")} />
                <span className="relative z-10">Configurar Layout</span>
              </Button>
              <Link to="/agenda" className="flex-1 w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 rounded-xl h-12 px-4 font-black text-[10px] uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-300 animate-bounce-slow" />
                    ACESSAR AGENDA
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Consultas Hoje"
            value={stats.todayAppointments}
            icon={Calendar}
            trend="+12%"
            trendUp={true}
            color={isDark ? "indigo" : "blue"}
            delay={0}
            isDark={isDark}
          />
          <StatsCard
            title="Total Pacientes"
            value={stats.totalPatients}
            icon={Users}
            trend="+5%"
            trendUp={true}
            color={isDark ? "purple" : "indigo"}
            delay={0.1}
            isDark={isDark}
          />
          <StatsCard
            title="Aguardando"
            value={stats.pendingConfirmations}
            icon={Clock}
            trend="-2%"
            trendUp={false}
            color={isDark ? "amber" : "orange"}
            delay={0.2}
            isDark={isDark}
          />
          <StatsCard
            title="Profissionais"
            value={stats.activeProfessionals}
            icon={CheckCircle2}
            trend="Ativo"
            trendUp={true}
            color={isDark ? "emerald" : "green"}
            delay={0.3}
            isDark={isDark}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* TODAY'S APPOINTMENTS */}
            <TodayAppointments
              isDark={isDark}
              appointments={safeAppointments.filter(a => {
                if (!a?.date) return false;
                // Normalize date string (avoid timezone issues for simple equality)
                const aptDate = String(a.date).includes('T') ? String(a.date).split('T')[0] : a.date;
                return aptDate === today;
              })}
              patients={safePatients}
              professionals={safeProfessionals}
              onStatusChange={handleStatusChange}
            />

            {/* WIDGETS */}
            <div className="space-y-6">
              {widgets
                .filter(w => w.enabled)
                .sort((a, b) => a.order - b.order)
                .map(widget => renderWidget(widget.id))}
            </div>
          </div>

          <div className="space-y-4">
            <BirthdaysList patients={safePatients} />

            <ChatActivityWidget
              professionals={safeProfessionals}
              currentUserId={user?.id}
            />
          </div>
        </div>

        <WidgetSelector
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          widgets={widgets}
          onToggleWidget={(id) => setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w))}
        />
      </div>
    </div>
  );
}



