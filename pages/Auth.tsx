import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
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
            const { data, error } = await authClient.signIn.email({
                email,
                password
            });
            if (error) {
                toast.error(error.message || "Erro ao fazer login");
            } else {
                toast.success("Login realizado com sucesso!");
                navigate("/dashboard");
            }
        } catch (e) {
            toast.error("Erro inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const { data, error } = await authClient.signUp.email({
                email,
                password,
                name
            });
            if (error) {
                toast.error(error.message || "Erro ao criar conta");
            } else {
                toast.success("Conta criada! Configure sua clínica.");
                // Usually auto-logs in
                if (data) {
                    navigate("/organization/new");
                } else {
                    // Check if sign in needed or verify email
                    navigate("/login");
                }
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
                    <CardTitle className="text-2xl text-center">ClinicOS</CardTitle>
                    <CardDescription className="text-center">Acesse sua conta para continuar</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin">Entrar</TabsTrigger>
                            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Entrar
                            </Button>
                        </TabsContent>

                        <TabsContent value="signup" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Senha</Label>
                                <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Conta
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
