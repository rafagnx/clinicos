import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Settings, TrendingUp, Users, Calendar, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

import WidgetSelector from "@/components/dashboard/WidgetSelector";

// Components (We will re-introduce one by one if this works)
import TodayAppointments from "@/components/dashboard/TodayAppointments";

export default function Dashboard() {
  console.log("🔵 RESTORED DASHBOARD - STEP 1");
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark || false;
  const [user, setUser] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  // Basic Data Fetching
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: () => base44.entities.Appointment.list("-date") });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => (base44.entities.Patient as any).filter({ status: "ativo" }) });
  const { data: professionals = [] } = useQuery({ queryKey: ["professionals"], queryFn: () => (base44.entities.Professional as any).filter({ status: "ativo" }) });

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals : [];

  const stats = {
    todayAppointments: safeAppointments.filter(a => a?.date === format(new Date(), "yyyy-MM-dd")).length,
    totalPatients: safePatients.length,
    activeProfessionals: safeProfessionals.length
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (user?.name || "Usuário").split(" ")[0];

  return (
    <div className={cn("p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 min-h-screen")}>

      {/* STATUS BAR */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded shadow-sm">
        <p className="font-bold">Modo de Restauração - Passo 1</p>
        <p className="text-sm">Se você vê isso, o layout básico e o banco de dados estão funcionando.</p>
      </div>

      {/* HEADER */}
      <div className={cn("rounded-3xl p-6 md:p-8 border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="flex justify-between items-center">
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

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn("p-6 rounded-2xl border flex flex-col justify-between h-32", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-100 rounded-lg"><Clock className="w-6 h-6 text-blue-600" /></div>
            <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Consultas Hoje</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.todayAppointments}</p>
          </div>
        </div>

        <div className={cn("p-6 rounded-2xl border flex flex-col justify-between h-32", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-100 rounded-lg"><Users className="w-6 h-6 text-emerald-600" /></div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Pacientes</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalPatients}</p>
          </div>
        </div>

        <div className={cn("p-6 rounded-2xl border flex flex-col justify-between h-32", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-100 rounded-lg"><CheckCircle2 className="w-6 h-6 text-indigo-600" /></div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Profissionais</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.activeProfessionals}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* LISTA DE CONSULTAS */}
          <TodayAppointments
            isDark={isDark}
            appointments={safeAppointments.filter(a => a?.date === format(new Date(), "yyyy-MM-dd"))}
            patients={safePatients}
            professionals={safeProfessionals}
            onStatusChange={() => { }}
          />
        </div>
        <div className="bg-slate-100 p-4 rounded h-96 flex items-center justify-center border-2 border-dashed border-slate-300">
          <p className="text-slate-500">Sidebar Widgets Disabled (For diagnostic)</p>
        </div>
      </div>

      <WidgetSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        widgets={[]}
        onToggleWidget={() => { }}
      />

    </div>
  );
}
