// @ts-nocheck
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2, Save, User as UserIcon, Bell, Mail, AlertCircle, MessageSquare, Tag, Star } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const USER_TYPE_LABELS = {
  profissional: "Profissional",
  secretaria: "Secretária",
  marketing: "Marketing",
  gerente: "Gerente",
  administrador: "Administrador"
};

const USER_TYPE_COLORS = {
  profissional: "bg-blue-100 text-blue-700",
  secretaria: "bg-green-100 text-green-700",
  marketing: "bg-purple-100 text-purple-700",
  gerente: "bg-indigo-100 text-indigo-700",
  administrador: "bg-slate-100 text-slate-700"
};

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    user_type: "",
    specialty: "",
    photo_url: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      setFormData({
        display_name: me.display_name || "",
        phone: me.phone || "",
        user_type: me.user_type || "profissional",
        specialty: me.specialty || "",
        photo_url: me.photo_url || ""
      });

      // Load notification preferences
      const prefs = await base44.entities.NotificationPreference.filter({ user_id: me.id });
      if (prefs.length > 0) {
        setNotificationPrefs(prefs[0]);
      } else {
        const newPrefs = await base44.entities.NotificationPreference.create({
          user_id: me.id,
          email_enabled: true,
          push_enabled: true,
          whatsapp_enabled: false,
          appointment_reminders: true,
          marketing_updates: false
        });
        setNotificationPrefs(newPrefs);
      }
    } catch (error) {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      loadUser();
    }
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationPreference.update(notificationPrefs.id, data),
    onSuccess: () => {
      toast.success("Preferências salvas!");
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await base44.storage.upload(file);
      setFormData(prev => ({ ...prev, photo_url: url }));
      await updateMutation.mutateAsync({ photo_url: url });
    } catch (error) {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={formData.photo_url} />
            <AvatarFallback className="bg-blue-50 text-blue-600 text-2xl font-bold">
              {user?.display_name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </label>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{user?.display_name || "Usuário"}</h1>
          <div className="flex items-center gap-2">
            <Badge className={USER_TYPE_COLORS[formData.user_type]}>
              {USER_TYPE_LABELS[formData.user_type]}
            </Badge>

            {/* Golden Badge for Exclusive User */}
            {user?.email === "rafamarketingdb@gmail.com" && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-amber-200/50 flex items-center gap-1 px-3 py-1 animate-in fade-in zoom-in duration-500">
                <Star className="w-3 h-3 fill-current text-white" />
                Admin
              </Badge>
            )}

            {user?.email !== "rafamarketingdb@gmail.com" && (
              <span className="text-sm text-slate-500">{user?.email}</span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1">
          <TabsTrigger value="general" className="gap-2">
            <UserIcon className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" /> Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6 space-y-6 border-slate-200/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome de Exibição</Label>
                <Input
                  value={formData.display_name}
                  onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <Select
                  value={formData.user_type}
                  onValueChange={v => setFormData(prev => ({ ...prev, user_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(USER_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input
                  value={formData.specialty}
                  onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Ex: Ortodontista"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => updateMutation.mutate(formData)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-8 border-slate-200/60 shadow-sm">
            <div className="space-y-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Canais de Comunicação
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base">E-mail</Label>
                    <p className="text-sm text-slate-500">Receba alertas importantes no seu e-mail.</p>
                  </div>
                  <Switch
                    checked={notificationPrefs?.email_enabled}
                    onCheckedChange={v => updatePrefsMutation.mutate({ email_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações Push</Label>
                    <p className="text-sm text-slate-500">Alertas em tempo real no navegador.</p>
                  </div>
                  <Switch
                    checked={notificationPrefs?.push_enabled}
                    onCheckedChange={v => updatePrefsMutation.mutate({ push_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base">WhatsApp</Label>
                    <p className="text-sm text-slate-500">Receba lembretes diretamente no celular.</p>
                  </div>
                  <Switch
                    checked={notificationPrefs?.whatsapp_enabled}
                    onCheckedChange={v => updatePrefsMutation.mutate({ whatsapp_enabled: v })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Tipos de Alerta
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">Lembretes de Consultas</Label>
                  <Switch
                    checked={notificationPrefs?.appointment_reminders}
                    onCheckedChange={v => updatePrefsMutation.mutate({ appointment_reminders: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">Novidades e Marketing</Label>
                  <Switch
                    checked={notificationPrefs?.marketing_updates}
                    onCheckedChange={v => updatePrefsMutation.mutate({ marketing_updates: v })}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
