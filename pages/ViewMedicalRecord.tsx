import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Calendar, Loader2, FileText,
  Stethoscope, Activity, Sparkles, Beaker,
  Thermometer, UserRound
} from "lucide-react";

// Move Section component outside to avoid re-renders and potential scoping issues
const MedicalSection = ({ title, icon: Icon, children, className }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
  <section className={`space-y-4 ${className || ""}`}>
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="pl-10">
      {children}
    </div>
  </section>
);

export default function ViewMedicalRecord() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("id");

  const { data: record, isLoading } = useQuery({
    queryKey: ["medicalRecord", recordId],
    queryFn: async () => {
      const records = await base44.entities.MedicalRecord.filter({ id: recordId });
      return records[0];
    },
    enabled: !!recordId
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", record?.patient_id],
    queryFn: async () => {
      const patients = await base44.entities.Patient.filter({ id: record.patient_id });
      return patients[0];
    },
    enabled: !!record?.patient_id
  });

  const parsedContent = React.useMemo(() => {
    if (!record?.content) return null;
    try {
      return typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
    } catch (e) {
      console.warn("Failed to parse medical record content", e);
      return null;
    }
  }, [record?.content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <div>
            <p className="text-slate-900 font-bold text-lg">Carregando Prontuário</p>
            <p className="text-slate-500 text-sm">Aguarde um instante enquanto buscamos as informações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-slate-200">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Registro não encontrado</h2>
          <p className="text-slate-500 mt-2 mb-8">Não conseguimos localizar este prontuário. Ele pode ter sido removido ou o link está incorreto.</p>
          <Button onClick={() => navigate(-1)} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Voltar para a Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-8 gap-2 text-slate-500 hover:text-indigo-600 transition-all group px-0 hover:bg-transparent"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-semibold">Voltar para Prontuários</span>
        </Button>

        <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-indigo-500/5 ring-1 ring-slate-100">
          {/* Header Section */}
          <div className="bg-white p-6 sm:p-10 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-1 ring-slate-100">
                  <AvatarImage src={patient?.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-3xl font-bold">
                    {(record.patient_name || "PA").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {record.patient_name || "Paciente sem nome"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-3 pt-2">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-0 font-bold px-3">
                      PRONTUÁRIO #{String(record.id).substring(0, 8)}
                    </Badge>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {(() => {
                        try {
                          const dateStr = String(record.date || "").split('T')[0];
                          const dateObj = new Date(dateStr + 'T12:00:00');
                          return isNaN(dateObj.getTime()) ? "Data não informada" : format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR });
                        } catch (e) {
                          return "Data não informada";
                        }
                      })()}
                    </div>
                    {(patient?.temperament || patient?.main_motivation) && (
                      <div className="flex flex-wrap items-center gap-2 w-full mt-3 pt-3 border-t border-slate-50">
                        {patient.temperament && (
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200 px-3 py-1">
                            🧠 {patient.temperament}
                          </Badge>
                        )}
                        {patient.main_motivation && (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 px-3 py-1">
                            ❤️ {patient.main_motivation}
                          </Badge>
                        )}
                        {patient.conscience_level && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 px-3 py-1">
                            💡 {patient.conscience_level}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 px-8 h-12 font-bold shrink-0 text-white">
                <FileText className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Structured Sections */}
          <div className="p-6 sm:p-10 space-y-12 bg-white">

            {/* 1. Medical History & Complaint */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <MedicalSection title="Histórico e Queixa" icon={Stethoscope}>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Queixa Principal</h4>
                    <p className="text-slate-800 text-xl font-medium leading-relaxed">
                      {parsedContent?.complaint || "Nenhuma queixa registrada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Histórico Diagnóstico</h4>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {parsedContent?.medical_history || "Sem antecedentes relevantes"}
                    </p>
                  </div>
                </div>
              </MedicalSection>

              <MedicalSection title="Segurança Clínica" icon={Thermometer}>
                <div className="space-y-8">
                  <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Alergias
                    </h4>
                    <p className="text-rose-900 font-bold text-lg">
                      {parsedContent?.allergies || "Nenhuma alergia relatada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Medicações Atuais</h4>
                    <p className="text-slate-600 leading-relaxed border-l-2 border-indigo-100 pl-4">
                      {parsedContent?.medications || "Nenhum medicamento informado"}
                    </p>
                  </div>
                </div>
              </MedicalSection>
            </div>

            <Separator />

            {/* 2. Aesthetic Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <MedicalSection title="Análise Estética" icon={Sparkles}>
                <div className="space-y-8">
                  <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Avaliação Facial</h4>
                    <p className="text-indigo-900 font-semibold leading-relaxed">
                      {parsedContent?.skin_type || "Avaliação não registrada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Intervenções Prévias</h4>
                    <p className="text-slate-600 leading-relaxed">
                      {parsedContent?.previous_procedures || "Primeiro atendimento registrado"}
                    </p>
                  </div>
                </div>
              </MedicalSection>

              <MedicalSection title="Alineamento" icon={Activity}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Expectativas do Paciente</h4>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                  <span className="absolute -top-3 left-6 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">
                    Citação Direta
                  </span>
                  <p className="text-slate-700 italic font-medium text-lg leading-relaxed">
                    "{parsedContent?.expectations || "Não houve registro de expectativas específicas"}"
                  </p>
                </div>
              </MedicalSection>
            </div>

            <Separator />

            {/* 3. Procedures Summary */}
            <MedicalSection title="Execução Técnica" icon={Beaker}>
              <div className="space-y-8">
                <div className="flex flex-wrap gap-2">
                  {parsedContent?.selected_procedures?.map((proc: string, i: number) => (
                    <Badge key={i} className="bg-indigo-600 text-white hover:bg-indigo-600 border-0 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl shadow-md">
                      {proc}
                    </Badge>
                  )) || <p className="text-slate-400 text-sm">Nenhum procedimento executado neste registro</p>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 text-center shadow-sm hover:shadow-indigo-500/10 transition-all ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Toxina</p>
                    <p className="text-3xl font-black text-slate-900">{parsedContent?.toxin_units || "0"}<span className="text-[10px] ml-1 text-slate-400 uppercase">UI</span></p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 text-center shadow-sm hover:shadow-indigo-500/10 transition-all ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Seringas</p>
                    <p className="text-3xl font-black text-slate-900">{parsedContent?.fillers_syringes || "0"}<span className="text-[10px] ml-1 text-slate-400 uppercase">ser</span></p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 text-center shadow-sm hover:shadow-indigo-500/10 transition-all ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Fios</p>
                    <p className="text-3xl font-black text-slate-900">{parsedContent?.threads_count || "0"}<span className="text-[10px] ml-1 text-slate-400 uppercase">un</span></p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 text-center shadow-sm hover:shadow-indigo-500/10 transition-all ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Materiais</p>
                    <p className="text-indigo-600 font-bold truncate px-2">{parsedContent?.materials_used || "-"}</p>
                  </div>
                </div>
              </div>
            </MedicalSection>

          </div>

          {/* Signature / Responsability */}
          <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 ring-4 ring-slate-100">
                <UserRound className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Assinado por</p>
                <p className="font-black text-slate-900 text-xl tracking-tight uppercase">{record.professional_name || "Profissional Responsável"}</p>
              </div>
            </div>
            <div className="text-right sm:text-right w-full sm:w-auto bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registro Digital Autenticado</p>
              <p className="text-sm font-black text-indigo-600">
                {format(new Date(record.created_date || record.date || new Date()), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
