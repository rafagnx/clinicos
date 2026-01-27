import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquarePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onNewConversation,
    currentUserEmail
}) {
    const [search, setSearch] = React.useState("");

    const filtered = conversations.filter(conv => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return conv.name?.toLowerCase().includes(searchLower) ||
            conv.participant_names?.some(name => name?.toLowerCase().includes(searchLower));
    });

    const getConversationName = (conv) => {
        if (conv.type === "group") return conv.name || "Grupo sem nome";
        const otherNames = conv.participant_names?.filter((_, idx) =>
            conv.participants[idx] !== currentUserEmail
        );
        return otherNames?.[0] || "Conversa";
    };

    const getConversationPhoto = (conv) => {
        if (conv.type === "group") return null;
        const otherIdx = conv.participants?.findIndex(p => p !== currentUserEmail);
        return otherIdx >= 0 ? conv.participant_photos?.[otherIdx] : null;
    };

    const getUnreadCount = (conv) => {
        return conv.unread_count?.[currentUserEmail] || 0;
    };

    return (
        <div className="h-full flex flex-col bg-white border-r">
            <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-bold text-slate-800 flex-1">Mensagens</h2>
                    <Button
                        size="icon"
                        onClick={onNewConversation}
                        className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar conversas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-400 text-sm">Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    filtered.map((conv) => {
                        const unread = getUnreadCount(conv);
                        const isSelected = conv.id === selectedId;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={cn(
                                    "w-full p-4 border-b hover:bg-slate-50 transition-colors text-left flex items-start gap-3",
                                    isSelected && "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-600"
                                )}
                            >
                                <Avatar className="h-12 w-12 shrink-0">
                                    <AvatarImage src={getConversationPhoto(conv)} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                        {getConversationName(conv)?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {getConversationName(conv)}
                                        </p>
                                        {conv.last_message_at && (
                                            <span className="text-xs text-slate-400 shrink-0">
                                                {formatDistanceToNow(new Date(conv.last_message_at), {
                                                    locale: ptBR,
                                                    addSuffix: false
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-slate-500 truncate flex-1">
                                            {conv.last_message || "Nenhuma mensagem ainda"}
                                        </p>
                                        {unread > 0 && (
                                            <Badge className="bg-blue-600 hover:bg-blue-600 h-5 px-2 text-xs">
                                                {unread}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
