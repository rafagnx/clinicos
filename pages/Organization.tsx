import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
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
            const { data, error } = await authClient.organization.create({
                name,
                slug,
            });
            if (error) {
                toast.error(error.message || "Erro ao criar organização");
            } else {
                toast.success("Organização criada!");
                // data.id is the org ID
                if (data?.id) {
                    localStorage.setItem("active-org-id", data.id);
                }
                navigate("/Dashboard");
            }
        } catch (e) {
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
