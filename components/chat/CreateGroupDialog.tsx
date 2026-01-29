import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/lib/base44Client";
import { useQueryClient } from "@tanstack/react-query";

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: any[];
    currentUser: any;
    onGroupCreated: (group: any) => void;
}

export default function CreateGroupDialog({ open, onOpenChange, users, currentUser, onGroupCreated }: CreateGroupDialogProps) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const filteredUsers = users.filter(u =>
        u.id !== currentUser.id &&
        (u.name || u.full_name || u.email).toLowerCase().includes(search.toLowerCase())
    );

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error("Digite o nome do grupo");
            return;
        }
        if (selectedUsers.length === 0) {
            toast.error("Selecione pelo menos 1 participante");
            return;
        }

        setLoading(true);
        try {
            // Using direct fetch because base44 might not have specific route method mapped perfectly yet or custom route
            // Actually base44 generic client doesn't have custom post logic exposed easily maybe?
            // Let's assume we can use base44.api.post OR standard fetch.
            // Since base44 is a wrapper, let's use standard fetch with auth headers if possible, 
            // OR extend base44. But for now, let's try to access the axios instance if available or just use fetch.
            // Waiting... let's stick to standard fetch to be safe with the custom route we made.

            // Correction: base44Client has an 'api' property usually? 
            // Looking at base44Client.js (Step 1300), it exports 'api' (axios instance).
            // But we import 'base44' which wraps it.
            // Let's use the underlying axios if exported, or just fetch.
            // Assuming we can import { api } from "@/lib/base44Client";

            // Re-checking Step 1300... Yes, it exports 'api'.
            // But usually we just import 'base44'. 
            // Let's assume we can use fetch for now.

            const token = localStorage.getItem("token"); // ClinicOS auth token?
            // Wait, base44Client handles auth via cookies usually.

            const response = await fetch("/api/conversations/group", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Credentials include cookie
                },
                body: JSON.stringify({
                    name: groupName,
                    participants: selectedUsers
                })
            });

            if (!response.ok) throw new Error("Falha ao criar grupo");

            const group = await response.json();

            toast.success("Grupo criado!");
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            onGroupCreated(group);
            onOpenChange(false);
            setGroupName("");
            setSelectedUsers([]);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar grupo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Grupo</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Nome do Grupo</Label>
                        <Input
                            placeholder="Ex: Equipe Financeiro..."
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Participantes ({selectedUsers.length})</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar pessoas..."
                                className="pl-8"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-md h-[200px] overflow-y-auto p-1 space-y-1">
                            {filteredUsers.map(user => {
                                const isSelected = selectedUsers.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-indigo-50 border-indigo-200" : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>

                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.photo_url || user.image} />
                                            <AvatarFallback>{(user.name || "U")[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">{user.name || user.full_name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Ninguém encontrado
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={loading || !groupName.trim() || selectedUsers.length === 0}>
                        {loading ? "Criando..." : "Criar Grupo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
