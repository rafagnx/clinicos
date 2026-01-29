import React, { useState } from "react";
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

export default function Chat() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
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
      const token = localStorage.getItem("token"); // ClinicOS specific
      // Use standard fetch for custom route
      const res = await fetch("/api/conversations/me", {
        headers: { "Authorization": `Bearer ${token}` } // Only if needed, otherwise cookie
        // Actually base44 handles auth automatically for most parts, but for custom fetch we might need credentials: include
      });
      if (!res.ok) return []; // Fallback
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

  const getStatus = (id: any) => {
    const sum = id.toString().split('').reduce((a: any, b: any) => a + b.charCodeAt(0), 0);
    return sum % 3 === 0 ? "offline" : (sum % 3 === 1 ? "busy" : "online");
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        users={filteredProfessionals}
        currentUser={currentUser}
        onGroupCreated={(group) => {
          refetchGroups();
          setActiveRecipient(group); // Auto open
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Chat Equipe</h1>
          <p className={cn("text-muted-foreground", isDark ? "text-slate-400" : "text-slate-500")}>
            Comunicação interna direta com sua equipe clínica e administrativa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateGroupOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className={cn(
                "pl-9 pr-4 py-2 rounded-xl text-sm w-full md:w-64 border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
                isDark ? "bg-[#1C2333] border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* GROUPS Grid */}
      {filteredGroups.length > 0 && (
        <div className="space-y-3">
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Grupos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGroups.map((group: any) => (
              <Card
                key={group.id}
                className={cn(
                  "group relative overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer",
                  isDark ? "bg-[#151A25] border-slate-800 hover:border-indigo-500/50" : "bg-white border-slate-200 hover:border-indigo-200",
                  activeRecipient?.id === group.id ? "ring-2 ring-indigo-500" : ""
                )}
                onClick={() => {
                  setActiveRecipient(group);
                  setIsMinimized(false);
                }}
              >
                <div className="p-5 flex items-start gap-4">
                  <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                      <Users className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className={cn("font-bold truncate pr-2 mt-1", isDark ? "text-white" : "text-slate-900")}>
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-500">{(group.admin_ids || []).length} Administradores</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Professionals Grid */}
      <div className="space-y-3">
        <h2 className={cn("text-sm font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Membros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProfessionals.map((prof: any) => {
            const status = getStatus(prof.id);
            const displayName = prof.name || prof.full_name || prof.email;

            return (
              <Card
                key={prof.id}
                className={cn(
                  "group relative overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer",
                  isDark ? "bg-[#151A25] border-slate-800 hover:border-indigo-500/50" : "bg-white border-slate-200 hover:border-indigo-200",
                  activeRecipient?.id === prof.id ? "ring-2 ring-indigo-500" : ""
                )}
                onClick={() => {
                  setActiveRecipient(prof);
                  setIsMinimized(false);
                }}
              >
                <div className="p-5 flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-sm">
                      <AvatarImage src={prof.photo_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        {displayName?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-800 rounded-full",
                      status === "online" ? "bg-emerald-500" : (status === "busy" ? "bg-amber-500" : "bg-slate-400")
                    )} title={status}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={cn("font-bold truncate pr-2", isDark ? "text-white" : "text-slate-900")}>
                        {displayName}
                      </h3>
                    </div>
                    <p className={cn("text-xs font-medium uppercase tracking-wider mb-2 truncate", isDark ? "text-indigo-400" : "text-indigo-600")}>
                      {prof.specialty || "Membro da Equipe"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{prof.email}</span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "px-5 py-3 border-t bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between transition-colors",
                  isDark ? "border-slate-800" : "border-slate-100 group-hover:bg-indigo-50/30"
                )}>
                  <span className={cn("text-xs font-medium flex items-center gap-1.5",
                    status === "online" ? "text-emerald-500" : "text-slate-400"
                  )}>
                    <Circle className={cn("w-2 h-2 fill-current")} />
                    {status === "online" ? "Disponível" : "Ausente"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Conversar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Floating Window */}
      {activeRecipient && currentUser && (
        <FloatingChatWindow
          recipient={activeRecipient}
          currentUser={currentUser}
          onClose={() => setActiveRecipient(null)}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
      )}
    </div>
  );
}
