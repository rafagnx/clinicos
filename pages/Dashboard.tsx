import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Clock, CheckCircle2, UserPlus, Settings, GripVertical, TrendingUp, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useOutletContext } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";

import TodayAppointments from "@/components/dashboard/TodayAppointments";
import BirthdaysList from "@/components/dashboard/BirthdaysList";
import UpcomingAppointmentsWidget from "@/components/dashboard/UpcomingAppointmentsWidget";
import FinancialSummaryWidget from "@/components/dashboard/FinancialSummaryWidget";
import ChatActivityWidget from "@/components/dashboard/ChatActivityWidget";
import UrgentRemindersWidget from "@/components/dashboard/UrgentRemindersWidget";
import FinancialReportsWidget from "@/components/dashboard/FinancialReportsWidget";
import ReturnsAlertWidget from "@/components/dashboard/ReturnsAlertWidget";
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

    // Initial check
    checkMobile();

    // Listener
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
        // Migrations: filter out old ids and merge with defaults
        const migrated = parsed.filter(w => w.id !== 'chat_activity' && w.id !== 'today_appointments');

        return defaultWidgets.map(def => {
          const saved = migrated.find(w => w.id === def.id);
          return saved || def;
        });
      }
    } catch (e) { }
    return defaultWidgets;
  });

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setWidgets(items.map((item, index) => ({ ...item, order: index })));
  };

  const renderWidget = (id) => {
    switch (id) {
      case "upcoming_appointments": return <UpcomingAppointmentsWidget isDark={isDark} appointments={safeAppointments.filter(a => a?.type !== 'compromisso')} patients={safePatients} professionals={safeProfessionals} />;
      case "financial_reports": return <FinancialReportsWidget isDark={isDark} appointments={safeAppointments} />;
      case "urgent_reminders": return <UrgentRemindersWidget appointments={safeAppointments} patients={safePatients} promotions={[]} />;
      case "returns_alert": return <ReturnsAlertWidget />;
      default: return null;
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await base44.entities.Appointment.update(id, { status });
      queryClient.invalidateQueries({ queryKey: ["appointments-today"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-week"] });

      const statusLabels = {
        confirmado: "confirmada",
        aguardando: "marcado como aguardando",
        em_atendimento: "iniciado",
        finalizado: "finalizado",
        faltou: "marcado como falta",
        cancelado: "cancelado"
      };
      toast.success(`Consulta ${statusLabels[status] || status}!`);
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
      {/* DEBUG HEADER */}
      <h1 className="text-center text-xs text-gray-400 p-2 border border-dashed border-gray-300 mb-4 rounded">
        DEBUG MODE: DASHBOARD ACTIVE v3.0 | User: {user?.email || 'Loading...'} | Total Appts: {safeAppointments.length}
      </h1>

      {/* Welcome Header */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 md:p-8 border",
          isDark
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <h1 className={cn("text-3xl md:text-5xl font-display font-bold tracking-tight flex items-center flex-wrap gap-x-4 gap-y-2", isDark ? "text-white" : "text-slate-900")}>
              {user?.email === 'rafamarketingdb@gmail.com' && (
                <div className="relative inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 shrink-0">
                  <img src="/rafa-avatar.png" alt="Rafa" className="relative w-full h-full object-cover rounded-full border-2 border-white/20 shadow-2xl" />
                </div>
              )}
              <span>{greeting}, <span className="text-indigo-500">{user?.email === 'rafamarketingdb@gmail.com' ? 'Rafa' : firstName}</span>! 👋</span>
            </h1>
            <p className={cn("text-base md:text-lg", isDark ? "text-slate-400" : "text-slate-600")}>
              Aqui está o pulso da sua clínica hoje.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <Button
              variant="ghost"
              className={cn(
                "rounded-xl flex-1 md:flex-none",
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              onClick={() => setSelectorOpen(true)}
            >
              <Settings className="w-5 h-5 mr-2" />
              Personalizar
            </Button>
            <Button
              className={cn(
                "rounded-xl shadow-lg transition-all hover:scale-105 btn-premium flex-1 md:flex-none whitespace-nowrap",
                isDark ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              <Link to="/Agenda" className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Ver Agenda
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - STATIC */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* STAT 1: Consultas Hoje */}
        <div className={cn("rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500 shadow-blue-500/20 shadow-lg"><Clock className="w-6 h-6 text-white" /></div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Consultas Hoje</h3>
          <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>{stats.todayAppointments || 0}</p>
        </div>

        {/* STAT 2: Total Pacientes */}
        <div className={cn("rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500 shadow-emerald-500/20 shadow-lg"><Users className="w-6 h-6 text-white" /></div>
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Total Pacientes</h3>
          <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>{stats.totalPatients || 0}</p>
        </div>

        {/* STAT 3: Aguardando */}
        <div className={cn("rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500 shadow-amber-500/20 shadow-lg"><Calendar className="w-6 h-6 text-white" /></div>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Aguardando</h3>
          <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>{stats.pendingConfirmations || 0}</p>
        </div>

        {/* STAT 4: Profissionais */}
        <div className={cn("rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-500 shadow-indigo-500/20 shadow-lg"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Profissionais</h3>
          <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>{stats.activeProfessionals || 0}</p>
        </div>
      </div>

      {(isErrorApt || isErrorPatients || isErrorPros || isErrorConv) && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold flex items-center gap-2">⚠️ Erro de conexão</h3>
          <p className="text-sm">Alguns dados não puderam ser carregados. Tente recarregar a página.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-widgets">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                  {widgets
                    .filter(w => w.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="group relative">
                            <div {...provided.dragHandleProps} className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-grab active:cursor-grabbing text-slate-400">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            {renderWidget(widget.id)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="space-y-8">
          <BirthdaysList patients={safePatients} />
          <ChatActivityWidget conversations={safeConversations} />
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
