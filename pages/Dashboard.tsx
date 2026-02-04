import React, { useState, useEffect } from "react";
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

import MobileDashboard from "@/components/dashboard/MobileDashboard";

export default function Dashboard() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark || false;
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
    return <MobileDashboard user={user} stats={stats} appointments={safeAppointments} />;
  }

  return (
    <div className={cn("p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 min-h-screen relative overflow-hidden")}>

      {/* Ambient Background Glow */}
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse-slow delay-700 pointer-events-none" />

      {/* HEADER */}
      <div className={cn("rounded-3xl p-6 md:p-8 border shadow-lg relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        {/* Decorative Background Elements */}
        {!isDark && (
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full opacity-50 pointer-events-none" />
        )}

        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
          <div>
            <h1 className={cn("text-3xl md:text-4xl font-bold mb-2 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{firstName}</span>!
            </h1>
            <p className={cn("text-base flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
              <Calendar className="w-4 h-4 text-indigo-500" />
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={() => setSelectorOpen(true)} variant="outline" className={cn("rounded-xl border shadow-sm hover:shadow-md transition-all", isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50")}>
            <Settings className="w-4 h-4 mr-2" /> Personalizar
          </Button>
        </div>
      </div>

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
        <div className="lg:col-span-2 space-y-8">
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

        <div className="space-y-8">
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
  );
}
