import React from "react";
import { useAdminTheme } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReports() {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        Visualize e exporte dados do sistema.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className={cn("border-none shadow-md", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-slate-900")}>
                            Relatório Financeiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-indigo-500/10 flex items-center gap-4">
                            <BarChart className="w-8 h-8 text-indigo-500" />
                            <div className="flex-1">
                                <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                                    Receita Mensal
                                </p>
                                <p className="text-xs text-slate-500">Formato: PDF, CSV</p>
                            </div>
                        </div>
                        <Button className="w-full" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                        </Button>
                    </CardContent>
                </Card>

                <Card className={cn("border-none shadow-md", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-slate-900")}>
                            Relatório de Usuários
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 flex items-center gap-4">
                            <FileText className="w-8 h-8 text-emerald-500" />
                            <div className="flex-1">
                                <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                                    Novos Cadastros
                                </p>
                                <p className="text-xs text-slate-500">Formato: Excel, CSV</p>
                            </div>
                        </div>
                        <Button className="w-full" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



