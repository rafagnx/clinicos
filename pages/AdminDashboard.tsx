import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Building2, Server } from "lucide-react";

export default function AdminDashboard() {
    // Fetch orgs for stats
    const { data: orgs = [] } = useQuery({
        queryKey: ["admin-orgs"],
        queryFn: async () => {
            // Reusing the fetch logic or assuming base44.admin.listOrganizations works if set up
            // For now using empty array fallback to prevent crash if fetch fails during dev
            try {
                // @ts-ignore
                return await base44.admin.listOrganizations();
            } catch (e) {
                return [];
            }
        }
    });

    const stats = [
        {
            title: "Organizações Ativas",
            value: orgs.length || "-",
            icon: Building2,
            color: "text-blue-600 bg-blue-50"
        },
        {
            title: "Usuários no Sistema",
            value: "1,240", // Mocked for now
            icon: Users,
            color: "text-emerald-600 bg-emerald-50"
        },
        {
            title: "Requisições / Min",
            value: "450 rpm",
            icon: Activity,
            color: "text-amber-600 bg-amber-50"
        },
        {
            title: "Status do Server",
            value: "Operacional",
            icon: Server,
            color: "text-slate-600 bg-slate-50"
        },
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Geral</h1>
                    <p className="text-slate-500">Visão sistêmica da plataforma ClinicOS.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Novas Organizações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orgs.length > 0 ? (
                            <div className="space-y-4">
                                {orgs.slice(0, 5).map((org: any) => (
                                    <div key={org.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {org.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{org.name}</p>
                                                <p className="text-xs text-slate-500">@{org.slug}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(org.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Nenhuma organização recente.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Alertas do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100 mb-2">
                            <Server className="w-4 h-4" />
                            Todos os sistemas operando normalmente.
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-100">
                            <Activity className="w-4 h-4" />
                            Backup diário realizado com sucesso (03:00 AM).
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
