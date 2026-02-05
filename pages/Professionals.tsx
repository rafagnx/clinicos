import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { motion } from "framer-motion";
import { Link, useOutletContext } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Icons
import {
  UserPlus, Stethoscope, Phone, Mail, Edit2, Trash2, MoreVertical,
  Loader2, Camera, Users, Shield, CheckCircle, Sparkles, Building
} from "lucide-react";

// Constants
const COLORS = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#F59E0B", label: "Laranja" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#06B6D4", label: "Ciano" },
];

export default function Professionals() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "", role_type: "profissional", specialty: "", council_number: "", council_state: "",
    phone: "", email: "", color: "#3B82F6", appointment_duration: 30, status: "ativo", photo_url: "",
    is_admin: false
  });

  // Fetch Current User
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  // Fetch Professionals
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const data = await base44.list("Professional", {
        sort: [{ field: "full_name", direction: "asc" }]
      });
      return data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Professional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsFormOpen(false);
      resetForm();
      toast.success("Profissional cadastrado!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao cadastrar profissional");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number, data: any }) => base44.entities.Professional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsFormOpen(false);
      resetForm();
      toast.success("Cadastro atualizado!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao atualizar cadastro");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => base44.entities.Professional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional excluído!");
    }
  });

  const resetForm = () => {
    setFormData({
      full_name: "", role_type: "profissional", specialty: "", council_number: "", council_state: "",
      phone: "", email: "", color: "#3B82F6", appointment_duration: 30, status: "ativo", photo_url: "",
      is_admin: false
    });
    setEditing(null);
  };

  const isAdmin = user?.role?.toLowerCase()?.includes("admin") ||
    user?.role?.toLowerCase()?.includes("gerente") ||
    user?.role === "admin" ||
    user?.role === "owner" ||
    user?.email === "rafamarketingdb@gmail.com" ||
    user?.user_metadata?.role === "admin";

  const getRoleLabel = (roleType: string) => {
    const labels: Record<string, string> = {
      hof: "HOF",
      biomedico: "Biomédico",
      profissional: "Profissional",
      secretaria: "Secretária",
      marketing: "Marketing",
      gerente: "Gerente",
      outro: "Outro"
    };
    return labels[roleType] || roleType;
  };

  const handleEdit = (prof: any) => {
    setEditing(prof);
    setFormData(prof);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const file_url = await base44.storage.upload(file);
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    } catch (err) {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("p-4 lg:p-4 max-w-[1600px] mx-auto space-y-4 min-h-screen relative overflow-hidden flex flex-col")}>

      {/* BACKGROUND KINETIC ENGINE */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-mesh animate-mesh opacity-[0.05]"></div>
      </div>

      {/* Header Liquid Scale */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1 backdrop-blur-md">
            <Users className="w-2.5 h-2.5" /> GESTÃO DE EQUIPE
          </div>
          <h1 className={cn("text-3xl md:text-5xl font-black mb-1 tracking-tighter leading-[0.85] filter drop-shadow-sm", isDark ? "text-white" : "text-slate-900")}>
            MEMBROS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient-x select-none">CLÍNICOS</span>
          </h1>
          <p className={cn("text-xs md:text-sm font-bold tracking-tight opacity-60 flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Configure os acessos e perfis da sua equipe de alta performance.
          </p>
        </div>

        {(isAdmin || professionals.length === 0) && (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setIsInviteOpen(true)}
              variant="outline"
              className={cn(
                "h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all glass-premium border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/40 shadow-lg shadow-emerald-500/5",
                isDark ? "bg-emerald-950/20 text-emerald-400" : "bg-emerald-50/50"
              )}
            >
              <Phone className="w-4 h-4 mr-2" />
              Convidar via WhatsApp
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setIsFormOpen(true);
              }}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden border border-white/20"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <UserPlus className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">Novo Membro</span>
            </Button>
          </div>
        )}
      </motion.div>

      {/* List / Grid Liquid Scale */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50 relative z-10">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Sincronizando equipe...</p>
        </div>
      ) : professionals.length === 0 ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-32 rounded-[2.5rem] border-2 border-dashed relative z-10 transition-colors backdrop-blur-sm",
          isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white/50"
        )}>
          <div className={cn(
            "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl skew-y-3 transform transition-transform hover:skew-y-0 duration-500",
            isDark ? "bg-slate-800 shadow-black/20" : "bg-white shadow-slate-200"
          )}>
            <Users className={cn("w-10 h-10", isDark ? "text-slate-600" : "text-slate-300")} />
          </div>
          <h3 className={cn("text-2xl font-black mb-2 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Nenhum membro encontrado
          </h3>
          <p className={cn("text-xs font-bold uppercase tracking-widest opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>
            Sua equipe ainda não possui cadastros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {professionals.map((prof: any, i: number) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group relative overflow-hidden rounded-[2rem] glass-premium border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20 cursor-pointer",
                isDark ? "bg-slate-900/40" : "bg-white/60"
              )}
              onClick={() => (isAdmin || prof.email === user?.email) && handleEdit(prof)}
            >
              {/* Dynamic Gradient Background based on card color */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(to bottom right, ${prof.color || "#3B82F6"}, transparent)` }}
              />

              <div className="p-8 space-y-6 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="relative">
                    <div
                      className="p-1 rounded-full transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-2xl"
                      style={{ background: `linear-gradient(135deg, ${prof.color || "#3B82F6"}, transparent)` }}
                    >
                      <Avatar className="h-16 w-16 border-[3px] border-white dark:border-slate-950 shadow-inner">
                        <AvatarImage src={prof.photo_url} className="object-cover" />
                        <AvatarFallback className="text-white font-black text-xl" style={{ backgroundColor: prof.color || "#3B82F6" }}>
                          {prof.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Status Kinetic Dot */}
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                      {prof.status === 'ativo' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                      <span className={cn(
                        "relative inline-flex rounded-full h-5 w-5 border-2 border-white dark:border-slate-950",
                        prof.status === 'ativo' ? 'bg-emerald-500' : (prof.status === 'convidado' ? 'bg-amber-500' : 'bg-slate-400')
                      )}></span>
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 pt-1">
                    <div className="flex items-start justify-between">
                      <h3 className={cn("font-black text-xl tracking-tight truncate leading-tight transition-colors group-hover:text-blue-500", isDark ? "text-white" : "text-slate-900")}>
                        {prof.full_name}
                      </h3>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/20 -mt-1 -mr-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={cn("rounded-2xl border-white/5 p-2 min-w-[180px]", isDark ? "bg-slate-900 text-slate-200" : "bg-white/90 backdrop-blur-xl")}>
                          {(isAdmin || prof.email === user?.email) && (
                            <DropdownMenuItem onClick={() => handleEdit(prof)} className="gap-3 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">
                              <Edit2 className="w-3.5 h-3.5" /> Editar Perfil
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => confirm(`Excluir ${prof.full_name}?`) && deleteMutation.mutate(prof.id)}
                              className="gap-3 p-2.5 rounded-xl text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Desativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={cn(
                        "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm",
                        isDark ? "bg-slate-800/50 border-white/10 text-slate-300" : "bg-white/50 border-slate-200 text-slate-600"
                      )}>
                        {getRoleLabel(prof.role_type)}
                      </div>

                      {prof.is_admin && (
                        <div className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-amber-950 border-0 shadow-lg shadow-amber-500/20 flex items-center gap-1">
                          <Shield className="w-2 h-2 fill-current" /> GESTOR
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-dashed border-slate-200 dark:border-slate-800/60">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">Especialidade</span>
                    <span className={cn("text-[11px] font-black flex items-center gap-1.5 opacity-80", isDark ? "text-slate-200" : "text-slate-700")}>
                      <Stethoscope className="w-3 h-3 text-blue-500" />
                      {prof.specialty || "NÃO INFORMADA"}
                    </span>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">Conselho</span>
                    <span className={cn("text-[11px] font-black opacity-80 flex items-center justify-end gap-1.5", isDark ? "text-slate-200" : "text-slate-700")}>
                      {prof.council_number ? `${prof.council_number}${prof.council_state ? `/${prof.council_state}` : ''}` : "N/A"}
                      <Building className="w-3 h-3 text-indigo-500" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">WhatsApp</span>
                    <span className={cn("text-[11px] font-bold flex items-center gap-1.5 transition-colors group-hover:text-emerald-500 truncate", isDark ? "text-slate-300" : "text-slate-600")}>
                      <Phone className="w-3 h-3 opacity-50" />
                      {prof.phone || "---"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5 text-right">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">E-mail</span>
                    <span className={cn("text-[11px] font-bold flex items-center justify-end gap-1.5 truncate", isDark ? "text-slate-300" : "text-slate-600")}>
                      <Mail className="w-3 h-3 opacity-50" />
                      {prof.email ? prof.email.split('@')[0] : "---"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Sheet - Liquid Style */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className={cn("w-full sm:max-w-md overflow-y-auto border-l backdrop-blur-2xl", isDark ? "bg-slate-950/90 border-white/10" : "bg-white/90 border-slate-200")}>
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                {editing ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              {editing ? "Editar Membro" : "Novo Membro"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo */}
            <div className="flex justify-center py-4">
              <div className="relative group">
                <div className={cn("w-28 h-28 rounded-full p-1 border-2 border-dashed flex items-center justify-center transition-all", isDark ? "border-slate-700" : "border-slate-300")}>
                  <Avatar className="h-24 w-24 border-4 border-transparent">
                    <AvatarImage src={formData.photo_url} className="object-cover" />
                    <AvatarFallback style={{ backgroundColor: formData.color }} className="text-white text-3xl font-black">
                      {formData.full_name?.charAt(0).toUpperCase() || <Camera className="w-8 h-8 opacity-50" />}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <label className="absolute bottom-0 right-0 p-3 bg-blue-600 rounded-2xl cursor-pointer hover:bg-blue-500 hover:scale-110 shadow-lg shadow-blue-600/30 transition-all text-white active:scale-95">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Função na Clínica Classification</Label>
                <Select value={formData.role_type} onValueChange={(v) => setFormData(p => ({ ...p, role_type: v }))}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hof">HOF</SelectItem>
                    <SelectItem value="biomedico">Biomédico</SelectItem>
                    <SelectItem value="profissional">Profissional (Outro)</SelectItem>
                    <SelectItem value="secretaria">Secretária</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  required
                  className="h-12 rounded-xl"
                  placeholder="Nome do membro"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">{(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") ? "Especialidade" : "Cargo/Função"}</Label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData(p => ({ ...p, specialty: e.target.value }))}
                  placeholder={(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") ? "Ex: Cardiologia" : "Ex: Recepcionista"}
                  required={(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico")}
                  className="h-12 rounded-xl"
                />
              </div>

              {(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-70">Conselho (CRM/CRO)</Label>
                    <Input
                      value={formData.council_number}
                      onChange={(e) => setFormData(p => ({ ...p, council_number: e.target.value }))}
                      placeholder="123456"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-70">Estado (UF)</Label>
                    <Input
                      value={formData.council_state}
                      onChange={(e) => setFormData(p => ({ ...p, council_state: e.target.value }))}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-70">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-70">E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@clinica.com"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              {(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-70">Cor na Agenda</Label>
                    <Select value={formData.color} onValueChange={(v) => setFormData(p => ({ ...p, color: v }))}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: formData.color }} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-70">Duração (min)</Label>
                    <Input
                      type="number"
                      value={formData.appointment_duration}
                      onChange={(e) => setFormData(p => ({ ...p, appointment_duration: parseInt(e.target.value) }))}
                      min={10}
                      max={180}
                      className="h-12 rounded-xl text-center font-bold"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-70">Acesso de Gestor</Label>
                  <p className="text-[10px] text-slate-500 font-medium">Permite editar configurações e equipe</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData(p => ({ ...p, is_admin: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-auto">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl h-12 px-6">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-500/20" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar Alterações" : "Cadastrar Membro"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Invite Dialog (New Simplified Flow) */}
      <InviteMemberDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div >
  );
}

// Sub-component for Invite Dialog (Matches Super Admin Style)
function InviteMemberDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [loading, setLoading] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");
  const [step, setStep] = React.useState(1); // 1 = form, 2 = success

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://clinicos-it4q.onrender.com';
      const orgId = localStorage.getItem('active-org-id');

      // Create Invite on backend
      const res = await fetch(`${apiUrl}/api/admin/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-organization-id': orgId || ''
        },
        body: JSON.stringify({
          email,
          role,
          organizationId: orgId,
          whatsapp: phone.replace(/\D/g, '')
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao criar convite");
      }

      // Build invite link
      const frontendUrl = window.location.origin;
      const link = `${frontendUrl}/register?token=${result.token}`;
      setInviteLink(link);
      setStep(2);
      toast.success("Convite criado!");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! 👋\n\nVocê foi convidado para fazer parte da nossa equipe no ClinicOS.\n\nClique no link abaixo para criar sua conta:\n${inviteLink}`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copiado!");
  };

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setInviteLink("");
      setEmail("");
      setPhone("");
      setRole("member");
      setLoading(false);
      setStep(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">{step === 1 ? "Convidar Membro" : "🎉 Convite Pronto!"}</DialogTitle>
          {step === 1 && (
            <DialogDescription className="text-center">
              Crie um link de convite para enviar via WhatsApp.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleInvite} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">WhatsApp do Convidado *</Label>
              <Input
                required
                placeholder="55 22 99999-9999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              <p className="text-[10px] text-slate-400 font-medium">Número com DDD (código do país é opcional)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">E-mail (Opcional)</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nível de Acesso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro (Padrão)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12">Cancelar</Button>
              <Button
                type="submit"
                className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-green-500/20"
                disabled={loading || !phone}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                Gerar Convite
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 p-6 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full text-white shadow-lg shadow-green-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-lg leading-tight">Convite gerado!</p>
                <p className="text-xs opacity-80 mt-1">O link foi criado com sucesso.</p>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs break-all text-slate-500 font-mono select-all">
              {inviteLink}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-lg h-14 rounded-2xl font-bold shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-transform"
                onClick={openWhatsApp}
              >
                <Phone className="w-5 h-5 mr-3" />
                Enviar pelo WhatsApp
              </Button>
              <Button variant="outline" onClick={copyToClipboard} className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold">
                Copiar Link
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-slate-400">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



