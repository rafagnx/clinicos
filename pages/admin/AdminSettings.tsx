import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Parâmetros Globais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Manutenção do Sistema</Label>
                                <p className="text-sm text-slate-500">Bloquear acesso de todas as clínicas temporariamente.</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Novos Cadastros</Label>
                                <p className="text-sm text-slate-500">Permitir auto-cadastro de novas clínicas.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Integrações Core</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>API Key (Evolution API - WhatsApp)</Label>
                            <Input type="password" value="••••••••••••••••" readOnly />
                        </div>
                        <Button variant="outline">Atualizar Chaves</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
