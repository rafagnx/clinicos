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
import { Building2, Plus, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminOrganizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "https://clinicos-it4q.onrender.com"}/api/admin/organization/create`, {
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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organizações</h1>
                    <p className="text-slate-500 mt-2">Gerencie as empresas cadastradas no ClinicOS.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Empresa
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                                <Input
                                    id="slug"
                                    placeholder="ex: clinica-sorriso"
                                    {...register("slug", { required: "Slug é obrigatório" })}
                                />
                                <p className="text-xs text-slate-500">Usado na URL e identificação única.</p>
                            </div>

                            <Button type="submit" className="w-full">Criar Empresa</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Empresas Cadastradas</CardTitle>
                    <CardDescription>Lista de todas as organizações no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        Nenhuma organização encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizations.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-blue-500" />
                                                {org.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono bg-slate-50">
                                                {org.slug}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{org.createdAt ? format(new Date(org.createdAt), "dd/MM/yyyy") : "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    localStorage.setItem("active-org-id", org.id);
                                                    // Force reload to update context or navigate
                                                    window.location.href = "/Dashboard";
                                                }}
                                            >
                                                Acessar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
