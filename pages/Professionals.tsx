// @ts-nocheck
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Stethoscope, Phone, Mail, Edit2, Trash2, MoreVertical, Loader2, Camera, Users, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const COLORS = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#F59E0B", label: "Laranja" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#06B6D4", label: "Ciano" },
];

export default function Professionals() {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "", role_type: "profissional", specialty: "", council_number: "", council_state: "",
    phone: "", email: "", color: "#3B82F6", appointment_duration: 30, status: "ativo", photo_url: ""
  });
  const [inviteLink, setInviteLink] = useState("");
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      console.log("Fetching professionals for Equipe page...");
      const data = await base44.list("Professional", {
        sort: [{ field: "full_name", direction: "asc" }]
      });
      console.log("Professionals fetched:", data);
      return data;
    }
  });



  React.useEffect(() => {
    if (!user || isLoading || !professionals) return;

    // Check if user already exists as Professional
    const activeOrg = localStorage.getItem("active-org-id");
    if (!activeOrg) return; // Do not auto-create if no org context

    /*
    const existingProf = professionals.find(p => p.email === user.email);
    if (!existingProf) {
      // Auto-create Professional record for current user
      base44.entities.Professional.create({
        full_name: user.display_name || user.full_name || user.email,
        email: user.email,
        role_type: user.user_type || "profissional",
        specialty: user.user_type === "profissional" ? "Médico" : "",
        color: "#3B82F6",
        appointment_duration: 30,
        status: "ativo",
        is_active: true,
        photo_url: user.photo_url || "",
        is_admin: user.role === "admin"
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["professionals"] });
      }).catch(() => { });
    } else if (existingProf.is_admin !== (user.role === "admin")) {
      // Update is_admin if changed
      base44.entities.Professional.update(existingProf.id, {
        ...existingProf,
        is_admin: user.role === "admin"
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["professionals"] });
      }).catch(() => { });
    }
    */
  }, [user, professionals, isLoading]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Professional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsFormOpen(false);
      resetForm();
      toast.success("Profissional cadastrado!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Professional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsFormOpen(false);
      resetForm();
      toast.success("Cadastro atualizado!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Professional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional excluído!");
    }
  });

  const resetForm = () => {
    setFormData({
      full_name: "", role_type: "profissional", specialty: "", council_number: "", council_state: "",
      phone: "", email: "", color: "#3B82F6", appointment_duration: 30, status: "ativo", photo_url: ""
    });
    setEditing(null);
  };

  React.useEffect(() => {
    console.log("Current User:", user);
  }, [user]);

  const isAdmin = user?.role?.toLowerCase()?.includes("admin") ||
    user?.role?.toLowerCase()?.includes("gerente") ||
    user?.role?.toLowerCase()?.includes("owner") ||
    user?.role === "admin" ||
    user?.role === "owner" ||
    user?.email === "rafamarketingdb@gmail.com" || // Hardcoded fallback for owner
    user?.email === "marketingorofacial@gmail.com" || // Specific fallback
    user?.user_metadata?.role === "admin";

  const getRoleLabel = (roleType) => {
    const labels = {
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

  const getRoleIcon = (roleType) => {
    if (roleType === "profissional" || roleType === "hof" || roleType === "biomedico") return Stethoscope;
    if (roleType === "gerente") return Shield;
    return Users;
  };

  const handleEdit = (prof) => {
    setEditing(prof);
    setFormData(prof);
    setIsFormOpen(true);
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e) => {
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

  // Success Dialog for Link (OLD)
  if (inviteLink) {
    // ... (This block is now handled inside InviteMemberDialog, but leaving here won't hurt as inviteLink state is barely used now in main component)
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Equipe</h1>
            <p className="text-slate-500 mt-1">{professionals.length} membros cadastrados</p>
          </div>
          {(isAdmin || professionals.length === 0) && (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsInviteOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Convidar por Email
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setIsFormOpen(true);
                }}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                Novo Membro (Direto)
              </Button>
            </div>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-500">Carregando equipe...</span>
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhum membro cadastrado</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
              Sua equipe está vazia. Adicione o primeiro membro para começar!
            </p>
            {(isAdmin || professionals.length === 0) && (
              <Button
                onClick={() => setIsInviteOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Agora

              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((prof) => (
              <Card key={prof.id} className="p-5 bg-white border-0 shadow-sm hover:shadow-lg transition-all group relative">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div
                      className="p-1 rounded-full transition-transform group-hover:scale-105"
                      style={{ background: `linear-gradient(135deg, ${prof.color || "#3B82F6"} 0%, ${prof.color}88 100%)` }}
                    >
                      <Avatar className="h-16 w-16 border-2 border-white">
                        <AvatarImage src={prof.photo_url} />
                        <AvatarFallback className="text-white font-bold text-lg" style={{ backgroundColor: prof.color || "#3B82F6" }}>
                          {prof.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Status Dot */}
                    <div
                      className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: prof.status === 'ativo' ? '#10B981' : (prof.status === 'convidado' ? '#F59E0B' : '#94A3B8') }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">
                          {prof.full_name}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-5 px-2 bg-slate-50 border-slate-200 text-slate-600">
                            {getRoleLabel(prof.role_type)}
                          </Badge>

                          {prof.is_admin && (
                            <div className="relative">
                              <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 animate-pulse rounded-full"></div>
                              <Badge className="relative text-[10px] bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 font-black border-0 shadow-sm px-2 h-5">
                                ⭐ ADMIN
                              </Badge>
                            </div>
                          )}
                        </div>

                        {prof.specialty && (
                          <p className="text-sm font-medium text-slate-500">
                            {prof.specialty}
                          </p>
                        )}

                        {prof.council_number && (
                          <p className="text-xs text-slate-400 font-medium">
                            {prof.council_number} {prof.council_state ? `- ${prof.council_state}` : ''}
                          </p>
                        )}

                        <div className="pt-1">
                          <Badge
                            className={`text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-tighter ${prof.status === "ativo"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : prof.status === 'convidado'
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            variant="outline"
                          >
                            {prof.status === "ativo" ? "Ativo" : prof.status === 'convidado' ? "Convidado" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {(isAdmin || prof.email === user?.email) && (
                            <DropdownMenuItem onClick={() => handleEdit(prof)} className="gap-2 text-slate-600">
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => confirm(`Excluir ${prof.full_name}?`) && deleteMutation.mutate(prof.id)}
                              className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing ? "Editar Membro" : "Adicionar Membro da Equipe"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.photo_url} />
                  <AvatarFallback style={{ backgroundColor: formData.color }} className="text-white text-xl">
                    {formData.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700">
                  {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Função na Clínica *</Label>
              <Select value={formData.role_type} onValueChange={(v) => setFormData(p => ({ ...p, role_type: v }))}>
                <SelectTrigger>
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

            <div>
              <Label>{(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") ? "Especialidade *" : "Cargo/Função"}</Label>
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData(p => ({ ...p, specialty: e.target.value }))}
                placeholder={(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") ? "Ex: Cardiologia" : "Ex: Recepcionista"}
                required={(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico")}
              />
            </div>

            {(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Número do Conselho</Label>
                  <Input
                    value={formData.council_number}
                    onChange={(e) => setFormData(p => ({ ...p, council_number: e.target.value }))}
                    placeholder="CRM/CRO"
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input
                    value={formData.council_state}
                    onChange={(e) => setFormData(p => ({ ...p, council_state: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            {(formData.role_type === "profissional" || formData.role_type === "hof" || formData.role_type === "biomedico") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cor na Agenda</Label>
                  <Select value={formData.color} onValueChange={(v) => setFormData(p => ({ ...p, color: v }))}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.color }} />
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
                <div>
                  <Label>Duração Consulta (min)</Label>
                  <Input
                    type="number"
                    value={formData.appointment_duration}
                    onChange={(e) => setFormData(p => ({ ...p, appointment_duration: parseInt(e.target.value) }))}
                    min={10}
                    max={180}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Cadastrar"}
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
    </div>
  );
}

// Sub-component for Invite Dialog (Matches Super Admin Style)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function InviteMemberDialog({ open, onOpenChange }) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [loading, setLoading] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "/api";
      const orgId = localStorage.getItem('active-org-id');

      // 1. Create Invite
      const res = await fetch(`${apiUrl}/admin/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-organization-id': orgId
        },
        body: JSON.stringify({ email, role, organizationId: orgId })
      });

      if (!res.ok) throw new Error("Erro ao criar convite");

      // 2. Get WhatsApp Link
      const linkRes = await fetch(`${apiUrl}/admin/get-invite-link?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-organization-id': orgId
        }
      });

      if (linkRes.ok) {
        const data = await linkRes.json();
        if (data.link) {
          setInviteLink(data.link);
          // Auto-open WhatsApp if phone provided
          if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            const waLink = `https://wa.me/${cleanPhone}?text=Olá! Você foi convidado para o ClinicOS. Finalize seu cadastro aqui: ${data.link}`;
            setTimeout(() => window.open(waLink, '_blank'), 500);
          }
          return; // Keep dialog open with link
        }
      }
      toast.success("Convite enviado!");
      onOpenChange(false);

    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copiado!");
  };

  // Reset form on close
  React.useEffect(() => {
    if (!open) {
      setInviteLink("");
      setEmail("");
      setPhone("");
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite para um novo membro da equipe.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label>E-mail do Convidado</Label>
              <Input
                type="email"
                required
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>WhatsApp (Opcional)</Label>
              <Input
                placeholder="+55 11 99999-9999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">Se preenchido, abrirá o WhatsApp com o link.</p>
            </div>
            <div>
              <Label>Nível de Acesso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro (Padrão)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar Convite
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-bold">Convite Criado!</p>
                <p className="text-xs">Se o WhatsApp não abriu, use o link abaixo.</p>
              </div>
            </div>
            <div className="bg-slate-100 p-3 rounded border text-xs break-all text-slate-600 font-mono">
              {inviteLink}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => {
                  const cleanPhone = phone.replace(/\D/g, '');
                  window.open(`https://wa.me/${cleanPhone}?text=Olá! Você foi convidado para o ClinicOS. Finalize seu cadastro aqui: ${inviteLink}`, '_blank');
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Abrir WhatsApp
              </Button>
              <Button variant="outline" onClick={copyToClipboard} className="w-full">
                Copiar Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Import CheckCircle
import { CheckCircle } from "lucide-react";

