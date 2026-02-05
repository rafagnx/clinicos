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
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  MessageSquare, Plus, Save, Loader2, Info, Clock,
  Bell, CheckCircle2, Send, Star, Sparkles, Smartphone, Zap
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const templateTypes = {
  lembrete_24h: {
    label: "Lembrete 24h Antes",
    icon: Clock,
    color: "from-blue-400 to-indigo-500",
    defaultMessage: "Olá {nome}! 👋\n\nLembrando sua consulta marcada para amanhã:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nConfirma sua presença? Digite 1 para SIM ou 2 para NÃO."
  },
  lembrete_2h: {
    label: "Lembrete 2h Antes",
    icon: Bell,
    color: "from-amber-400 to-orange-500",
    defaultMessage: "Oi {nome}! 🔔\n\nSua consulta é daqui a 2 horas:\n🕒 Hoje às {hora}\n👨‍⚕️ Com {profissional}\n\nJá estamos te esperando! 🏥"
  },
  confirmacao: {
    label: "Confirmação",
    icon: CheckCircle2,
    color: "from-emerald-400 to-green-500",
    defaultMessage: "Olá {nome}! ✅\n\nSua consulta foi agendada:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nObrigado por escolher nossa clínica! ✨"
  },
  pos_consulta: {
    label: "Pós-Consulta",
    icon: Star,
    color: "from-purple-400 to-fuchsia-500",
    defaultMessage: "Olá {nome}! 💜\n\nObrigado por sua visita hoje!\n\nComo foi sua experiência? Conte-nos! 👇\n[Link de Avaliação]"
  },
  promocao: {
    label: "Promoção",
    icon: Sparkles,
    color: "from-pink-400 to-rose-500",
    defaultMessage: "Oi {nome}! ✨\n\nTemos uma promoção especial para você:\n\n🔥 {promocao}\n💰 Por apenas R$ {valor}\n\nResponda EU QUERO para aproveitar! 🚀"
  }
};

export default function WhatsAppSettings() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4 md:p-10 max-w-[1600px] mx-auto space-y-4 min-h-screen relative overflow-hidden flex flex-col")}>

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest mb-1">
            <Zap className="w-2.5 h-2.5" /> AUTOMAÇÃO
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            WHATSAPP <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">INTELLIGENCE</span>
          </h1>
          <p className={cn("text-sm font-medium max-w-lg", isDark ? "text-slate-400" : "text-slate-600")}>
            Personalize a experiência de comunicação automática com seus pacientes.
          </p>
        </div>

        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl border transition-all hover:scale-105",
          isDark ? "bg-emerald-950/20 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
        )}>
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse relative z-10" />
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50" />
          </div>
          <div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest block", isDark ? "text-emerald-400" : "text-emerald-700")}>API Conectada</span>
            <span className={cn("text-[8px] block opacity-70", isDark ? "text-emerald-300" : "text-emerald-600")}>Funcionando Normalmente</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Menu de Templates */}
        <div className="space-y-3">
          {Object.entries(templateTypes).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = selectedType === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                  isSelected
                    ? (isDark ? "bg-slate-800 border-indigo-500/50" : "bg-white border-indigo-200 shadow-xl shadow-indigo-500/10")
                    : (isDark ? "bg-slate-900/40 border-white/5 hover:bg-slate-800" : "bg-white/40 border-white/40 hover:bg-white/60")
                )}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500" />
                )}

                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110 duration-500",
                  config.color,
                  "text-white"
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="text-left flex-1">
                  <p className={cn(
                    "font-black text-sm tracking-tight transition-colors",
                    isSelected
                      ? (isDark ? "text-white" : "text-slate-900")
                      : (isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-500 group-hover:text-slate-700")
                  )}>
                    {config.label}
                  </p>
                  <p className={cn("text-[10px] uppercase tracking-widest opacity-60", isDark ? "text-slate-500" : "text-slate-400")}>Automático</p>
                </div>

                {isSelected && <Sparkles className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* Editor de Template */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-8 rounded-[2rem] glass-premium border-white/10 relative overflow-hidden",
              isDark ? "bg-slate-950/40 shadow-none" : "bg-white/60 shadow-2xl shadow-indigo-500/5"
            )}
          >
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn("text-xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                    Editar: {templateTypes[selectedType].label}
                  </h3>
                  <p className={cn("text-xs font-medium opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>
                    Personalize a mensagem que seu paciente irá receber.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full pr-4 border border-slate-200 dark:border-slate-800">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600")}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <Label className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Ativar</Label>
                  <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  <div className={cn(
                    "p-4 rounded-xl border flex gap-3 text-xs leading-relaxed",
                    isDark ? "bg-blue-900/20 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-700"
                  )}>
                    <Info className="w-5 h-5 shrink-0 opacity-70" />
                    <div>
                      <p className="font-bold mb-2 uppercase tracking-wide opacity-80">Variáveis Disponíveis</p>
                      <div className="flex flex-wrap gap-2">
                        {["{nome}", "{data}", "{hora}", "{profissional}"].map(tag => (
                          <code key={tag} className={cn("px-1.5 py-0.5 rounded-md font-mono font-bold", isDark ? "bg-blue-500/20 text-blue-200" : "bg-blue-100 text-blue-800")}>{tag}</code>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Textarea
                    className={cn(
                      "min-h-[300px] border-0 p-6 text-base leading-relaxed rounded-2xl resize-none focus-visible:ring-0 transition-all font-medium",
                      isDark
                        ? "bg-slate-900/50 text-slate-200 placeholder:text-slate-700 focus:bg-slate-900"
                        : "bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:bg-white shadow-inner"
                    )}
                    value={templates[selectedType] || templateTypes[selectedType].defaultMessage}
                    onChange={(e) => handleTemplateChange(selectedType, e.target.value)}
                  />
                </div>

                {/* Phone Preview */}
                <div className="hidden xl:block w-[300px] shrink-0">
                  <div className="relative mx-auto mt-4">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full z-20 uppercase tracking-widest shadow-lg">Preview</div>
                    <div className="bg-slate-800 rounded-[2.5rem] p-3 border-[6px] border-slate-900 shadow-2xl relative overflow-hidden h-[500px]">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

                      {/* Screen */}
                      <div className="bg-[#111b21] w-full h-full rounded-[2rem] overflow-hidden relative font-sans">
                        {/* Chat Header */}
                        <div className="bg-[#202c33] p-3 flex items-center gap-2 pt-8">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">CO</div>
                          <div className="text-white text-xs font-medium">ClinicOS</div>
                        </div>

                        {/* Chat Bg */}
                        <div className="absolute inset-0 top-16 opacity-10" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>

                        {/* Bubble */}
                        <div className="relative z-10 p-4 pt-8">
                          <div className="bg-[#005c4b] p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] ml-0">
                            <p className="text-white text-[13px] leading-snug whitespace-pre-wrap">
                              {(templates[selectedType] || templateTypes[selectedType].defaultMessage)
                                .replace("{nome}", "João")
                                .replace("{data}", "15/01")
                                .replace("{hora}", "14:30")
                                .replace("{profissional}", "Dr. Rafael")}
                            </p>
                            <div className="text-[10px] text-white/50 text-right mt-1 flex justify-end gap-1">
                              14:30 <span className="text-blue-400">✓✓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                <Button variant="ghost" className="gap-2 text-xs font-bold uppercase tracking-wide opacity-50 hover:opacity-100">
                  <Send className="w-3.5 h-3.5" /> Enviar Teste
                </Button>
                <Button
                  className="gap-2 px-8 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/20 font-bold uppercase tracking-widest text-xs transition-transform active:scale-95"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}




