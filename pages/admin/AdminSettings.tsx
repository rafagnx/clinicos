import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAdminTheme } from "./AdminLayout";
import { cn } from "@/lib/utils";
import { Settings, Shield, Globe, Database } from "lucide-react";

export default function AdminSettings() {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Ajustes globais e técnicos da plataforma.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className={cn("border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className={cn("p-2 rounded-lg", isDark ? "bg-indigo-500/10" : "bg-indigo-50")}>
                            <Shield className={cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600")} />
                        </div>
                        <div>
                            <CardTitle className={cn(isDark ? "text-white" : "text-slate-900")}>Parâmetros Globais</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={isDark ? "text-slate-200" : "text-slate-900"}>Manutenção do Sistema</Label>
                                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                                    Bloquear acesso de todas as clínicas temporariamente.
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={isDark ? "text-slate-200" : "text-slate-900"}>Novos Cadastros</Label>
                                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                                    Permitir auto-cadastro de novas clínicas (SaaS).
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn("border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className={cn("p-2 rounded-lg", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                            <Database className={cn("w-6 h-6", isDark ? "text-emerald-400" : "text-emerald-600")} />
                        </div>
                        <div>
                            <CardTitle className={cn(isDark ? "text-white" : "text-slate-900")}>Integrações Core</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className={isDark ? "text-slate-200" : "text-slate-900"}>API Key (Evolution API - WhatsApp)</Label>
                            <Input
                                type="password"
                                value="••••••••••••••••"
                                readOnly
                                className={cn(isDark ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-slate-50")}
                            />
                        </div>
                        <div className="pt-2">
                            <Button variant="outline" className={cn(isDark ? "bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800" : "")}>
                                Atualizar Chaves
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



