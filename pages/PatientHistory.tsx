// @ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, Calendar, Clock, FileText,
  Tag, CheckCircle2, Phone, Mail, MapPin, Activity, Stethoscope,
  ChevronRight, AlertCircle, HeartPulse, User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import PatientTimeline from "@/components/patients/PatientTimeline";

export default function PatientHistory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("id");
  const [activeTab, setActiveTab] = useState("timeline");

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const patients = await base44.entities.Patient.list();
      return patients.find(p => String(p.id) === String(patientId));
    },
    enabled: !!patientId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: () => base44.entities.MedicalRecord.filter({ patient_id: patientId }, "-date"),
    enabled: !!patientId
  });

  // Combine and sort events for timeline
  const timelineEvents = React.useMemo(() => {
    const apps = appointments
      .filter(a => a.patient_id === patientId)
      .map(a => ({
        type: 'appointment',
        date: a.date, // Assuming YYYY-MM-DD
        fullDate: new Date(`${a.date}T${a.start_time || '00:00'}`),
        data: a
      }));

    const records = medicalRecords.map(r => ({
      type: 'record',
      date: r.date.split('T')[0],
      fullDate: new Date(r.date),
      data: r
    }));

    return [...apps, ...records].sort((a, b) => b.fullDate - a.fullDate);
  }, [appointments, medicalRecords, patientId]);

  const stats = {
    totalAppointments: appointments.filter(a => a.patient_id === patientId).length,
    completedAppointments: appointments.filter(a => a.patient_id === patientId && a.status === 'concluido').length,
    lastVisit: appointments.find(a => a.patient_id === patientId)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Paciente não encontrado</h2>
        <p className="text-slate-500 mb-6 max-w-sm">
          O paciente que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate(createPageUrl("Patients"))}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb / Back */}
          <div className="px-4 md:px-8 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-indigo-600 pl-0 hover:bg-transparent"
              onClick={() => navigate(createPageUrl("Patients"))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Pacientes
            </Button>
          </div>

          {/* Profile Content */}
          <div className="px-4 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-30 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                <Avatar className="w-28 h-28 border-4 border-white shadow-xl relative">
                  <AvatarImage src={patient.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 text-3xl font-bold">
                    {patient.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white shadow-sm" title="Ativo" />
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0 pt-2 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl font-display font-bold text-slate-900 leading-none">
                      {patient.full_name}
                    </h1>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-2.5 py-0.5">
                      Fidelidade: Prata
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {patient.phone || "Sem telefone"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {patient.email || "Sem e-mail"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {patient.birth_date ? `${format(parseISO(patient.birth_date), "dd/MM/yyyy")} (${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos)` : "Nasc. não informado"}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="flex gap-4 pt-2">
                  <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Consultas</span>
                    <span className="text-lg font-bold text-slate-900">{stats.totalAppointments}</span>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Faltas</span>
                    <span className="text-lg font-bold text-slate-900">0</span>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Gasto Total</span>
                    <span className="text-lg font-bold text-emerald-600">R$ 0,00</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                  onClick={() => navigate(`/agenda?newAppointment=true&patientId=${patientId}`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => navigate(`/NewMedicalRecord?patientId=${patientId}`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nova Evolução
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 md:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent space-x-6 p-0 h-auto rounded-none border-b border-transparent">
                {["timeline", "prontuarios", "midia", "financeiro"].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={cn(
                      "px-1 py-3 bg-transparent rounded-none border-b-2 font-medium transition-all data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none text-slate-500 hover:text-slate-800 capitalize",
                    )}
                  >
                    {tab === "timeline" ? "Linha do Tempo" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2">
            {activeTab === "timeline" && (
              <PatientTimeline patientId={patientId} />
            )}

            {activeTab === "prontuarios" && (
              <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Visualização focada em prontuários em desenvolvimento.</p>
              </div>
            )}

            {activeTab === "financeiro" && (
              <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Histórico financeiro em desenvolvimento.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Tag className="w-4 h-4 text-indigo-500" /> Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-slate-50">Não fuma</Badge>
                <Badge variant="outline" className="bg-slate-50">Diabético</Badge>
                <Badge variant="outline" className="border-dashed text-slate-400 cursor-pointer hover:text-indigo-500 hover:border-indigo-300">+ Adicionar</Badge>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-rose-500" /> ÚLTIMOS PROCEDIMENTOS
              </h3>
              <ul className="space-y-4">
                {timelineEvents.filter(e => e.type === 'record').slice(0, 3).map((record, i) => (
                  <li key={i} className="flex gap-3 items-start p-3 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">Consulta de Rotina</p>
                      <p className="text-xs text-slate-500">{format(record.fullDate, "dd MMM yyyy", { locale: ptBR })}</p>
                    </div>
                  </li>
                ))}
                {timelineEvents.filter(e => e.type === 'record').length === 0 && (
                  <li className="text-xs text-slate-400 italic">Sem registros recentes</li>
                )}
              </ul>
            </Card>

            <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
              <div className="p-5">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5" /> Saúde Geral
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <span className="text-indigo-200 text-xs uppercase font-bold">Peso</span>
                    <p className="text-2xl font-bold">72 <span className="text-sm font-normal opacity-70">kg</span></p>
                  </div>
                  <div>
                    <span className="text-indigo-200 text-xs uppercase font-bold">Altura</span>
                    <p className="text-2xl font-bold">1.75 <span className="text-sm font-normal opacity-70">m</span></p>
                  </div>
                </div>
              </div>
              <div
                className="bg-white/10 p-3 text-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => navigate(`/MedicalRecords`)}
              >
                <span className="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  Ver Anamnese <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}




