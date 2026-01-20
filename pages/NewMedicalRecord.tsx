import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Calendar as CalendarIcon, Upload, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PROCEDURE_CATEGORIES = {
  "Toxina": ["Toxina Botulínica"],
  "Preenchimentos": ["8point", "Comissura", "Lábio", "Malar", "Mandíbula", "Mento", "Pré Jowls", "Nariz", "Olheira", "Sulco Naso", "Têmpora", "Glabela", "Marionete"],
  "Fios": ["Fio PDO Liso", "Fio PDO Tração"],
  "Bioestimuladores": ["Bioestimulador", "PDRN", "Exossomos", "Lavieen", "Hipro"],
  "Tratamentos": ["Microagulhamento", "Hialuronidase", "Endolaser Full Face", "Endolaser Região", "Endolaser Pescoço"],
  "Transplante": ["TP1", "TP2", "TP3"],
  "Cirurgias": ["Alectomia", "Bichectomia", "Brow Lift", "Lip Lift", "Slim Tip", "Lipo de Papada", "Blefaro", "Rinoplastia"]
};

export default function NewMedicalRecord() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    patient_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    professional_id: "",
    // Anamnesis
    complaint: "",
    medical_history: "",
    allergies: "",
    medications: "",
    previous_procedures: "",
    skin_type: "",
    expectations: "",
    // Photos (URLs)
    photos_before: [],
    photos_after: [],
    // Selected Procedures
    selected_procedures: [] as string[]
  });

  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => { });
  }, []);

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.read("Patient", { sort: [{ field: "full_name", direction: "asc" }] })
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals-list"],
    queryFn: () => base44.read("Professional")
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      // Serialize complex data into content field for now as backend might be simple
      const content = JSON.stringify({
        complaint: data.complaint,
        medical_history: data.medical_history,
        allergies: data.allergies,
        medications: data.medications,
        previous_procedures: data.previous_procedures,
        skin_type: data.skin_type,
        expectations: data.expectations,
        selected_procedures: data.selected_procedures,
        photos_before: data.photos_before,
        photos_after: data.photos_after
      }, null, 2);

      const payload = {
        patient_id: data.patient_id,
        patient_name: patients.find((p: any) => p.id === data.patient_id)?.full_name || "Desconhecido",
        professional_id: data.professional_id,
        professional_name: professionals.find((p: any) => p.id === data.professional_id)?.full_name || "Profissional",
        date: data.date,
        content: content, // Storing full structured data in content
        procedures_summary: data.selected_procedures.join(", ") // Optional summary field if schema supports
      };

      return base44.entities.MedicalRecord.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
      toast.success("Prontuário salvo com sucesso!");
      navigate("/MedicalRecords");
    },
    onError: () => toast.error("Erro ao salvar prontuário.")
  });

  const toggleProcedure = (proc: string) => {
    setFormData(prev => {
      const exists = prev.selected_procedures.includes(proc);
      return {
        ...prev,
        selected_procedures: exists
          ? prev.selected_procedures.filter(p => p !== proc)
          : [...prev.selected_procedures, proc]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error("Selecione um paciente.");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Novo Prontuário</h1>
            <p className="text-slate-500">Preencha as informações do atendimento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Basic Info */}
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(v) => setFormData(p => ({ ...p, patient_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data do Atendimento *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={formData.date}
                    onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select
                  value={formData.professional_id}
                  onValueChange={(v) => setFormData(p => ({ ...p, professional_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof: any) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* 2. Anamnesis */}
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Anamnese</h3>

            <div className="space-y-2">
              <Label>Queixa Principal</Label>
              <Textarea
                placeholder="O que motivou a consulta?"
                value={formData.complaint}
                onChange={(e) => setFormData(p => ({ ...p, complaint: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Histórico Médico</Label>
              <Textarea
                placeholder="Doenças pré-existentes, condições de saúde..."
                value={formData.medical_history}
                onChange={(e) => setFormData(p => ({ ...p, medical_history: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Alergias</Label>
                <Textarea
                  placeholder="Alergias conhecidas..."
                  className="h-24"
                  value={formData.allergies}
                  onChange={(e) => setFormData(p => ({ ...p, allergies: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Medicações em Uso</Label>
                <Textarea
                  placeholder="Medicamentos contínuos..."
                  className="h-24"
                  value={formData.medications}
                  onChange={(e) => setFormData(p => ({ ...p, medications: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Procedimentos Anteriores</Label>
              <Textarea
                placeholder="Procedimentos estéticos ou cirúrgicos já realizados..."
                value={formData.previous_procedures}
                onChange={(e) => setFormData(p => ({ ...p, previous_procedures: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Pele / Análise Facial</Label>
                <Textarea
                  placeholder="Características da pele, fototipo..."
                  className="h-24"
                  value={formData.skin_type}
                  onChange={(e) => setFormData(p => ({ ...p, skin_type: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expectativas do Paciente</Label>
                <Textarea
                  placeholder="O que o paciente espera alcançar..."
                  className="h-24"
                  value={formData.expectations}
                  onChange={(e) => setFormData(p => ({ ...p, expectations: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* 3. Photos */}
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Registro Fotográfico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base text-slate-700">Fotos Antes</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg h-48 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="text-center text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Clique para adicionar fotos</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-base text-slate-700">Fotos Depois</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg h-48 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="text-center text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Clique para adicionar fotos</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 4. Procedures */}
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Procedimentos Realizados</h3>

            <div className="space-y-6">
              {/* Custom Procedures */}
              {customProcedures.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-emerald-700 text-sm uppercase tracking-wide">Meus Procedimentos</h4>
                  <div className="flex flex-wrap gap-2">
                    {customProcedures.map((proc: any) => {
                      const isSelected = formData.selected_procedures.includes(proc.name);
                      return (
                        <Button
                          key={proc.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleProcedure(proc.name)}
                          className={cn(
                            "transition-all",
                            isSelected ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" : "text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:text-emerald-800 bg-emerald-50"
                          )}
                        >
                          {isSelected && <Plus className="w-3 h-3 mr-1" />}
                          {proc.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              {Object.entries(PROCEDURE_CATEGORIES).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-slate-700 text-sm uppercase tracking-wide">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map(proc => {
                      const isSelected = formData.selected_procedures.includes(proc);
                      return (
                        <Button
                          key={proc}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleProcedure(proc)}
                          className={cn(
                            "transition-all",
                            isSelected ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent" : "text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                          )}
                        >
                          {isSelected && <Plus className="w-3 h-3 mr-1" />}
                          {proc}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary of Selection */}
            {formData.selected_procedures.length > 0 && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Resumo dos Procedimentos:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.selected_procedures.map(proc => (
                    <span key={proc} className="inline-flex items-center gap-1 bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 shadow-sm">
                      {proc}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => toggleProcedure(proc)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 pt-4 sticky bottom-0 bg-slate-50/90 p-4 border-t backdrop-blur-sm z-10">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11 px-8">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="h-11 px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20">
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Prontuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
