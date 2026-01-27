import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Plus, Save, Loader2, Info, Clock,
  Bell, CheckCircle2, Send, Star, Sparkles
} from "lucide-react";
import { toast } from "sonner";

const templateTypes = {
  lembrete_24h: {
    label: "Lembrete 24h Antes",
    icon: Clock,
    color: "bg-blue-100 text-blue-700",
    defaultMessage: "Olá {nome}! 👋\n\nLembrando sua consulta marcada para amanhã:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nConfirma sua presença? Digite 1 para SIM ou 2 para NÃO."
  },
  lembrete_2h: {
    label: "Lembrete 2h Antes",
    icon: Bell,
    color: "bg-amber-100 text-amber-700",
    defaultMessage: "Oi {nome}! 🔔\n\nSua consulta é daqui a 2 horas:\n🕒 Hoje às {hora}\n👨‍⚕️ Com {profissional}\n\nJá estamos te esperando! 🏥"
  },
  confirmacao: {
    label: "Confirmação",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700",
    defaultMessage: "Olá {nome}! ✅\n\nSua consulta foi agendada:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nObrigado por escolher nossa clínica! ✨"
  },
  pos_consulta: {
    label: "Pós-Consulta",
    icon: Star,
    color: "bg-purple-100 text-purple-700",
    defaultMessage: "Olá {nome}! 💜\n\nObrigado por sua visita hoje!\n\nComo foi sua experiência? Conte-nos! 👇\n[Link de Avaliação]"
  },
  promocao: {
    label: "Promoção",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-700",
    defaultMessage: "Oi {nome}! ✨\n\nTemos uma promoção especial para você:\n\n🔥 {promocao}\n💰 Por apenas R$ {valor}\n\nResponda EU QUERO para aproveitar! 🚀"
  }
};

export default function WhatsAppSettings() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("lembrete_24h");
  const [templates, setTemplates] = useState<Record<string, string>>({});

  const { data: clinic, isLoading } = useQuery({
    queryKey: ["clinic"],
    queryFn: async () => {
      const clinics = await base44.entities.Clinic.list();
      return clinics[0] as any; // Cast to any to avoid strict type checking for now
    }
  });

  React.useEffect(() => {
    if (clinic?.whatsapp_templates) {
      setTemplates(clinic.whatsapp_templates);
    }
  }, [clinic]);

  const updateMutation = useMutation({
    mutationFn: async (newTemplates: any) => {
      if (!clinic?.id) throw new Error("Clinic ID not found");
      return base44.entities.Clinic.update(clinic.id, {
        whatsapp_templates: newTemplates
      });
    },
    onSuccess: () => {
      toast.success("Templates atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clinic"] });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(templates);
  };

  const handleTemplateChange = (type: string, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações de WhatsApp</h1>
          <p className="text-slate-500">Personalize as mensagens automáticas enviadas aos pacientes</p>
        </div>
        <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-emerald-700">API Conectada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu de Templates */}
        <div className="space-y-2">
          {Object.entries(templateTypes).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${selectedType === key
                  ? "bg-white border-primary shadow-md ring-1 ring-primary/10"
                  : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                  }`}
              >
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${selectedType === key ? "text-primary" : "text-slate-700"}`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-slate-500">Mensagem automática</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Editor de Template */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-200 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Editar: {templateTypes[selectedType].label}
                </h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500">Ativar</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-700">
                    Use as tags: <code className="bg-blue-100 px-1 rounded font-bold">{"{nome}"}</code>,
                    <code className="bg-blue-100 px-1 rounded font-bold">{"{data}"}</code>,
                    <code className="bg-blue-100 px-1 rounded font-bold">{"{hora}"}</code>,
                    <code className="bg-blue-100 px-1 rounded font-bold">{"{profissional}"}</code>
                  </p>
                </div>

                <Textarea
                  className="min-h-[200px] bg-slate-50 border-slate-200 focus:bg-white transition-all text-base leading-relaxed"
                  value={templates[selectedType] || templateTypes[selectedType].defaultMessage}
                  onChange={(e) => handleTemplateChange(selectedType, e.target.value)}
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  Enviar Teste
                </Button>
                <Button
                  className="gap-2 px-8 shadow-lg shadow-primary/20"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Template
                </Button>
              </div>
            </div>
          </Card>

          {/* Preview Mobile */}
          <div className="relative max-w-[300px] mx-auto">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full z-10 font-bold">
              Preview WhatsApp
            </div>
            <div className="bg-[#e5ddd5] rounded-[32px] p-4 border-[8px] border-slate-900 shadow-2xl">
              <div className="bg-white rounded-lg p-3 shadow-sm text-sm relative">
                <div className="whitespace-pre-wrap text-slate-800">
                  {(templates[selectedType] || templateTypes[selectedType].defaultMessage)
                    .replace("{nome}", "João Silva")
                    .replace("{data}", "15/01")
                    .replace("{hora}", "14:30")
                    .replace("{profissional}", "Dr. Ricardo")}
                </div>
                <div className="text-[10px] text-slate-400 text-right mt-1">14:30 ✓✓</div>
                <div className="absolute -left-2 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white border-b-[8px] border-b-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

