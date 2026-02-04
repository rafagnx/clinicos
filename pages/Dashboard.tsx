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
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";

import StatsCard from "@/components/dashboard/StatsCard";
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
  const { isDark } = useOutletContext<{ isDark: boolean }>();
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

  // Fetch conversations for chat widget
  const { data: conversations = [] } = useQuery({
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
      case "upcoming_appointments": return <UpcomingAppointmentsWidget appointments={safeAppointments.filter(a => a?.type !== 'compromisso')} patients={safePatients} professionals={safeProfessionals} />;
      case "financial_reports": return <FinancialReportsWidget appointments={safeAppointments} />;
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (isMobile) {
    return <MobileDashboard user={user} stats={stats} appointments={safeAppointments} />;
  }

  return (
    <div className={cn("p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 min-h-screen")}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 md:p-8 border",
          isDark
            ? "bg-gradient-to-br from-slate-900/50 via-indigo-900/20 to-purple-900/20 border-slate-800/50"
            : "bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 border-slate-200/50"
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-shimmer" />

        {/* Floating orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <h1 className={cn("text-3xl md:text-5xl font-display font-bold tracking-tight flex items-center flex-wrap gap-x-4 gap-y-2", isDark ? "text-white" : "text-slate-900")}>
              {user?.email === 'rafamarketingdb@gmail.com' && (
                <div className="relative inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-70 blur-md animate-pulse-soft" />
                  <img src="/rafa-avatar.png" alt="Rafa" className="relative w-full h-full object-cover rounded-full border-2 border-white/20 shadow-2xl" />
                </div>
              )}
              <span>{greeting}, <span className="text-gradient-primary">{user?.email === 'rafamarketingdb@gmail.com' ? 'Rafa' : firstName}</span>! 👋</span>
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
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              onClick={() => setSelectorOpen(true)}
            >
              <Settings className="w-5 h-5 mr-2" />
              Personalizar
            </Button>
            <Button
              className={cn(
                "rounded-xl shadow-lg transition-all hover:scale-105 btn-premium flex-1 md:flex-none whitespace-nowrap",
                isDark
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-300/50"
              )}
              asChild
            >
              <Link to={createPageUrl("Agenda")}>
                <Calendar className="w-4 h-4 mr-2" />
                Ver Agenda
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <div className={cn(
            "group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
            isDark
              ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/50 hover:border-blue-600/50"
              : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 hover:border-blue-400/50"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Consultas Hoje</h3>
              <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>
                {stats.todayAppointments || "-"}
              </p>
              <p className="text-xs text-blue-500 font-medium">
                {stats.todayAppointments ? "+12% vs ontem" : "Sem agendamentos"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className={cn(
            "group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
            isDark
              ? "bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-800/50 hover:border-emerald-600/50"
              : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50 hover:border-emerald-400/50"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Total de Pacientes</h3>
              <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>
                {stats.totalPatients || "-"}
              </p>
              <p className="text-xs text-emerald-500 font-medium">
                {stats.totalPatients ? "5 novos esta semana" : "Nenhum paciente"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className={cn(
            "group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
            isDark
              ? "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-800/50 hover:border-amber-600/50"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 hover:border-amber-400/50"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Aguardando Confirmação</h3>
              <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>
                {stats.pendingConfirmations || "-"}
              </p>
              <p className="text-xs text-amber-500 font-medium">Ação necessária</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className={cn(
            "group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
            isDark
              ? "bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-800/50 hover:border-indigo-600/50"
              : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200/50 hover:border-indigo-400/50"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className={cn("text-sm font-medium mb-1", isDark ? "text-slate-400" : "text-slate-600")}>Profissionais Ativos</h3>
              <p className={cn("text-3xl font-display font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>
                {stats.activeProfessionals || "-"}
              </p>
              <p className="text-xs text-indigo-500 font-medium">Equipe completa</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority #1: Daily Agenda - Fixed prominence */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TodayAppointments
              appointments={safeAppointments.filter(a => {
                if (!a?.date) return false;
                const aptDate = a.date.includes('T') ? a.date.split('T')[0] : a.date;
                return aptDate === today;
              })}
              patients={safePatients}
              professionals={safeProfessionals}
              onStatusChange={handleStatusChange}
            />
          </motion.div>

          {/* Draggable Support Widgets Area */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                  {widgets.filter(w => w.enabled).map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group ${snapshot.isDragging ? "z-50" : ""}`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className={cn(
                              "absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded",
                              isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                            )}
                          >
                            <GripVertical className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="pl-8">
                            {renderWidget(widget.id)}
                          </div>
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

        {/* Sidebar Content */}
        <div className="space-y-8 flex flex-col">
          <div className="order-1 space-y-8">
            <BirthdaysList patients={safePatients.filter(p => {
              if (!p.birth_date) return false;
              try {
                let birthMonth, birthDay;
                if (p.birth_date.includes('T')) {
                  const date = new Date(p.birth_date);
                  birthMonth = date.getUTCMonth();
                  birthDay = date.getUTCDate();
                } else if (p.birth_date.includes('-')) {
                  const part = p.birth_date.split('T')[0];
                  const [y, m, d] = part.split('-').map(Number);
                  birthMonth = m - 1;
                  birthDay = d;
                } else {
                  return false;
                }
                const todayDate = new Date();
                return birthMonth === todayDate.getMonth() && birthDay === todayDate.getDate();
              } catch (e) {
                return false;
              }
            })} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={cn(
                "relative overflow-hidden p-6 border-none shadow-2xl",
                "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
              )}>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-shimmer" />

                <div className="relative z-10 space-y-4 text-white">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Expandir sua Clínica?</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      Convide novos profissionais para sua equipe e gerencie tudo em um só lugar.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    asChild
                  >
                    <Link to={createPageUrl("Professionals")}>Gerenciar Equipe</Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="order-2 opacity-80 hover:opacity-100 transition-opacity">
            <ChatActivityWidget professionals={safeProfessionals} currentUserId={user?.id} />
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

