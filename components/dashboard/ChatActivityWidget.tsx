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
        // Group conversations
        if (conv.type === "group") return conv.name || "Grupo";

        // Try participant_names array (filter out current user)
        if (conv.participant_names?.length > 0) {
            const otherNames = conv.participant_names.filter((name, idx) => {
                // Try to exclude current user by email or by comparing name
                const participantEmail = conv.participants?.[idx];
                return participantEmail !== currentUserEmail && name;
            });
            if (otherNames.length > 0) return otherNames[0];

            // If all filtered out, just return first name that's not empty
            const firstValidName = conv.participant_names.find(n => n && n.trim());
            if (firstValidName) return firstValidName;
        }

        // Try other fields that might contain names
        if (conv.recipient_name) return conv.recipient_name;
        if (conv.title) return conv.title;
        if (conv.name) return conv.name;

        // Last resort: show part of participant email if available
        const otherParticipant = conv.participants?.find(p => p !== currentUserEmail);
        if (otherParticipant && typeof otherParticipant === 'string') {
            return otherParticipant.split('@')[0]; // Show username part of email
        }

        return "Conversa";
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
