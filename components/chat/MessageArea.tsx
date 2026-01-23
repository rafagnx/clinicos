import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/lib/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileIcon, Download, Loader2, Trash2, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessageArea({
    conversation,
    messages,
    currentUser,
    onSendMessage,
    onDeleteConversation
}) {
    const [newMessage, setNewMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark as read when viewing
    useEffect(() => {
        if (!conversation || !messages.length) return;

        const unreadMessages = messages.filter(m =>
            m.sender_email !== currentUser.email &&
            !m.read_by?.includes(currentUser.email)
        );

        unreadMessages.forEach(msg => {
            base44.entities.Message.update(msg.id, {
                ...msg,
                read_by: [...(msg.read_by || []), currentUser.email]
            }).catch(() => { });
        });

        // Update conversation unread count
        if (unreadMessages.length > 0) {
            base44.entities.Conversation.update(conversation.id, {
                ...conversation,
                unread_count: {
                    ...conversation.unread_count,
                    [currentUser.email]: 0
                }
            }).catch(() => { });
        }
    }, [conversation, messages, currentUser]);

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        try {
            const uploadedFiles = await Promise.all(
                selectedFiles.map(async (file) => {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    return { url: file_url, name: file.name };
                })
            );
            setFiles(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
            toast.error("Erro ao fazer upload dos arquivos");
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = () => {
        if (!newMessage.trim() && files.length === 0) return;

        onSendMessage({
            content: newMessage.trim(),
            file_urls: files.map(f => f.url),
            file_names: files.map(f => f.name)
        });

        setNewMessage("");
        setFiles([]);
    };

    const getConversationTitle = () => {
        if (conversation.type === "group") {
            return conversation.name || "Grupo";
        }
        const otherNames = conversation.participant_names?.filter((_, idx) =>
            conversation.participants[idx] !== currentUser.email
        );
        return otherNames?.[0] || "Conversa";
    };

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <p className="text-slate-400">Selecione uma conversa</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.type === "individual" ? conversation.participant_photos?.[conversation.participants?.findIndex(p => p !== currentUser.email)] : null} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getConversationTitle()?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{getConversationTitle()}</h3>
                    {conversation.type === "group" && (
                        <p className="text-xs text-slate-500">
                            {conversation.participants?.length || 0} participantes
                        </p>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => {
                                if (confirm("Deseja apagar esta conversa?")) {
                                    onDeleteConversation(conversation.id);
                                }
                            }}
                            className="gap-2 text-rose-600"
                        >
                            <Trash2 className="w-4 h-4" />
                            Apagar conversa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-slate-400 text-sm">Nenhuma mensagem ainda</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isOwn = msg.sender_email === currentUser.email;
                        const showAvatar = !isOwn && (
                            idx === 0 ||
                            messages[idx - 1].sender_email !== msg.sender_email
                        );

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-2",
                                    isOwn ? "justify-end" : "justify-start"
                                )}
                            >
                                {!isOwn && (
                                    <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                                        <AvatarImage src={msg.sender_photo} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                            {msg.sender_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("max-w-[70%]", isOwn && "flex flex-col items-end")}>
                                    {showAvatar && !isOwn && (
                                        <p className="text-xs text-slate-500 mb-1 ml-1">{msg.sender_name}</p>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2",
                                            isOwn
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-800"
                                        )}
                                    >
                                        {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                                        {msg.file_urls?.length > 0 && (
                                            <div className="space-y-2 mt-2">
                                                {msg.file_urls.map((url, i) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-lg text-sm hover:opacity-80 transition-opacity",
                                                            isOwn ? "bg-blue-700" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <FileIcon className="w-4 h-4 shrink-0" />
                                                        <span className="flex-1 truncate">{msg.file_names?.[i] || "Arquivo"}</span>
                                                        <Download className="w-4 h-4 shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 mx-1">
                                        {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                {files.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm">
                                <FileIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-slate-700 max-w-[200px] truncate">{file.name}</span>
                                <button
                                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>
                    <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="resize-none"
                        rows={1}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() && files.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

