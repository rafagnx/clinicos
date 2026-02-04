import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { useChat } from "@/context/ChatContext";

export default function ChatActivityWidget({ professionals, currentUserId }) {
    const { openChat, getStatus } = useChat();

    // Filter out current user and take first 4
    const teamMembers = (professionals || [])
        .filter(p => p.id !== currentUserId && p.user_id !== currentUserId)
        .slice(0, 4);

    const getDisplayName = (member) => {
        return member.name || member.full_name || member.email?.split('@')[0] || "Membro";
    };

    return (
        <Card className="p-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full dark:bg-[#151A25] dark:border dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Atividade do Chat</h3>
                </div>
                <Link to={createPageUrl("Chat")}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300">
                        Ver todos
                    </Badge>
                </Link>
            </div>

            {teamMembers.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">Nenhum membro na equipe</p>
            ) : (
                <div className="space-y-3">
                    {teamMembers.map((member) => {
                        const status = getStatus(member.id);
                        const displayName = getDisplayName(member);

                        return (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
                                onClick={() => openChat(member)}
                            >
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.photo_url} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-bold dark:bg-indigo-900/30 dark:text-indigo-400">
                                            {displayName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full dark:border-[#151A25] ${status === "online" ? "bg-emerald-500" :
                                        status === "busy" ? "bg-amber-500" : "bg-slate-400"
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {member.specialty || member.role || "Membro da Equipe"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                    <Circle className={`w-2 h-2 fill-current ${status === "online" ? "text-emerald-500" :
                                        status === "busy" ? "text-amber-500" : "text-slate-400"
                                        }`} />
                                    <span className={
                                        status === "online" ? "text-emerald-500" :
                                            status === "busy" ? "text-amber-500" : "text-slate-400"
                                    }>
                                        {status === "online" ? "Online" : status === "busy" ? "Ocupado" : "Ausente"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
