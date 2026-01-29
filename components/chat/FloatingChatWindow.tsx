import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { X, Send, Minus, Maximize2, Minimize2, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function FloatingChatWindow({ recipient, currentUser, onClose, isMinimized, onToggleMinimize }) {
    const queryClient = useQueryClient();
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef(null);

    // 1. Find or Create Conversation Context
    const { data: conversation } = useQuery({
        queryKey: ["conversation-with", recipient.id],
        queryFn: async () => {
            const all = await base44.entities.Conversation.list();
            return all.find(c =>
                // Case 1: Standard Prof-Patient
                (c.professional_id === currentUser.id && c.patient_id === recipient.id) ||
                (c.professional_id === recipient.id && c.patient_id === currentUser.id) ||
                // Case 2: Team Chat (Prof-Prof) using new schema
                (c.professional_id === currentUser.id && c.recipient_professional_id === recipient.id) ||
                (c.professional_id === recipient.id && c.recipient_professional_id === currentUser.id)
            );
        },
        enabled: !!recipient && !!currentUser
    });

    // 2. Fetch Messages
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", conversation?.id],
        queryFn: () => base44.list("Message", { filter: { conversation_id: conversation.id } }),
        enabled: !!conversation,
        refetchInterval: 3000
    });

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    // 3. Send Mutation
    const sendMessageMutation = useMutation<any, Error, string>({
        mutationFn: async (text: string) => {
            let convId = conversation?.id;

            if (!convId) {
                // Determine if recipient is a patient or professional
                // For now, in "Chat Team", recipient is always professional.
                // We'll assume if they have 'role_type' or if we are in Team Chat context.
                // But safer to check:
                const isTeamChat = true; // Since this component is used in Chat.tsx which lists professionals.

                // Create new conversation
                const payload: any = {
                    professional_id: currentUser.id,
                    status: 'active',
                    last_message_at: new Date().toISOString()
                };

                if (isTeamChat) {
                    payload.recipient_professional_id = recipient.id;
                    // Ensure patient_id is not sent or is explicitly null if needed (API should handle missing)
                } else {
                    payload.patient_id = recipient.id;
                }

                const newConv = await base44.entities.Conversation.create(payload);
                convId = newConv.id;
            }

            return base44.entities.Message.create({
                conversation_id: convId,
                sender_id: currentUser.id,
                text,
                created_date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            setInputText("");
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["conversation-with"] });
        },
        onError: (err) => {
            console.error("Failed to send message", err);
        }
    });

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;
        sendMessageMutation.mutate(inputText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const addEmoji = (emoji: string) => {
        setInputText(prev => prev + emoji);
    };

    if (!recipient) return null;

    // Helper to get display name safely
    const displayName = recipient.name || recipient.full_name || recipient.email || "Usuário";

    const commonEmojis = ["👍", "👋", "🎉", "🔥", "❤️", "😂", "😮", "😢", "🙏", "✅", "❌", "📅"];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? "auto" : 450 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className={cn(
                    "fixed bottom-4 right-20 w-80 bg-white dark:bg-[#1C2333] border border-slate-200 dark:border-slate-800 rounded-t-xl shadow-2xl z-50 overflow-hidden flex flex-col",
                    isMinimized ? "rounded-b-xl" : "rounded-xl"
                )}
            >
                {/* Header */}
                <div
                    className="bg-indigo-600 p-3 flex items-center justify-between cursor-pointer"
                    onClick={onToggleMinimize}
                >
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Avatar className="w-8 h-8 border-2 border-white/20">
                                <AvatarImage src={recipient.photo_url} />
                                <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-indigo-600 rounded-full"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">{displayName}</span>
                            <span className="text-[10px] text-indigo-100 opacity-80 mt-0.5">Online agora</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-100 hover:text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}>
                            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-100 hover:text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                {!isMinimized && (
                    <>
                        <div
                            className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#0B0E14] space-y-3"
                            ref={scrollRef}
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-2">
                                        <Send className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <p className="text-xs text-slate-500">Inicie a conversa com {displayName}</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[80%] p-3 rounded-2xl text-xs relative group",
                                                isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm"
                                            )}>
                                                {msg.text}
                                                <span className={cn(
                                                    "text-[9px] block mt-1 opacity-70 text-right",
                                                    isMe ? "text-indigo-100" : "text-slate-400"
                                                )}>
                                                    12:30
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white dark:bg-[#1C2333] border-t dark:border-slate-800">
                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-indigo-500 shrink-0"
                                        >
                                            <Smile className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" sideOffset={10} side="top" align="start">
                                        <div className="grid grid-cols-6 gap-2">
                                            {commonEmojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    className="text-xl hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                                                    onClick={() => addEmoji(emoji)}
                                                    type="button"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Digite sua mensagem..."
                                    className="h-9 py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-lg"
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 shrink-0 transition-all",
                                        inputText.trim() ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
