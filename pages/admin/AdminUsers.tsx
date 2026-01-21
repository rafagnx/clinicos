import React from "react";
import { useAdminTheme } from "./AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Usuários Globais</h1>
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Gerencie o acesso de usuários ao sistema.
                </p>
            </div>

            <Card className={cn("border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                <CardHeader>
                    <CardTitle className={cn(isDark ? "text-white" : "text-slate-900")}>Últimos Acessos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className={cn("border-b", isDark ? "border-slate-800 hover:bg-slate-800/50" : "hover:bg-slate-100/50")}>
                                <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Usuário</TableHead>
                                <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Email</TableHead>
                                <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Função</TableHead>
                                <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className={cn("border-b", isDark ? "border-slate-800 hover:bg-slate-800/50" : "hover:bg-slate-50")}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border-2 border-indigo-500/20">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>RA</AvatarFallback>
                                    </Avatar>
                                    <span className={cn("font-medium", isDark ? "text-slate-200" : "text-slate-900")}>
                                        Rafa
                                    </span>
                                </TableCell>
                                <TableCell className={isDark ? "text-slate-400" : "text-slate-600"}>
                                    rafamarketingdb@gmail.com
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("border-purple-500/50 text-purple-500 bg-purple-500/10")}>
                                        Super Admin
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-emerald-500 font-medium text-sm">Online</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
