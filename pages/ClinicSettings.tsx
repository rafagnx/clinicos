import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Upload, Loader2, CheckCircle2, Instagram, Facebook, Globe, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function ClinicSettings() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      // Allow if role is admin OR specific system admin email. 
      // Note: 'admin' role check is prioritized.
      if (currentUser.role === 'admin' || currentUser.email === "rafamarketingdb@gmail.com") {
        setIsUnauthorized(false);
      } else {
        setIsUnauthorized(true);
      }
    }).catch(() => setIsUnauthorized(true));
  }, []);

  const [settings, setSettings] = useState({
    clinic_name: "",
    logo_url: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    instagram: "",
    facebook: "",
    meta_integration: {
      enabled: false,
      meta_id: "",
      whatsapp_number: "",
      access_token: "",
      api_url: "https://graph.facebook.com",
      api_version: "v20.0",
      whatsapp_account_id: ""
    }
  });

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const all = await base44.entities.ClinicSettings.list();
      return all[0] || null;
    }
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(prev => ({
        ...prev,
        ...existingSettings,
        meta_integration: existingSettings.meta_integration || prev.meta_integration
      }));
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.ClinicSettings.update(existingSettings.id, data);
      }
      return base44.entities.ClinicSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["clinic-settings"]);
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações.");
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await base44.storage.upload(file);
      setSettings(prev => ({ ...prev, logo_url: url }));
      toast.success("Logo carregada!");
    } catch (error) {
      toast.error("Erro no upload.");
    } finally {
      setUploading(false);
    }
  };

  if (isUnauthorized) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-slate-500">Apenas administradores podem alterar as configurações da clínica.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações da Clínica</h1>
        <p className="text-slate-500">Gerencie as informações públicas e integrações do seu estabelecimento</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="contact">Contato & Social</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp (Meta)</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Sua logo aparecerá em documentos e na interface do paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="relative" disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Alterar Logo
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                      accept="image/*"
                    />
                  </Button>
                  <p className="text-xs text-slate-500">Recomendado: PNG ou SVG com fundo transparente</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome da Clínica</Label>
                  <Input
                    value={settings.clinic_name}
                    onChange={e => setSettings(prev => ({ ...prev, clinic_name: e.target.value }))}
                    placeholder="Ex: Clínica Odontológica Sorriso"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço Completo</Label>
                  <Textarea
                    value={settings.address}
                    onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Comunicação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefone</Label>
                <Input
                  value={settings.phone}
                  onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> E-mail</Label>
                <Input
                  value={settings.email}
                  onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@clinica.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
                <Input
                  value={settings.website}
                  onChange={e => setSettings(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.clinica.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</Label>
                <Input
                  value={settings.instagram}
                  onChange={e => setSettings(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@usuario"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Integração WhatsApp Cloud API</CardTitle>
                  <CardDescription>Configure o envio automático de mensagens via Meta</CardDescription>
                </div>
                <Switch
                  checked={settings.meta_integration.enabled}
                  onCheckedChange={val => setSettings(prev => ({
                    ...prev,
                    meta_integration: { ...prev.meta_integration, enabled: val }
                  }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Phone Number ID</Label>
                  <Input
                    value={settings.meta_integration.whatsapp_number}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      meta_integration: { ...prev.meta_integration, whatsapp_number: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Business Account ID</Label>
                  <Input
                    value={settings.meta_integration.whatsapp_account_id}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      meta_integration: { ...prev.meta_integration, whatsapp_account_id: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Permanent Access Token</Label>
                  <Input
                    type="password"
                    value={settings.meta_integration.access_token}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      meta_integration: { ...prev.meta_integration, access_token: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="min-w-[150px]"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
