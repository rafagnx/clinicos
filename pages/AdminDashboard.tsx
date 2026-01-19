import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export default function AdminDashboard() {
    const navigate = useNavigate();

    // Fetch all organizations (requires SysAdmin)
    const { data: orgs = [], isLoading } = useQuery({
        queryKey: ["admin-orgs"],
        queryFn: async () => {
            // We need a direct call or add to base44Client
            // For MVP, direct fetch using authClient's fetch or axios if exposed?
            // base44 client is axios wrapper but configured with backend URL.
            // Let's assume we added 'admin' namespace or just use raw fetch for now for speed.
            const token = localStorage.getItem("token"); // Wait, better-auth is cookie based.

            // We'll use the base44 client's underlying axios or just fetch to the backend url
            // Since base44Client is not exporting the raw axios instance easily (it is internal 'api'), 
            // we will extend base44Client in a moment or use the 'functions.invoke' workaround/hack or just standard fetch
            // But wait, our backend is on a different port in dev maybe?
            // Let's assume relative path /api/admin/organizations works via Vite proxy if setup 
            // OR full URL if we use import.meta.env.

            // Ensure we use the production URL
            // @ts-ignore
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

            if (!BACKEND_URL) {
                console.error("BACKEND_URL missing!");
                throw new Error("Configuration Error");
            }

            // We need credentials (cookies)
            const res = await fetch(`${BACKEND_URL}/api/admin/organizations`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Send cookies
            });
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        }
    });

    const handleEnterOrg = (orgId) => {
        localStorage.setItem("active-org-id", orgId);
        // Force reload or nav to dashboard
        window.location.href = "/dashboard";
    };

    if (isLoading) return <div className="p-8">Carregando painel administrativo...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Painel do Super Admin</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => base44.auth.logout()}>
                        Sair
                    </Button>
                    <Button onClick={() => window.location.href = "/organization/new"}>
                        Nova Organização
                    </Button>
                </div>
            </div>

            {orgs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                    <p className="text-slate-500 mb-4">Nenhuma organização encontrada.</p>
                    <p className="text-sm text-slate-400">O banco de dados do Render é novo. Crie a primeira clínica para testar!</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orgs.map(org => (
                        <Card key={org.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{org.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 mb-4">{org.slug}</p>
                                <Button onClick={() => handleEnterOrg(org.id)} className="w-full">
                                    Acessar Gerenciamento
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
