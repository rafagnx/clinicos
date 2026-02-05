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
import { Building2, Upload, Loader2, CheckCircle2, Instagram, Facebook, Globe, Mail, Phone, MapPin, CreditCard, Download, Settings, Database, FileSpreadsheet, Lock, AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabaseClient";
import { ExportService } from "@/services/ExportService";

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
    if (organization?.subscription_status === 'active') return <span className="text-emerald-500 font-black">ATIVO</span>;
    if (organization?.subscription_status === 'manual_override') return <span className="text-amber-500 font-black">PRO (Manual)</span>;
    if (user?.email === 'rafamarketingdb@gmail.com') return <span className="text-purple-500 font-black">MASTER</span>;
    if (user?.email === 'marketingorofacial@gmail.com' || user?.email === 'kriscilainemiranda@gmail.com') return <span className="text-pink-500 font-black">PRO (Partner)</span>;
    if (organization?.name?.toLowerCase()?.includes('orofacial')) return <span className="text-pink-500 font-black">PRO (Partner)</span>;
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

  const handleExportPatients = async () => {
    try {
      toast.info("Gerando CSV de pacientes...");
      const res = await ExportService.exportPatients();
      toast.success(`Exportação concluída! ${res.count} pacientes exportados.`);
    } catch (e) {
      toast.error("Erro ao exportar pacientes.");
    }
  };

  const handleBackup = async () => {
    try {
      toast.info("Gerando backup completo do sistema...");
      const res = await ExportService.exportFullBackup();
      toast.success("Backup completo baixado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar backup.");
    }
  };

  if (isUnauthorized) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 bg-rose-500/10 rounded-full">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-xl font-black">Acesso Restrito</h2>
        <p className="text-slate-500 text-center max-w-sm">Apenas administradores podem alterar as configurações da clínica.</p>
      </div>
    );
  }

  if (isLoading || checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Carregando sistema...</p>
      </div>
    );
  }

  const tabTriggerClass = cn(
    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white",
    "data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30",
    "rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all duration-300",
    isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
  );

  return (
    <div className={cn("p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen relative overflow-hidden flex flex-col", isDark ? "text-slate-100" : "")}>

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">
            <Settings className="w-2.5 h-2.5" /> GESTÃO
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            CONFIGURAÇÕES <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-gray-500">DA CLÍNICA</span>
          </h1>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
            Gerencie as informações públicas e integrações do seu estabelecimento.
          </p>
        </div>

        {organization?.ownerEmail && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border",
            isDark ? "bg-slate-900/50 border-white/5" : "bg-white/50 border-slate-200"
          )}>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">PROPRIETÁRIO:</span>
            <span className="text-xs font-bold">{organization.ownerEmail}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-8 relative z-10">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className={cn("h-auto gap-2 p-1 bg-transparent")}>
            <TabsTrigger value="general" className={tabTriggerClass}>Geral</TabsTrigger>
            <TabsTrigger value="contact" className={tabTriggerClass}>Contato & Social</TabsTrigger>
            <TabsTrigger value="whatsapp" className={tabTriggerClass}>WhatsApp (Meta)</TabsTrigger>
            <TabsTrigger value="billing" className={tabTriggerClass}>Assinatura</TabsTrigger>
            <TabsTrigger value="data" className={tabTriggerClass}>Dados</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-8 rounded-[2rem] glass-premium border-white/10 relative overflow-hidden", isDark ? "bg-slate-950/40" : "bg-white/60")}
          >
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center space-y-4">
                <div className={cn(
                  "w-40 h-40 rounded-3xl border-4 border-dashed flex items-center justify-center overflow-hidden relative group transition-all",
                  isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
                )}>
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <Building2 className={cn("w-12 h-12 opacity-20", isDark ? "text-white" : "text-black")} />
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer flex flex-col items-center text-white">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Alterar</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleLogoUpload}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
                <p className="text-[10px] text-center max-w-[150px] opacity-50">PNG ou SVG transparente. Máx 2MB.</p>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nome da Clínica</Label>
                  <Input
                    value={settings.clinic_name}
                    onChange={e => setSettings(prev => ({ ...prev, clinic_name: e.target.value }))}
                    className={cn("h-12 text-lg font-bold", isDark ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-200")}
                    placeholder="Ex: Clínica Odontológica Sorriso"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-70">Endereço Completo</Label>
                  <Textarea
                    value={settings.address}
                    onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    className={cn("min-h-[100px] text-base font-medium resize-none", isDark ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-200")}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { icon: Phone, label: "Telefone", field: "phone", placeholder: "(00) 00000-0000" },
              { icon: Mail, label: "E-mail", field: "email", placeholder: "contato@clinica.com" },
              { icon: Globe, label: "Website", field: "website", placeholder: "https://www.clinica.com" },
              { icon: Instagram, label: "Instagram", field: "instagram", placeholder: "@usuario" }
            ].map((item, i) => (
              <div key={i} className={cn("p-6 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", isDark ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600")}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">{item.label}</Label>
                  <Input
                    value={settings[item.field as keyof typeof settings] as string}
                    onChange={e => setSettings(prev => ({ ...prev, [item.field]: e.target.value }))}
                    className="bg-transparent border-0 h-auto p-0 text-sm font-bold shadow-none focus-visible:ring-0"
                    placeholder={item.placeholder}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-8 rounded-[2rem] border relative overflow-hidden", isDark ? "bg-slate-950/40 border-slate-800" : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100")}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">WhatsApp Cloud API</h3>
                  <p className="text-sm opacity-60">Integração oficial Meta</p>
                </div>
              </div>
              <Switch
                checked={settings.meta_integration.enabled}
                onCheckedChange={val => setSettings(prev => ({
                  ...prev,
                  meta_integration: { ...prev.meta_integration, enabled: val }
                }))}
                className="data-[state=checked]:bg-[#25D366]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 opacity-90">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Phone Number ID</Label>
                <Input
                  value={settings.meta_integration.whatsapp_number}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    meta_integration: { ...prev.meta_integration, whatsapp_number: e.target.value }
                  }))}
                  className={cn("bg-white/50", isDark ? "bg-slate-900/50" : "")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Business Account ID</Label>
                <Input
                  value={settings.meta_integration.whatsapp_account_id}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    meta_integration: { ...prev.meta_integration, whatsapp_account_id: e.target.value }
                  }))}
                  className={cn("bg-white/50", isDark ? "bg-slate-900/50" : "")}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Permanent Access Token</Label>
                <Input
                  type="password"
                  value={settings.meta_integration.access_token}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    meta_integration: { ...prev.meta_integration, access_token: e.target.value }
                  }))}
                  className={cn("bg-white/50 font-mono text-xs", isDark ? "bg-slate-900/50" : "")}
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-8 rounded-[2rem] border relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50")}
          >
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-2xl tracking-tight">ClinicOS PRO</h3>
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-widest">Premium</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Status: {getStatusLabel()}</span>
                  </div>
                </div>
              </div>

              {organization?.subscription_status !== 'active' && organization?.subscription_status !== 'manual_override' && user?.email !== 'rafamarketingdb@gmail.com' && user?.email !== 'marketingorofacial@gmail.com' && user?.email !== 'kriscilainemiranda@gmail.com' && !organization?.name?.toLowerCase()?.includes('orofacial') && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubscribe}
                    className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                  >
                    Assinar Agora
                  </Button>
                  <Button variant="outline" className="h-12 px-6 rounded-xl" onClick={handlePortal}>
                    Faturas
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Exportar Pacientes", desc: "Baixe uma lista completa em CSV.", icon: FileSpreadsheet, action: handleExportPatients, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { title: "Backup Completo", desc: "Download de segurança em JSON.", icon: Database, action: handleBackup, color: "text-indigo-500", bg: "bg-indigo-500/10" }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className={cn("p-6 rounded-2xl border cursor-pointer group", isDark ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg")}
                onClick={item.action}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", item.bg, item.color)}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <Download className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm opacity-60 mb-4">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>

      </Tabs>

      <div className="flex justify-end pt-6 border-t border-white/10 relative z-10">
        <Button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="h-12 px-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

