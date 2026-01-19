import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Clock, CheckCircle2, UserPlus, Settings, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
import WidgetSelector from "@/components/dashboard/WidgetSelector";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [user, setUser] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: "upcoming_appointments", enabled: true, order: 0 },
    { id: "financial_summary", enabled: true, order: 1 },
    { id: "chat_activity", enabled: true, order: 2 },
    { id: "urgent_reminders", enabled: true, order: 3 }
  ]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.filter({ status: "ativo" })
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.filter({ status: "ativo" })
  });

  // Stats calculation
  // Stats calculation - ensure safety with optional chaining and defaults
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals : [];

  const stats = {
    todayAppointments: safeAppointments.filter(a => a?.date === today).length,
    totalPatients: safePatients.length,
    pendingConfirmations: safeAppointments.filter(a => a?.status === "agendado").length,
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
      case "upcoming_appointments": return <UpcomingAppointmentsWidget appointments={safeAppointments} patients={safePatients} />;
      case "financial_summary": return <FinancialSummaryWidget appointments={safeAppointments} />;
      case "chat_activity": return <ChatActivityWidget conversations={[]} currentUserEmail={user?.email} />;
      case "urgent_reminders": return <UrgentRemindersWidget appointments={safeAppointments} patients={safePatients} promotions={[]} />;
      default: return null;
    }
  };

  const handleStatusChange = async (id, status) => {
    console.log("Updating status", id, status);
    // Implement mutation here
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {(user?.display_name || user?.full_name || "Doutor(a)").split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-500">Aqui está o resumo da sua clínica para hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectorOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Personalizar Painel
          </Button>
          <Button size="sm" asChild>
            <Link to={createPageUrl("Agenda")}>
              <Calendar className="w-4 h-4 mr-2" />
              Ver Agenda
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Consultas Hoje"
          value={stats.todayAppointments || "-"}
          icon={Clock}
          subtitle={stats.todayAppointments ? "+12% em relação a ontem" : "Sem agendamentos"}
          color="blue"
        />
        <StatsCard
          title="Total de Pacientes"
          value={stats.totalPatients || "-"}
          icon={Users}
          subtitle={stats.totalPatients ? "5 novos esta semana" : "Nenhum paciente cadastrado"}
          color="emerald"
        />
        <StatsCard
          title="Aguardando Confirmação"
          value={stats.pendingConfirmations || "-"}
          icon={Calendar}
          subtitle="Ação necessária"
          color="amber"
        />
        <StatsCard
          title="Profissionais Ativos"
          value={stats.activeProfessionals || "-"}
          icon={CheckCircle2}
          subtitle="Equipe completa"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Widgets Area */}
        <div className="lg:col-span-2 space-y-8">
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
                            className="absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
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
        <div className="space-y-8">
          <TodayAppointments
            appointments={safeAppointments.filter(a => a?.date === today)}
            patients={safePatients}
            professionals={safeProfessionals}
            onStatusChange={handleStatusChange}
          />
          <BirthdaysList patients={safePatients.filter(p => {
            if (!p.birth_date) return false;
            try {
              // Handle various date formats safely
              let birthMonth, birthDay;

              if (p.birth_date.includes('T')) {
                const date = new Date(p.birth_date);
                birthMonth = date.getUTCMonth(); // Use UTC to avoid timezone shifts if stored as UTC
                birthDay = date.getUTCDate();
              } else if (p.birth_date.includes('-')) {
                const part = p.birth_date.split('T')[0]; // Just in case
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

          <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200">
            <div className="space-y-4">
              <div className="p-3 bg-white/20 rounded-lg w-fit">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Expandir sua Clínica?</h3>
                <p className="text-blue-100 text-sm">Convide novos profissionais para sua equipe e gerencie tudo em um só lugar.</p>
              </div>
              <Button variant="secondary" className="w-full bg-white text-blue-700 hover:bg-blue-50 border-none" asChild>
                <Link to={createPageUrl("Professionals")}>Gerenciar Equipe</Link>
              </Button>
            </div>
          </Card>
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
