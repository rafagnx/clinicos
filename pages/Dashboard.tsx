import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, Clock, CheckCircle2, Settings, TrendingUp, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

// Partially restore components to test data flow
import TodayAppointments from "@/components/dashboard/TodayAppointments";

export default function Dashboard() {
  console.log("🔵 DASHBOARD PHASE 2: DATA CONNECTION");
  const context = useOutletContext<{ isDark: boolean }>();
  // Safe access to context
  const isDark = context && context.isDark ? context.isDark : false;

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(err => console.error("Auth Fail", err));
  }, []);

  // Basic Data Fetching with Error Handling
  const { data: appointments = [], isError: appErr } = useQuery({
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

  const today = format(new Date(), "yyyy-MM-dd");

  const stats = {
    todayAppointments: safeAppointments.filter(a => a?.date === today).length,
    totalPatients: safePatients.length,
    activeProfessionals: safeProfessionals.length
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (user?.name || "Usuário").split(" ")[0];

  return (
    <div className={cn("p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 min-h-screen")}>

      {/* STATUS BAR */}
      <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 p-4 mb-4 rounded shadow-sm">
        <p className="font-bold">Dashboard V5 - Fase 2 (Rotas Corrigidas)</p>
        <p className="text-sm">Rota /dashboard normalizada. Conexão com banco ativa.</p>
        <p className="text-xs mt-1 text-emerald-800 font-mono">
          {appErr ? "ERRO NA CARGA DE DADOS DETECTADO" : `Dados carregados: ${safeAppointments.length} consultas.`}
        </p>
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
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" /> Personalizar
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Consultas Hoje</p>
          <p className="text-4xl font-bold text-slate-800">{stats.todayAppointments}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Pacientes</p>
          <p className="text-4xl font-bold text-slate-800">{stats.totalPatients}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Profissionais</p>
          <p className="text-4xl font-bold text-slate-800">{stats.activeProfessionals}</p>
        </div>
      </div>

      {/* LIST */}
      <div className="mt-8">
        <TodayAppointments
          isDark={isDark}
          appointments={safeAppointments.filter(a => a?.date === today)}
          patients={safePatients}
          professionals={safeProfessionals}
          onStatusChange={() => { }}
        />
      </div>

    </div>
  );
}
