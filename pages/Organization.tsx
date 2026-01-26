import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Organization() {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreateOrg = async () => {
        setLoading(true);
        try {
            // Use custom backend route instead of better-auth
            const { data: { session } } = await supabase.auth.getSession();
            const apiUrl = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "/api";

            const res = await fetch(`${apiUrl}/admin/organization/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || 'dev-token'}`
                },
                body: JSON.stringify({ name, slug })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao criar organização");
            } else {
                toast.success("Organização criada!");
                if (data?.id) {
                    localStorage.setItem("active-org-id", data.id);
                }
                navigate("/Dashboard");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Criar sua Clínica</CardTitle>
                    <CardDescription>Configure o espaço de trabalho da sua empresa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Nome da Clínica</Label>
                        <Input id="org-name" value={name} onChange={e => {
                            setName(e.target.value);
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                        }} placeholder="Minha Clínica" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-slug">URL (Slug)</Label>
                        <Input id="org-slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="minha-clinica" />
                    </div>
                    <Button className="w-full" onClick={handleCreateOrg} disabled={loading || !name}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Organização
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
