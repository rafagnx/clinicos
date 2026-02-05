import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, MessageSquare, MoreVertical, Phone, Mail, MapPin, Circle, Plus, Users } from "lucide-react";
import FloatingChatWindow from "@/components/chat/FloatingChatWindow";
import CreateGroupDialog from "@/components/chat/CreateGroupDialog";
import { supabase } from "@/lib/supabaseClient";

import { useChat } from "@/context/ChatContext"; // Import Context

export default function Chat() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  // Remove local state
  // const [activeRecipient, setActiveRecipient] = useState(null);
  // const [isMinimized, setIsMinimized] = useState(false);
  const { openChat, activeRecipient } = useChat(); // Use Context

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["auth-user"],
    queryFn: () => base44.auth.me()
  });

  // Fetch Professionals
  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list({ sort: [{ field: "name", direction: "asc" }] })
  });

  // Fetch My Conversations (Groups included)
  const { data: myConversations = [], refetch: refetchGroups } = useQuery({
    queryKey: ["my-conversations"],
    queryFn: async () => {
      // Get Token correctly (Supabase or Fallback)
      let token = null;
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
      } else {
        token = localStorage.getItem("clinicos-token");
      }

      if (!token) return [];

      const res = await fetch("/api/conversations/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const groups = myConversations.filter((c: any) => c.is_group);

  const filteredProfessionals = (professionals || [])
    .filter((p: any) => p.id !== currentUser?.id)
    .filter((p: any) =>
      (p.name || p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Combine for search if needed, but let's keep groups separate for now or top
  const filteredGroups = groups.filter((g: any) =>
    (g.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { getStatus } = useChat();

  return (
    <div className={cn("p-4 lg:p-4 max-w-7xl mx-auto space-y-4 min-h-screen relative overflow-hidden")}>
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        users={filteredProfessionals}
        currentUser={currentUser}
        onGroupCreated={(group) => {
          refetchGroups();
          openChat(group); // Use Context
        }}
      />

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1">
            <MessageSquare className="w-2.5 h-2.5" /> COMUNICAÇÃO INTERNA
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            CHAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">EQUIPE</span>
          </h1>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
            Colaboração em tempo real para sua clínica.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64 group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              isDark ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-600"
            )} />
            <input
              type="text"
              placeholder="Buscar..."
              className={cn(
                "pl-10 pr-4 h-10 rounded-xl text-sm w-full border transition-all focus:outline-none",
                isDark
                  ? "bg-slate-950/40 border-white/5 focus:bg-slate-900/60 focus:border-blue-500/50 text-white placeholder:text-slate-500"
                  : "bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 text-slate-900"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="h-10 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-3.5 h-3.5 mr-2 relative z-10" />
            <span className="relative z-10">Novo Grupo</span>
          </Button>
        </div>
      </div>

      {/* GROUPS Grid */}
      {filteredGroups.length > 0 && (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-slate-500" : "text-slate-400")}>Grupos de Trabalho</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-500/10 via-slate-500/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredGroups.map((group: any, idx: number) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "group relative overflow-hidden p-4 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:bg-white/5 hover:-translate-y-1 cursor-pointer shadow-sm",
                    isDark ? "bg-slate-950/20" : "bg-white/20",
                    activeRecipient?.id === group.id ? "ring-2 ring-indigo-500/50" : ""
                  )}
                  onClick={() => openChat(group)}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <Avatar className="w-12 h-12 border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-black">
                        <Users className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-sm font-black tracking-tight truncate leading-tight", isDark ? "text-white" : "text-slate-900")}>
                        {group.name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {(group.admin_ids || []).length} Administradores
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Professionals Grid */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <h2 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-slate-500" : "text-slate-400")}>Membros da Clínica</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-500/10 via-slate-500/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProfessionals.map((prof: any, idx: number) => {
              const status = getStatus(prof.id);
              const displayName = prof.name || prof.full_name || prof.email;

              return (
                <motion.div
                  key={prof.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "group relative overflow-hidden p-4 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:bg-white/5 hover:-translate-y-1 cursor-pointer shadow-sm",
                    isDark ? "bg-slate-950/20" : "bg-white/20",
                    activeRecipient?.id === prof.id ? "ring-2 ring-indigo-500/50" : ""
                  )}
                  onClick={() => openChat(prof)}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12 border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                        <AvatarImage src={prof.photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black">
                          {displayName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 border-2 transition-colors duration-500",
                        isDark ? "border-slate-900" : "border-white",
                        "rounded-full shadow-sm",
                        status === "online" ? "bg-emerald-500" : (status === "busy" ? "bg-amber-500" : "bg-slate-400")
                      )} title={status}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-sm font-black tracking-tight truncate leading-tight group-hover:text-blue-400 transition-colors", isDark ? "text-white" : "text-slate-900")}>
                        {displayName}
                      </h3>
                      <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 truncate opacity-70", isDark ? "text-indigo-400" : "text-indigo-600")}>
                        {prof.specialty || "Membro da Equipe"}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                          status === "online" ? "text-emerald-500/80" : (status === "busy" ? "text-amber-500/80" : "text-slate-500")
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", status === "online" ? "bg-emerald-500 animate-pulse" : (status === "busy" ? "bg-amber-500" : "bg-slate-400"))} />
                          {status === "online" ? "Online" : (status === "busy" ? "Ocupado" : "Ausente")}
                        </span>
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* REMOVED: Floating Window Local Render */}
    </div>
  );
}



