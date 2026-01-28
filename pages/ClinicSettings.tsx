import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Upload, Loader2, CheckCircle2, Instagram, Facebook, Globe, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";

export default function ClinicSettings() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      try {
        setCheckingAuth(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // 1. Global Super Admin Bypass
        if (currentUser.role === 'admin' || currentUser.email === "rafamarketingdb@gmail.com" || currentUser.email === "marketingorofacial@gmail.com") {
          setIsUnauthorized(false);
          return;
        }

        // 2. Organization Admin (Check via Backend API)
        if (currentUser.active_organization_id) {
          // Fetch fresh membership data from backend
          const userOrgs = await base44.auth.getUserOrganizations();

          // Find current org membership
          const currentMembership = userOrgs.find((o: any) =>
            o.organizationId === currentUser.active_organization_id ||
            o.id === currentUser.active_organization_id // Handle potential ID mismatch in future
          );

          if (currentMembership) {
            const role = currentMembership.role?.toLowerCase() || '';
            if (['admin', 'owner', 'administrador', 'administrator'].includes(role)) {
              setIsUnauthorized(false);
              return;
            }
          }
        }

        // If none matched -> Unauthorized
        console.warn("User unauthorized for settings. Role:", currentUser.role);
        setIsUnauthorized(true);

      } catch (err) {
        console.error("Auth check failed", err);
        setIsUnauthorized(true);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkPermission();
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

  const { data: organization } = useQuery({
    queryKey: ["active-org-details", user?.active_organization_id],
    queryFn: async () => {
      if (!user?.active_organization_id) return null;
      const orgs = await base44.auth.getUserOrganizations();
      return orgs.find((o: any) => o.organizationId === user.active_organization_id || o.id === user.active_organization_id);
    },
    enabled: !!user?.active_organization_id
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

  const getStatusLabel = () => {
    if (organization?.subscription_status === 'active') return <span className="text-green-600 font-bold">ATIVO</span>;
    if (organization?.subscription_status === 'manual_override') return <span className="text-amber-600 font-bold">PRO (Manual)</span>;
    if (user?.email === 'rafamarketingdb@gmail.com') return <span className="text-purple-600 font-bold">MASTER</span>;
    if (user?.email === 'marketingorofacial@gmail.com') return <span className="text-pink-600 font-bold">PRO (Partner)</span>;
    return "Aguardando Assinatura";
  };

  const saveMutation = useMutation<any, Error, any>({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.ClinicSettings.update(existingSettings.id, data);
      }
      return base44.entities.ClinicSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      console.error("ClinicSettings Save Error:", error);
      const msg = error?.message || "Erro desconhecido";
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        toast.error("Sessão expirada. Recarregue a página.");
      } else {
        toast.error(`Erro ao salvar: ${msg}`);
      }
    }
  });

  const handleLogoUpload = async (e: any) => {
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

  const handleSubscribe = async () => {
    if (!user?.email) return toast.error("Email não encontrado");

    const loadingToast = toast.loading("Iniciando checkout...");
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: user?.active_organization_id || user?.id, // Fallback to user ID if no org
          email: user?.email
        })
      });
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao iniciar checkout: " + (data.error || "Desconhecido"));
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error("Erro de conexão");
    }
  };

  const handlePortal = () => {
    // TODO: Implement portal session fetch
    toast.info("Gerenciamento de assinatura em breve.");
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

  if (isLoading || checkingAuth) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={cn("p-4 lg:p-8 max-w-5xl mx-auto space-y-8", isDark ? "text-slate-100" : "")}>
      <div>
        <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>Configurações da Clínica</h1>
        <p className={cn(isDark ? "text-slate-400" : "text-slate-500")}>Gerencie as informações públicas e integrações do seu estabelecimento</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="contact">Contato & Social</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp (Meta)</TabsTrigger>
          <TabsTrigger value="billing">Assinatura</TabsTrigger>
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

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano e Assinatura</CardTitle>
              <CardDescription>Gerencie seu plano de acesso ao ClinicOS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6", isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200")}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">ClinicOS PRO</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Acesso completo + 7 Dias Grátis</p>
                    <div className="mt-2 text-xs font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                      Status: {getStatusLabel()}
                    </div>
                  </div>
                </div>

                {organization?.subscription_status !== 'active' && organization?.subscription_status !== 'manual_override' && user?.email !== 'rafamarketingdb@gmail.com' && user?.email !== 'marketingorofacial@gmail.com' && (
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <Button
                      onClick={handleSubscribe}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20"
                    >
                      Assinar Agora (Teste Grátis)
                    </Button>
                    <Button variant="outline" onClick={handlePortal}>
                      Gerenciar Faturas
                    </Button>
                  </div>
                )}
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

