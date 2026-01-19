import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

const STEPS = [
  { id: "profile", label: "Perfil", key: "profile_completed" },
  { id: "availability", label: "Disponibilidade", key: "availability_set" },
  { id: "training", label: "Treinamento", key: "training_completed" },
  { id: "tasks", label: "Tarefas", key: "tasks_assigned" }
];

const DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" }
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      const list = await base44.entities.Onboarding.filter({ user_id: user.id });
      return list[0];
    },
    enabled: !!user?.id
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Onboarding.update(onboarding.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      toast.success("Progresso salvo!");
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);
      updateMutation.mutate({ progress });
    } else {
      updateMutation.mutate({ status: "concluido", progress: 100 });
      toast.success("Onboarding concluído com sucesso!");
      navigate(createPageUrl("Dashboard"));
    }
  };

  if (isLoading || !onboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Header */}
        <div className="text-center space-y-2">
          <Rocket className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo à Clínica!</h1>
          <p className="text-slate-500">Vamos configurar seu perfil para você começar a atender.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${index <= currentStep ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {index < currentStep ? <CheckCircle2 className="w-6 h-6" /> : <span>{index + 1}</span>}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${index <= currentStep ? 'text-blue-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-8 shadow-xl border-none">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Complete seu Perfil</h2>
                <p className="text-sm text-slate-500">Essas informações aparecerão para os pacientes.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input defaultValue={user?.full_name} />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input placeholder="Ex: Ortodontista" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio Curta</Label>
                <Textarea placeholder="Conte um pouco sobre sua experiência..." />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Sua Disponibilidade</h2>
                <p className="text-sm text-slate-500">Defina os dias que você estará na clínica.</p>
              </div>
              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <Label className="font-bold">{day.label}</Label>
                    <Switch />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Treinamento do Sistema</h2>
                <p className="text-sm text-slate-500">Assista aos vídeos rápidos para aprender a usar o ClinicOS.</p>
              </div>
              <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <p>Vídeo de Treinamento</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Suas Tarefas</h2>
                <p className="text-sm text-slate-500">Conclua as tarefas atribuídas pelo administrador.</p>
              </div>
              <div className="space-y-3">
                {onboarding.tasks?.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="mt-1"><Circle className="w-5 h-5 text-slate-300" /></div>
                    <div>
                      <p className="font-bold text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-500">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-8"
              onClick={handleNext}
            >
              {currentStep === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
