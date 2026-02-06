import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabaseClient";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Activity, CheckCircle2 } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                window.location.href = '/Dashboard';
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (e?: React.FormEvent, isRetry = false) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Auto-retry on storage error signal
                if (!isRetry && (error.message?.includes('quota') || error.message?.includes('storage'))) {
                    console.warn("Retrying login after storage error...");
                    localStorage.clear();
                    return handleLogin(undefined, true);
                }

                console.error("Supabase Login Error:", error);

                if (error.message.includes("Email not confirmed")) {
                    toast.error("Email não confirmado. Verifique sua caixa de entrada.", {
                        action: {
                            label: "Reenviar Email",
                            onClick: () => handleResendConfirmation()
                        },
                        duration: 8000
                    });
                } else {
                    toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
                }

                setIsLoading(false);
                return;
            }

            if (data.user) {
                try {
                    // --- EMERGENCY TOKEN SLIMMING ---
                    // If user has a massive image in metadata (common with Google Auth), 
                    // the token will exceed Render's header limit (8KB-16KB).
                    const meta = data.user.user_metadata;
                    const tooBig = meta && Object.values(meta).some(v => typeof v === 'string' && v.length > 1000);

                    if (tooBig || data.user.email === 'letty-galhardojandre@outlook.com') {
                        console.warn("🛡️ [Login] Dangerous metadata detected. Slimming token...");
                        await supabase.auth.updateUser({
                            data: {
                                image: "",
                                avatar_url: "",
                                picture: "",
                                photo_url: "",
                                avatar: ""
                            }
                        });
                        // Refresh session to get a small token
                        const { data: refreshData } = await supabase.auth.refreshSession();
                        if (refreshData.session) {
                            localStorage.setItem("clinicos-token", refreshData.session.access_token);
                        }
                        console.log("✅ [Login] Token slimmed successfully.");
                    } else {
                        localStorage.setItem("clinicos-token", data.session?.access_token || "");
                    }
                } catch (e) {
                    console.warn("Token slimming failed, proceeding with caution:", e);
                    localStorage.setItem("clinicos-token", data.session?.access_token || "");
                }

                try {
                    const orgs = await base44.auth.getUserOrganizations();

                    // Check for pending invite
                    const pendingInviteToken = new URLSearchParams(window.location.search).get("invite_token") || sessionStorage.getItem("pending_invite_token");

                    if (pendingInviteToken) {
                        toast.info("Processando seu convite...");
                        sessionStorage.removeItem("pending_invite_token"); // consume it
                        window.location.href = `/accept-invite?token=${pendingInviteToken}`;
                        return;
                    }

                    if (orgs && orgs.length > 0) {
                        // Set the first (or most recent) organization as active
                        localStorage.setItem("active-org-id", orgs[0].organizationId || orgs[0].id);
                        toast.success("Bem-vindo de volta!");
                        window.location.href = '/Dashboard';
                    } else {
                        // No organization found - redirect to create one
                        toast.info("Configure sua clínica para começar");
                        navigate('/organization/new');
                    }
                } catch (orgError) {
                    console.error("Organization fetch error:", orgError);
                    toast.error("Erro ao carregar contexto. Tente novamente.");
                    setIsLoading(false);
                    return;
                }
            }
        } catch (err: any) {
            console.error("Unexpected login error:", err);

            if (err?.name === 'QuotaExceededError' ||
                err?.message?.includes('exceeded the quota') ||
                err?.toString().includes('QuotaExceededError')) {

                if (!isRetry) {
                    toast.info("Otimizando memória do navegador...");
                    try {
                        localStorage.clear();
                        setTimeout(() => handleLogin(undefined, true), 200);
                        return;
                    } catch (e) {
                        toast.error("Falha ao limpar memória.");
                    }
                } else {
                    toast.error("Erro crítico: Memória cheia. Limpe seus dados de navegação manualmente.");
                }
            } else {
                toast.error("Erro inesperado ao tentar logar.");
            }
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (!email) {
            toast.error("Preencha o email para reenviar.");
            return;
        }

        const toastId = toast.loading("Reenviando email...");
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            toast.success("Email reenviado! Verifique (inclusive SPAM).", { id: toastId });
        } catch (err: any) {
            toast.error("Erro ao reenviar: " + err.message, { id: toastId });
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        console.log("🔵 [Login] Attempting Google Auth...");
        console.log("🔵 [Login] Supabase URL configured:", import.meta.env.VITE_SUPABASE_URL);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin + '/Dashboard',
                    skipBrowserRedirect: false
                }
            });

            if (error) {
                console.error("🔴 [Login] Supabase OAuth Error:", error);
                throw error;
            }
            console.log("🟢 [Login] Redirect initiated.");

        } catch (error: any) {
            console.error("🔴 [Login] Exception:", error);
            // Alert so user sees it even if console is closed
            alert("Erro Login Google: " + error.message);
            toast.error("Erro no login Google: " + error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-16">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">ClinicOS</span>
                </div>

                <div className="max-w-xl space-y-4">
                    <h1 className="text-5xl font-bold leading-tight text-white">
                        Bem-vindo ao futuro da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">sua clínica</span>.
                    </h1>
                    <p className="text-lg text-slate-400">
                        A plataforma completa para gerenciar, escalar e fidelizar pacientes com inteligência e design premium.
                    </p>

                    <div className="grid grid-cols-2 gap-6 pt-8">
                        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-sm text-slate-500">Pacientes Ativos</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-white mb-1">99%</div>
                            <div className="text-sm text-slate-500">Satisfação</div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-500">
                    © {new Date().getFullYear()} ClinicOS Inc.
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h2>
                        <p className="text-slate-400">Entre com suas credenciais para continuar gerenciando.</p>
                    </div>

                    <div className="space-y-6">

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-medium border-0 rounded-xl flex items-center gap-3 justify-center transition-all"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Entrar com Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-950 px-2 text-slate-500">Ou continue com email</span>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email Corporativo</Label>
                                <div className="relative group">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nome@clinica.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                    <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                        Esqueceu a senha?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verificando...</span>
                                    </div>
                                ) : "Entrar na Plataforma"}
                            </Button>
                        </form>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-800 text-center">
                        <p className="text-slate-500">
                            Ainda não tem uma conta?{" "}
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); navigate("/register"); }}
                                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Criar conta grátis
                            </a>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
}



