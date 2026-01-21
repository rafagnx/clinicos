import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Users, Globe, Settings } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminOrganizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [invitingOrg, setInvitingOrg] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            // Determine if we are using the 'admin' endpoint or generic 'organization' entity if we expose it
            // Based on server/index.js, we have /api/admin/organizations
            const data = await base44.admin.listOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to load organizations", error);
            toast.error("Erro ao carregar organizações. Verifique suas permissões.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const onSubmit = async (data) => {
        try {
            // We don't have a direct 'create organization' endpoint exposed in base44Client yet
            // But we can use the generic 'organization' entity if we map it, OR use the auth client if it supports it.
            // However, better-auth usually handles org creation via its own client. 
            // For now, let's assume we use a specialized endpoint or generic create if allowed.

            // Since server/index.js doesn't expose generic CREATE for 'organization' table directly (not in tableMap),
            // we might need to rely on better-auth client OR add it to tableMap.
            // CHECK: tableMap in server/index.js does NOT include 'Organization'.
            // But better-auth plugin 'organization' usually adds routes like /org/create.

            // Let's try using the base44 client to hit the better-auth endpoint if possible, 
            // or we probably need to implement a create endpoint in server/index.js for admins.

            // FAILSAFE: I will add 'Organization': 'organization' to tableMap in server/index.js first?
            // No, better-auth manages that table. We should use `authClient.organization.create`.

            // Importing authClient locally to avoid messing with base44Client if it doesn't have it exposed 
            const { authClient } = await import("@/lib/auth-client");

            // MANUAL CREATE FALLBACK
            // Using direct API call to bypass potential Auth Plugin issues
            const token = localStorage.getItem("clinicos-token"); // If we store token? 
            // Better-auth cookies are httpOnly, so we can't read them easily unless we use the client to fetch.
            // Let's use the base44 generic fetcher if possible or standard fetch that includes credentials.

            // Using authClient.fetch to benefit from auto-header injection? No, authClient is for auth routes.
            // Let's try standard fetch with credentials: include

            const response = await fetch(`${(import.meta as any).env.VITE_BACKEND_URL || "https://clinicos-it4q.onrender.com"}/api/admin/organization/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // We need to rely on the cookie being sent automatically
                },
                credentials: "include",
                body: JSON.stringify({ name: data.name, slug: data.slug })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to create organization");
            }

            const org = await response.json();
            // End Manual Fallback



            toast.success("Organização criada com sucesso!");
            setIsOpen(false);
            reset();
            fetchOrganizations();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar organização: " + error.message);
        }
    };

    const handleInvite = (org) => {
        setInvitingOrg(org);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50/50">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Globe className="w-8 h-8 text-blue-600" />
                        Painel Master
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg">Gerencie todas as clínicas e acessos do sistema.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105">
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Organização
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Empresa</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Clínica Sorriso"
                                    {...register("name", { required: "Nome é obrigatório" })}
                                />
                                {errors.name && <span className="text-red-500 text-sm">{errors.name.message as string}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Identificador (Slug)</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                                        clinicos.com/
                                    </span>
                                    <Input
                                        id="slug"
                                        className="rounded-l-none"
                                        placeholder="clinica-sorriso"
                                        {...register("slug", { required: "Slug é obrigatório" })}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Usado na URL e identificação única.</p>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Criar Empresa</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    // Skeleton Loading State
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="space-y-2">
                                <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                                <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-24 bg-slate-100 rounded-lg"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : organizations.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhuma empresa encontrada</h3>
                        <p className="text-slate-500">Comece criando sua primeira organização.</p>
                    </div>
                ) : (
                    organizations.map((org) => (
                        <Card key={org.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden relative">
                            {/* Decorative Top Border */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                            <CardHeader className="pb-3 pt-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1" title={org.name}>
                                                {org.name}
                                            </CardTitle>
                                            <p className="text-sm text-slate-500 font-mono">@{org.slug}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Operacional
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="py-3 bg-slate-50/50 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 mb-1">Criado em</p>
                                        <p className="font-medium text-slate-700">
                                            {org.createdAt ? format(new Date(org.createdAt), "dd MMM, yyyy") : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">Status</p>
                                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                                            <Building2 className="w-3 h-3 text-slate-400" />
                                            <span>Ativo</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <div className="p-4 flex items-center gap-3 border-t border-slate-100 bg-white">
                                <Button
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
                                    onClick={() => {
                                        localStorage.setItem("active-org-id", org.id);
                                        window.location.href = "/Dashboard";
                                    }}
                                >
                                    Acessar Painel
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-3"
                                    title="Convidar Membro"
                                    onClick={() => handleInvite(org)}
                                >
                                    <Users className="w-4 h-4 text-slate-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="px-3 hover:bg-slate-100"
                                    title="Configurações"
                                    onClick={() => setEditingOrg(org)}
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Dialogs */}
            <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configurações da Clínica</DialogTitle>
                        <CardDescription>Gerencie os dados de {editingOrg?.name}</CardDescription>
                    </DialogHeader>
                    {editingOrg && (
                        <OrganizationSettingsForm
                            org={editingOrg}
                            onClose={() => {
                                setEditingOrg(null);
                                fetchOrganizations();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!invitingOrg} onOpenChange={(open) => !open && setInvitingOrg(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Convidar Membro</DialogTitle>
                        <CardDescription>Envie um convite para {invitingOrg?.name}</CardDescription>
                    </DialogHeader>
                    {invitingOrg && (
                        <InviteManagerForm
                            org={invitingOrg}
                            onClose={() => setInvitingOrg(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function OrganizationSettingsForm({ org, onClose }) {
    const { register, handleSubmit } = useForm({
        defaultValues: { name: org.name, slug: org.slug }
    });

    const onSubmit = async (data) => {
        try {
            const { authClient } = await import("@/lib/auth-client");
            await authClient.organization.update({
                organizationId: org.id,
                data: { name: data.name, slug: data.slug }
            });
            toast.success("Atualizado com sucesso!");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input {...register("slug", { required: true })} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
}

function InviteManagerForm({ org, onClose }) {
    const { register, handleSubmit, watch } = useForm();
    const [loading, setLoading] = useState(false);
    const phoneValue = watch("phone");

    const onInvite = async (data) => {
        try {
            setLoading(true);
            const { authClient } = await import("@/lib/auth-client");
            // Set active org usually required
            await authClient.organization.setActive({ organizationId: org.id });

            const { error } = await authClient.organization.inviteMember({
                email: data.email,
                role: data.role || "admin",
            });

            if (error) throw error;

            toast.success("Convite enviado!");

            // WhatsApp Logic
            if (data.phone) {
                const baseUrl = window.location.origin;
                const inviteLink = `${baseUrl}/login?email=${encodeURIComponent(data.email)}&slug=${org.slug}`;
                const message = `Olá! Você foi convidado para gerenciar a clínica *${org.name}* no ClinicOS.\n\nAcesse o link abaixo para criar sua senha e entrar:\n${inviteLink}`;
                const whatsappUrl = `https://wa.me/55${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }

            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar convite: " + (error.message || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onInvite)} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>E-mail do Convidador</Label>
                <Input type="email" placeholder="email@exemplo.com" {...register("email", { required: true })} />
            </div>

            <div className="space-y-2">
                <Label>WhatsApp (Opcional)</Label>
                <div className="flex gap-2">
                    <span className="flex items-center justify-center w-12 bg-slate-100 border border-slate-300 rounded-md text-slate-500 font-medium">
                        +55
                    </span>
                    <Input
                        placeholder="11999999999"
                        type="tel"
                        {...register("phone")}
                    />
                </div>
                <p className="text-xs text-slate-500">Se preenchido, abrirá o WhatsApp com o link do convite.</p>
            </div>
            <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <select {...register("role")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="admin">Administrador</option>
                    <option value="member">Membro</option>
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className={`text-white ${phoneValue ? 'bg-green-600 hover:bg-green-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    {loading ? "Enviando..." : (phoneValue ? "Enviar e Abrir WhatsApp" : "Enviar Convite")}
                </Button>
            </div>
        </form>
    );
}


