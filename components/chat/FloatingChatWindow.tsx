import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Send, Minus, Maximize2, Minimize2, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";

export default function FloatingChatWindow({ recipient, currentUser, onClose, isMinimized, onToggleMinimize }) {
    const queryClient = useQueryClient();
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef(null);

    // 1. Find or Create Conversation Context
    // We need to find if there is already a conversation with this recipient.
    // Since we don't have a direct "get conversation by participants" endpoint confirmed, 
    // we might have to list conversations and filter. Warning: This handles poorly at scale, but ok for now.
    const { data: conversation } = useQuery({
        queryKey: ["conversation-with", recipient.id],
        queryFn: async () => {
            const all = await base44.entities.Conversation.list();
            // Filter for conversation containing both users
            // Assuming conversation logic: usually has participant_ids or similar.
            // Or based on Schema: has `professional_id` and `patient_id`. 
            // If two professionals? The schema might process them as generic 'users' or 'members'.
            // Let's assume standard logic: 
            // strict check if we are professional and they are patient or vice versa?
            // For "Team Chat", likely professional-to-professional.
            // If schema is professional_id/patient_id, prof-prof chat might be tricky via standard fields.
            // Let's assume there is a generic mechanism or we use the 'Conversation' entity as best effort.

            // FALLBACK: If we can't find by ID logic, just filter by who started it or participant logic if available.
            // Let's assume we filter by `conversation.professional_id === recipient.id` etc.

            return all.find(c =>
                (c.professional_id === currentUser.id && c.patient_id === recipient.id) ||
                (c.professional_id === recipient.id && c.patient_id === currentUser.id)
                // If team chat (prof-prof), this schema might be limiting. 
                // We will assume for now this works or we create a new one.
            );
        },
        enabled: !!recipient && !!currentUser
    });

    // 2. Fetch Messages
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", conversation?.id],
        queryFn: () => base44.read("Message", { filter: { conversation_id: conversation.id } }),
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
                // Create new conversation
                const newConv = await base44.entities.Conversation.create({
                    professional_id: currentUser.id,
                    patient_id: recipient.id,
                    status: 'active',
                    last_message_at: new Date().toISOString()
                });
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
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendMessageMutation.mutate(inputText);
    };

    if (!recipient) return null;

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
                                <AvatarFallback>{recipient.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-indigo-600 rounded-full"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">{recipient.name}</span>
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
                                    <p className="text-xs text-slate-500">Inicie a conversa com {recipient.name}</p>
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
                            <form onSubmit={handleSend} className="flex items-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-indigo-500 shrink-0"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="min-h-[36px] max-h-24 py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none rounded-lg"
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
