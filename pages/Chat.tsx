import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, MessageSquare, MoreVertical, Phone, Mail, MapPin, Circle } from "lucide-react";
import FloatingChatWindow from "@/components/chat/FloatingChatWindow";

export default function Chat() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ["auth-user"],
    queryFn: () => base44.auth.me()
  });

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list("-full_name")
  });

  const filteredProfessionals = professionals
    .filter(p => p.id !== currentUser?.id) // Exclude self
    .filter(p =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Mock status for now - random online/offline
  // In a real app, this would come from a websocket or polling 'last_active'
  const getStatus = (id) => {
    // Deterministic random based on ID char code sum
    const sum = id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return sum % 3 === 0 ? "offline" : (sum % 3 === 1 ? "busy" : "online");
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Chat Equipe</h1>
          <p className={cn("text-muted-foreground", isDark ? "text-slate-400" : "text-slate-500")}>
            Comunicação interna direta com sua equipe clínica e administrativa.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar membro da equipe..."
            className={cn(
              "pl-9 pr-4 py-2 rounded-xl text-sm w-full md:w-64 border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
              isDark ? "bg-[#1C2333] border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProfessionals.map((prof) => {
          const status = getStatus(prof.id);
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
                      {prof.full_name?.substring(0, 2).toUpperCase()}
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
                      {prof.full_name}
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

      {/* Floating Window */}
      {activeRecipient && currentUser && (
        <FloatingChatWindow
          recipient={activeRecipient}
          currentUser={currentUser}
          isOpen={!!activeRecipient}
          onClose={() => setActiveRecipient(null)}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
      )}
    </div>
  );
}
