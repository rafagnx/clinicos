import React, { useEffect, useState } from "react";
import { useAdminTheme } from "./AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    createdAt: string;
    user_type?: string;
}

export default function AdminUsers() {
    const { isDark } = useAdminTheme();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Fetch users from the 'user' table (Better Auth default)
            const { data, error } = await supabase
                .from('user')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError("Falha ao carregar usuários. Verifique as permissões.");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'nm';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Usuários Globais</h1>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        Gerencie o acesso de usuários ao sistema.
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500">
                    Total: {users.length}
                </div>
            </div>

            <Card className={cn("border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                <CardHeader>
                    <CardTitle className={cn(isDark ? "text-white" : "text-slate-900")}>Últimos Cadastros</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 text-red-500 bg-red-500/10 rounded-lg">
                            {error}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            Nenhum usuário encontrado.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className={cn("border-b", isDark ? "border-slate-800 hover:bg-slate-800/50" : "hover:bg-slate-100/50")}>
                                    <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Usuário</TableHead>
                                    <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Email</TableHead>
                                    <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Função</TableHead>
                                    <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Tipo</TableHead>
                                    <TableHead className={isDark ? "text-slate-400" : "text-slate-500"}>Data Cadastro</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className={cn("border-b", isDark ? "border-slate-800 hover:bg-slate-800/50" : "hover:bg-slate-50")}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border-2 border-indigo-500/20">
                                                <AvatarImage src={user.image} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className={cn("font-medium", isDark ? "text-slate-200" : "text-slate-900")}>
                                                {user.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className={isDark ? "text-slate-400" : "text-slate-600"}>
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "capitalize",
                                                user.role === 'admin'
                                                    ? "border-purple-500/50 text-purple-500 bg-purple-500/10"
                                                    : "border-slate-500/50 text-slate-500 bg-slate-500/10"
                                            )}>
                                                {user.role || 'user'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn("text-sm capitalize", isDark ? "text-slate-400" : "text-slate-600")}>
                                                {user.user_type || 'Padrão'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                                                {formatDate(user.createdAt)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}



