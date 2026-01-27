import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitation() {
    const [searchParams] = useSearchParams();
    const { token: paramToken } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error, logging_in
    const [errorMsg, setErrorMsg] = useState("");

    // Support both /accept-invitation/:token AND /accept-invitation?token=...
    const token = paramToken || searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("Token de convite inválido ou ausente.");
            return;
        }

        const processInvite = async () => {
            try {
                // 1. Check if user is logged in
                const user = await base44.auth.me();

                if (!user) {
                    // Not logged in -> Redirect to Register (magic!)
                    console.log("User not logged in, redirecting to register with token:", token);
                    // We can pass the token as a query param to the auth page
                    // Ideally, the Auth page should check for this param and store it or use it post-signup
                    // For now, let's redirect to /login with a special param
                    toast.info("Faça login ou crie uma conta para aceitar o convite.");

                    // Saving to sessionStorage as backup
                    sessionStorage.setItem("pending_invite_token", token);

                    setTimeout(() => {
                        navigate(`/login?invite_token=${token}`);
                    }, 1000);
                    return;
                }

                // 2. User is logged in -> Accept Invite via API
                setStatus("verifying");
                const { data, error } = await base44.admin.acceptInvite(token);

                if (error) {
                    console.error("Invite Error:", error);
                    setStatus("error");
                    setErrorMsg(typeof error === 'string' ? error : error.message || "Falha ao aceitar convite");
                } else {
                    setStatus("success");
                    toast.success(data.message || "Convite aceito com sucesso!");

                    // Update active org context
                    if (data.organizationId) {
                        localStorage.setItem("active-org-id", data.organizationId);
                    }

                    setTimeout(() => {
                        navigate("/Dashboard");
                    }, 2000);
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
                setErrorMsg("Erro inesperado ao processar convite.");
            }
        };

        processInvite();
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
                            <p className="text-slate-500">Validando convite e permissões...</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <p className="text-lg font-medium text-slate-800">Você agora faz parte da equipe!</p>
                            <p className="text-sm text-slate-500">Acessando o painel...</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500" />
                            <p className="text-lg font-medium text-slate-800">Erro ao aceitar convite</p>
                            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-md">{errorMsg}</p>
                            <Button variant="outline" onClick={() => navigate("/Dashboard")} className="mt-4">
                                Ir para Dashboard
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
