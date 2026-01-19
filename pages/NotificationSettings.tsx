import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, MessageSquare, Calendar, Users, Tag, 
  AlertCircle, Mail, Moon, Save, Loader2, X
} from "lucide-react";
import { toast } from "sonner";

const notificationTypes = [
  {
    key: "appointment_reminders",
    label: "Lembretes de Consultas",
    description: "Receba lembretes antes das consultas agendadas",
    icon: Calendar,
    color: "text-blue-600"
  },
  {
    key: "appointment_confirmations",
    label: "Confirmações de Agendamento",
    description: "Notificações quando consultas são agendadas ou alteradas",
    icon: Calendar,
    color: "text-green-600"
  },
  {
    key: "patient_followup",
    label: "Acompanhamento de Pacientes",
    description: "Lembretes para acompanhar pacientes após consultas",
    icon: Users,
    color: "text-purple-600"
  },
  {
    key: "chat_messages",
    label: "Mensagens do Chat",
    description: "Notificações de novas mensagens no chat interno",
    icon: MessageSquare,
    color: "text-indigo-600"
  },
  {
    key: "promotion_updates",
    label: "Atualizações de Promoções",
    description: "Novidades sobre promoções e interesses de pacientes",
    icon: Tag,
    color: "text-amber-600"
  },
  {
    key: "system_alerts",
    label: "Alertas do Sistema",
    description: "Avisos importantes sobre sua conta e segurança",
    icon: AlertCircle,
    color: "text-rose-600"
  }
];

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    quiet_hours: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    preferences: {}
  });

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      if (currentUser.notification_settings) {
        setSettings(prev => ({
          ...prev,
          ...currentUser.notification_settings,
          preferences: currentUser.notification_settings.preferences || {}
        }));
      }
    }).catch(() => {});
  }, []);

  const saveMutation = useMutation({
    mutationFn: (newSettings) => base44.auth.updateMe({ 
      notification_settings: newSettings 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Preferências de notificação salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar preferências.");
    }
  });

  const togglePreference = (key) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações de Notificação</h1>
          <p className="text-slate-500">Escolha como e quando você quer ser notificado</p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card className="divide-y divide-slate-100">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = settings.preferences[type.key] !== false; // Default to true
              
              return (
                <div key={type.key} className="p-6 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100 ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-bold text-slate-900">{type.label}</Label>
                      <p className="text-sm text-slate-500 leading-relaxed">{type.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isEnabled}
                    onCheckedChange={() => togglePreference(type.key)}
                  />
                </div>
              );
            })}
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Canais de Entrega
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-mail</Label>
                  <p className="text-xs text-slate-500">Resumos e alertas por e-mail</p>
                </div>
                <Switch 
                  checked={settings.email_notifications}
                  onCheckedChange={val => setSettings(prev => ({ ...prev, email_notifications: val }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push (Navegador)</Label>
                  <p className="text-xs text-slate-500">Alertas em tempo real</p>
                </div>
                <Switch 
                  checked={settings.push_notifications}
                  onCheckedChange={val => setSettings(prev => ({ ...prev, push_notifications: val }))}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                Horário de Silêncio
              </h3>
              <Switch 
                checked={settings.quiet_hours}
                onCheckedChange={val => setSettings(prev => ({ ...prev, quiet_hours: val }))}
              />
            </div>
            <p className="text-xs text-slate-500">Não receber notificações push durante este período</p>
            
            {settings.quiet_hours && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Início</Label>
                  <Input 
                    type="time" 
                    value={settings.quiet_hours_start}
                    onChange={e => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Fim</Label>
                  <Input 
                    type="time" 
                    value={settings.quiet_hours_end}
                    onChange={e => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
            <Bell className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Dica:</strong> Você também pode silenciar notificações específicas diretamente no sino de notificações do cabeçalho.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
