import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NewConversationDialog({ open, onOpenChange, currentUser, onCreated }) {
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");

    const handleSearch = async () => {
        // Mock user search - in real app would search backend
        // For now getting professionals and patients
        const professionals = await base44.entities.Professional.list();
        const patients = await base44.entities.Patient.list();

        const allUsers = [
            ...professionals.map(p => ({ ...p, type: "professional", email: p.email || `${p.name.toLowerCase().replace(/\s/g, '.')}@clinic.com` })),
            ...patients.map(p => ({ ...p, type: "patient", email: p.email || `${p.full_name.toLowerCase().replace(/\s/g, '.')}@patient.com` }))
        ].filter(u => u.email !== currentUser.email);

        if (search) {
            setUsers(allUsers.filter(u =>
                (u.name || u.full_name).toLowerCase().includes(search.toLowerCase())
            ));
        } else {
            setUsers(allUsers);
        }
    };

    React.useEffect(() => {
        if (open) {
            handleSearch();
            setStep(1);
            setSelectedUsers([]);
            setGroupName("");
            setSearch("");
        }
    }, [open]);

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const isGroup = selectedUsers.length > 1;

            const newConversation = await base44.entities.Conversation.create({
                type: isGroup ? "group" : "individual",
                participants: [currentUser.email, ...selectedUsers.map(u => u.email)],
                participant_names: [currentUser.name, ...selectedUsers.map(u => u.name || u.full_name)],
                participant_photos: [currentUser.photo_url, ...selectedUsers.map(u => u.photo_url)],
                name: isGroup ? groupName || "Novo Grupo" : null,
                created_by: currentUser.email,
                admins: [currentUser.email],
                unread_count: {},
                updated_at: new Date().toISOString()
            });

            onCreated(newConversation);
            onOpenChange(false);
            toast.success("Conversa iniciada!");
        } catch (error) {
            toast.error("Erro ao criar conversa");
        }
    };

    const toggleUser = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {step === 1 && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar pessoas..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        handleSearch();
                                    }}
                                    className="pl-10"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {users.map(user => {
                                    const isSelected = selectedUsers.find(u => u.id === user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUser(user)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                                                }`}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.photo_url} />
                                                <AvatarFallback>
                                                    <User className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-slate-800">
                                                    {user.name || user.full_name}
                                                </p>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {user.type === "professional" ? user.role || "Profissional" : "Paciente"}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-sm text-slate-500">
                                    {selectedUsers.length} selecionados
                                </p>
                                <Button
                                    onClick={() => selectedUsers.length > 1 ? setStep(2) : handleCreate()}
                                    disabled={selectedUsers.length === 0}
                                >
                                    {selectedUsers.length > 1 ? "Próximo" : "Criar conversa"}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <Label>Nome do Grupo</Label>
                                <Input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Ex: Equipe Médica"
                                />
                            </div>

                            <div className="max-h-[200px] overflow-y-auto">
                                <Label className="mb-2 block">Participantes</Label>
                                <div className="space-y-2">
                                    {selectedUsers.map(user => (
                                        <div key={user.id} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.photo_url} />
                                                <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                                            </Avatar>
                                            <span>{user.name || user.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Voltar
                                </Button>
                                <Button onClick={handleCreate} disabled={!groupName}>
                                    Criar Grupo
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

