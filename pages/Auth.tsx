import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { base44 } from "@/lib/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
            } else {
                toast.success("Login realizado com sucesso!");
                localStorage.setItem("clinicos-token", data.session?.access_token || "");
                // Fetch user org context later or just dashboard
                window.location.href = "/Dashboard";
            }
        } catch (e) {
            console.error("Login error:", e);
            toast.error("Erro inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) {
                toast.error(error.message || "Erro ao criar conta");
            } else {
                if (data.session) {
                    localStorage.setItem("clinicos-token", data.session.access_token);

                    // CRITICAL FIX: Fetch organizations after signup
                    try {
                        const orgs = await base44.auth.getUserOrganizations();

                        if (orgs && orgs.length > 0) {
                            localStorage.setItem("active-org-id", orgs[0].organizationId || orgs[0].id);
                            toast.success("Conta criada! Bem-vindo!");
                            navigate("/Dashboard");
                        } else {
                            toast.success("Conta criada! Configure sua clínica");
                            navigate("/organization/new");
                        }
                    } catch (orgError) {
                        console.error("Org fetch error:", orgError);
                        toast.success("Conta criada! Configure sua clínica");
                        navigate("/organization/new");
                    }
                } else if (data.user) {
                    toast.success("Conta criada! Verifique seu email para confirmar.");
                    // Optional: navigate to a "check email" page
                }
            }
        } catch (e) {
            toast.error("Erro inesperado");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin + '/Dashboard'
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error("Erro no login Google: " + error.message);
            setLoading(false);
        }
    };

    const GoogleButton = ({ text }) => (
        <>
            <Button variant="outline" type="button" className="w-full mb-4 bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700" onClick={handleGoogleLogin}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                {text}
            </Button>
            <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Ou continue com</span>
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-16 border-r border-white/5 bg-slate-950/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                        {/* Assuming Activity icon is available or imported */}
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">ClinicOS</span>
                </div>

                <div className="max-w-xl space-y-6">
                    <h1 className="text-4xl font-bold leading-tight text-white">
                        Comece a transformar sua clínica <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">hoje mesmo</span>.
                    </h1>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
                            <div>
                                <h3 className="text-white font-semibold">Crie sua conta</h3>
                                <p className="text-sm text-slate-400">Rápido, fácil e gratuito por 7 dias.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
                            <div>
                                <h3 className="text-white font-semibold">Configure sua clínica</h3>
                                <p className="text-sm text-slate-400">Personalize o sistema para suas necessidades.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">3</div>
                            <div>
                                <h3 className="text-white font-semibold">Cresça sem limites</h3>
                                <p className="text-sm text-slate-400">Gerencie pacientes, finanças e agenda em um só lugar.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-500">
                    © {new Date().getFullYear()} ClinicOS Inc.
                </div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>

                    <Card className="bg-slate-900/50 border-slate-800 text-white backdrop-blur-xl shadow-2xl">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Bem-vindo ao ClinicOS</CardTitle>
                            <CardDescription className="text-slate-400">Escolha como deseja continuar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="signup" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-950 p-1 rounded-xl mb-6">
                                    <TabsTrigger value="signin" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg">Entrar</TabsTrigger>
                                    <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg">Criar Conta</TabsTrigger>
                                </TabsList>

                                <TabsContent value="signin" className="space-y-4">
                                    <GoogleButton text="Entrar com Google" />
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                                        onClick={handleSignIn}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Entrar
                                    </Button>
                                </TabsContent>

                                <TabsContent value="signup" className="space-y-4">
                                    <GoogleButton text="Criar conta com Google" />
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-300">Nome Completo</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Dr. Exemplo"
                                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email" className="text-slate-300">Email Corporativo</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password" className="text-slate-300">Senha</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-900/20"
                                        onClick={handleSignUp}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Criar Conta Grátis
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Ao criar uma conta, você concorda com nossos <a href="#" className="underline hover:text-slate-400">Termos</a> e <a href="#" className="underline hover:text-slate-400">Privacidade</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}



