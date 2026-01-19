import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Loader2, FileText, Camera } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Prontuário não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-slate-500 hover:text-slate-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
          {/* Header do Prontuário */}
          <div className="bg-white p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-slate-100">
                  <AvatarImage src={patient?.photo_url} />
                  <AvatarFallback className="bg-slate-50 text-slate-400">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{patient?.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                      Prontuário #{record.id.slice(0, 8)}
                    </Badge>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(record.created_date || record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <FileText className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-8 space-y-8 bg-white">
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Anamnese / Evolução</h3>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                {record.content}
              </div>
            </section>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Diagnóstico</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {record.diagnosis || "Nenhum diagnóstico registrado."}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Prescrição / Conduta</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {record.prescription || "Nenhuma prescrição registrada."}
                </div>
              </section>
            </div>

            {record.attachments?.length > 0 && (
              <>
                <Separator className="bg-slate-100" />
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Anexos e Exames</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {record.attachments.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl border border-slate-200 overflow-hidden group relative cursor-pointer">
                        <img src={url} alt="Anexo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" />
              Responsável: <span className="font-bold text-slate-700">{record.professional_name || "Dr. Responsável"}</span>
            </div>
            <div className="text-xs text-slate-400">
              {record.updated_date && (
                <span>Última alteração: {format(new Date(record.updated_date), "dd/MM/yyyy HH:mm")}</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
