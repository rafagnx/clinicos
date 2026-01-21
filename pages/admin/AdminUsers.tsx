import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminUsers() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Usuários Globais</h1>
            <Card>
                <CardHeader><CardTitle>Últimos Acessos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8"><AvatarFallback>AD</AvatarFallback></Avatar>
                                    Super Admin
                                </TableCell>
                                <TableCell>admin@clinicos.com</TableCell>
                                <TableCell>Master</TableCell>
                                <TableCell><span className="text-green-600 font-medium">Online</span></TableCell>
                            </TableRow>
                            {/* More rows */}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
