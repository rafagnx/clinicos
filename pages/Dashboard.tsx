import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // DISABLED FOR DEBUG
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

import MobileDashboard from "@/components/dashboard/MobileDashboard";

export default function Dashboard() {
  console.log("🔵 DASHBOARD MOUNTED - START");
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
        const migrated = parsed.filter(w => w.id !== 'chat_activity' && w.id !== 'today_appointments');
        return defaultWidgets.map(def => {
          const saved = migrated.find(w => w.id === def.id);
          return saved || def;
        });
      }
    } catch (e) { }
    return defaultWidgets;
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: appointments = [], isError: isErrorApt } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: patients = [], isError: isErrorPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => (base44.entities.Patient as any).filter({ status: "ativo" })
  });

  const { data: professionals = [], isError: isErrorPros } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => (base44.entities.Professional as any).filter({ status: "ativo" })
  });

  // Fetch conversations for chat widget
  const { data: conversations = [], isError: isErrorConv } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.list("Conversation", { sort: [{ field: "last_message_at", direction: "desc" }] })
  });

  // Stats calculation
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals : [];
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const stats = {
    todayAppointments: safeAppointments.filter(a => a?.date === today && a?.type !== 'compromisso').length,
    totalPatients: safePatients.length,
    pendingConfirmations: safeAppointments.filter(a => a?.status === "agendado" && a?.type !== 'compromisso').length,
    activeProfessionals: safeProfessionals.length
  };

  const renderWidget = (id) => {
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
      queryClient.invalidateQueries({ queryKey: ["appointments-today"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-week"] });
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
    <div className={cn("p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 min-h-screen")}>
      <h1 className="text-center text-xs text-green-600 font-bold p-2 border border-green-300 bg-green-50 mb-4 rounded">
        STATUS: Dashboard v4.0 (Safe Mode) | User: {user?.email || 'Loading'}
      </h1>

      {/* HEADER */}
      <div className={cn("rounded-3xl p-6 md:p-8 border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h1 className={cn("text-3xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
              {greeting}, {firstName}!
            </h1>
            <p className={cn("text-base", isDark ? "text-slate-400" : "text-slate-600")}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={() => setSelectorOpen(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" /> Personalizar
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn("p-4 rounded-xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <p className="text-sm text-slate-500">Consultas Hoje</p>
          <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{stats.todayAppointments}</p>
        </div>
        <div className={cn("p-4 rounded-xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <p className="text-sm text-slate-500">Total Pacientes</p>
          <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{stats.totalPatients}</p>
        </div>
        <div className={cn("p-4 rounded-xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <p className="text-sm text-slate-500">Aguardando</p>
          <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{stats.pendingConfirmations}</p>
        </div>
        <div className={cn("p-4 rounded-xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <p className="text-sm text-slate-500">Profissionais</p>
          <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{stats.activeProfessionals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* TODAY'S APPOINTMENTS */}
          <TodayAppointments
            isDark={isDark}
            appointments={safeAppointments.filter(a => {
              if (!a?.date) return false;
              const aptDate = String(a.date).includes('T') ? String(a.date).split('T')[0] : a.date;
              return aptDate === today;
            })}
            patients={safePatients}
            professionals={safeProfessionals}
            onStatusChange={handleStatusChange}
          />

          {/* WIDGETS - NO DRAG DROP FOR NOW */}
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
