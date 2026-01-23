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
    queryKey: ["professionals-list"],
    queryFn: async () => {
      console.log("Fetching professionals for Equipe page...");
      const data = await base44.read("Professional", {
        sort: [{ field: "full_name", direction: "asc" }]
      });
      console.log("Professionals fetched:", data);
      return data;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  React.useEffect(() => {
    if (!user || isLoading || !professionals) return;

    // Check if user already exists as Professional
    const activeOrg = localStorage.getItem("active-org-id");
    if (!activeOrg) return; // Do not auto-create if no org context

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

  const isAdmin = user?.role === "admin";

  const getRoleLabel = (roleType) => {
    const labels = {
      profissional: "HOF ou Biomédico",
      secretaria: "Secretária",
      marketing: "Marketing",
      gerente: "Gerente",
      outro: "Outro"
    };
    return labels[roleType] || roleType;
  };

  const getRoleIcon = (roleType) => {
    if (roleType === "profissional") return Stethoscope;
    if (roleType === "gerente") return Shield;
    return Users;
  };

  const handleEdit = (prof) => {
    setEditing(prof);
    setFormData(prof);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      // Invite Flow
      try {
        console.log("Inviting user:", formData.email);

        // 1. Trigger Better Auth Invite (creates record in DB)
        await authClient.organization.inviteMember({
          email: formData.email,
          role: "member",
        });

        // 2. Fetch the generated link from our custom backend endpoint
        // (Since we don't have SMTP, we need manual link sharing)
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/admin/get-invite-link?email=${formData.email}`, {
          headers: { 'Content-Type': 'application/json' },
          // credentials: 'include' // Handled by browser/proxy usually, but let's see. 
          // Better-auth cookies are HTTPOnly. We need credentials.
        });

        // However, standard fetch might fail with CORS if credentials not set right.
        // Let's rely on the fact that if invite succeeded, the record exists.

        if (res.ok) {
          const data = await res.json();
          if (data.link) {
            setInviteLink(data.link);
            // Don't close form yet, let user see link? 
            // Or better: Close form and show Success Dialog.
            setIsFormOpen(false);
            return; // Stop here to show dialog
          }
        }

        // If we couldn't get link, just proceed normal flow
        console.log("Could not fetch manual link, assuming email sent.");

        // Create the professional record in public table
        const newProf = { ...formData, status: "convidado" };
        createMutation.mutate(newProf);

      } catch (err) {
        console.error("Unexpected invite error:", err);
        toast.error("Erro ao processar convite. Tente novamente.");
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  // Success Dialog for Link
  if (inviteLink) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Convite Gerado! 🎉</h2>
          <p className="text-slate-600 mb-4">
            Como o sistema de e-mail ainda está sendo configurado, envie este link diretamente para o colaborador:
          </p>

          <div className="bg-slate-100 p-3 rounded-lg break-all text-sm text-slate-500 mb-4 border border-slate-200">
            {inviteLink}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.open(`https://wa.me/?text=Olá! Você foi convidado para o ClinicOS. Finalize seu cadastro aqui: ${inviteLink}`, '_blank')}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              Enviar no WhatsApp
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Link copiado!");
                }}
              >
                Copiar Link
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setInviteLink("");
                  // Create prof record finally
                  const newProf = { ...formData, status: "convidado" };
                  createMutation.mutate(newProf);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <Button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Membro
            </Button>
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
                onClick={() => { resetForm(); setIsFormOpen(true); }}
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
              <Card key={prof.id} className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-4" style={{ ringColor: prof.color || "#3B82F6" }}>
                      <AvatarImage src={prof.photo_url} />
                      <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: prof.color || "#3B82F6" }}>
                        {prof.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: prof.color || "#3B82F6" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">{prof.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getRoleLabel(prof.role_type)}
                          </Badge>
                          {prof.is_admin && (
                            <motion.div
                              animate={{
                                boxShadow: [
                                  "0 0 10px rgba(251, 191, 36, 0.5)",
                                  "0 0 20px rgba(251, 191, 36, 0.8)",
                                  "0 0 10px rgba(251, 191, 36, 0.5)"
                                ]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="inline-block"
                            >
                              <Badge className="text-xs bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 font-bold border-0 shadow-lg">
                                ⭐ Admin
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        {prof.specialty && (
                          <p className="text-sm text-slate-500 mt-1">{prof.specialty}</p>
                        )}
                        {prof.council_number && (
                          <p className="text-xs text-slate-400 mt-1">
                            {prof.council_number} - {prof.council_state}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isAdmin || prof.email === user?.email) && (
                            <DropdownMenuItem onClick={() => handleEdit(prof)} className="gap-2">
                              <Edit2 className="w-4 h-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => confirm(`Excluir ${prof.full_name}?`) && deleteMutation.mutate(prof.id)}
                              className="gap-2 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {prof.phone && (
                        <Badge variant="secondary" className="text-xs bg-slate-100">
                          <Phone className="w-3 h-3 mr-1" />
                          {prof.phone}
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-xs ${prof.status === "ativo" ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-100 text-slate-500"}`}
                      >
                        {prof.status === "ativo" ? "Ativo" : prof.status === 'convidado' ? "Convidado" : "Inativo"}
                      </Badge>
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
                  <SelectItem value="profissional">HOF ou Biomédico</SelectItem>
                  <SelectItem value="secretaria">Secretária</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{formData.role_type === "profissional" ? "Especialidade *" : "Cargo/Função"}</Label>
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData(p => ({ ...p, specialty: e.target.value }))}
                placeholder={formData.role_type === "profissional" ? "Ex: Cardiologia" : "Ex: Recepcionista"}
                required={formData.role_type === "profissional"}
              />
            </div>

            {formData.role_type === "profissional" && (
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

            {formData.role_type === "profissional" && (
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
    </div>
  );
}

