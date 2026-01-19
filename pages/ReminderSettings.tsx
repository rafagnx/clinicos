import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function ReminderSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    reminders_enabled: true,
    reminder_24h_enabled: true,
    reminder_2h_enabled: false,
    reminder_1h_enabled: false,
    reminder_message_template: "Olá {patient_name}! Lembramos que você tem uma consulta agendada para {date} às {time} com {professional_name}."
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (currentUser.reminder_settings) {
      setSettings({ ...settings, ...currentUser.reminder_settings });
    }
    setLoading(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe({ reminder_settings: data });
    },
    onSuccess: () => {
      toast.success("Configurações de lembretes salvas!");
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações de Lembretes</h1>
        <p className="text-slate-500">Configure como e quando seus pacientes serão lembrados das consultas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-8 border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Ativar Lembretes Automáticos</Label>
              <p className="text-sm text-slate-500">O sistema enviará notificações automaticamente conforme as regras abaixo.</p>
            </div>
            <Switch 
              checked={settings.reminders_enabled} 
              onCheckedChange={(v) => setSettings({ ...settings, reminders_enabled: v })}
            />
          </div>

          <div className={`space-y-6 transition-opacity ${settings.reminders_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Regras de Envio
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <Label>Enviar 24 horas antes</Label>
                  <Switch 
                    checked={settings.reminder_24h_enabled} 
                    onCheckedChange={(v) => setSettings({ ...settings, reminder_24h_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <Label>Enviar 2 horas antes</Label>
                  <Switch 
                    checked={settings.reminder_2h_enabled} 
                    onCheckedChange={(v) => setSettings({ ...settings, reminder_2h_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <Label>Enviar 1 hora antes</Label>
                  <Switch 
                    checked={settings.reminder_1h_enabled} 
                    onCheckedChange={(v) => setSettings({ ...settings, reminder_1h_enabled: v })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Template da Mensagem</h3>
              <div className="space-y-2">
                <Textarea 
                  className="min-h-[120px] bg-slate-50 border-slate-200"
                  value={settings.reminder_message_template}
                  onChange={(e) => setSettings({ ...settings, reminder_message_template: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  {['{patient_name}', '{date}', '{time}', '{professional_name}'].map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-slate-200"
                      onClick={() => setSettings({ ...settings, reminder_message_template: settings.reminder_message_template + ' ' + tag })}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic">Clique nas tags acima para inseri-las no texto.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
