import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitation() {
    const [searchParams] = useSearchParams();
    const { token: paramToken } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [errorMsg, setErrorMsg] = useState("");

    // Support both /accept-invitation/:token AND /accept-invitation?token=...
    const token = paramToken || searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("Token de convite inválido ou ausente.");
            return;
        }

        const accept = async () => {
            try {
                const { data, error } = await authClient.organization.acceptInvitation({
                    invitationId: token // better-auth uses 'invitationId' usually, check docs if it's token
                });

                // Double check: some versions use strict 'token' vs 'invitationId'. 
                // Default organization plugin 'acceptInvitation' takes { invitationId }.

                if (error) {
                    console.error(error);
                    setStatus("error");
                    setErrorMsg(error.message || "Falha ao aceitar convite");
                } else {
                    setStatus("success");
                    toast.success("Convite aceito com sucesso!");
                    setTimeout(() => {
                        navigate("/dashboard");
                    }, 2000);
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
                setErrorMsg("Erro inesperado.");
            }
        };

        accept();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <CardTitle>Entrando na Organização</CardTitle>
                    <CardDescription>Processando seu convite...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 py-8">
                    {status === "verifying" && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="text-slate-500">Validando convite...</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <p className="text-lg font-medium text-slate-800">Você agora faz parte da equipe!</p>
                            <p className="text-sm text-slate-500">Redirecionando...</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500" />
                            <p className="text-lg font-medium text-slate-800">Erro ao aceitar convite</p>
                            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-md">{errorMsg}</p>
                            <Button variant="outline" onClick={() => navigate("/login")} className="mt-4">
                                Ir para Login
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
