import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function ChatActivityWidget({ conversations, currentUserEmail }) {
    const recentConversations = conversations
        .filter(c => c.last_message_at)
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
        .slice(0, 4);

    const getConversationName = (conv) => {
        if (conv.type === "group") return conv.name || "Grupo";
        const otherNames = conv.participant_names?.filter((_, idx) =>
            conv.participants[idx] !== currentUserEmail
        );
        return otherNames?.[0] || "Conversa";
    };

    const getUnread = (conv) => conv.unread_count?.[currentUserEmail] || 0;

    return (
        <Card className="p-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">Atividade do Chat</h3>
                </div>
                <Link to={createPageUrl("Chat")}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">
                        Ver todos
                    </Badge>
                </Link>
            </div>

            {recentConversations.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma conversa recente</p>
            ) : (
                <div className="space-y-3">
                    {recentConversations.map((conv) => {
                        const unread = getUnread(conv);
                        return (
                            <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={conv.type === "individual" ? conv.participant_photos?.[conv.participants?.findIndex(p => p !== currentUserEmail)] : null} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                                        {getConversationName(conv)?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-slate-800 truncate">{getConversationName(conv)}</p>
                                    <p className="text-xs text-slate-500 truncate mt-1">{conv.last_message}</p>
                                </div>
                                {unread > 0 && (
                                    <Badge className="bg-indigo-600 hover:bg-indigo-600 h-5 px-2 text-xs">
                                        {unread}
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
