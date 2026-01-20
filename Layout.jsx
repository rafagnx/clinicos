import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, BarChart3,
  Menu, X, LogOut, Settings, ChevronDown, Bell, Tag, MessageSquare, Target, Building2, ArrowLeft,
  ChevronLeft, ChevronRight, Activity, DollarSign
} from "lucide-react";
import NotificationList from "@/components/notifications/NotificationList";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Agenda", href: "Agenda", icon: Calendar },
  { name: "Pacientes", href: "Patients", icon: Users },
  { name: "Leads", href: "Leads", icon: Target },
  { name: "Chat", href: "Chat", icon: MessageSquare },
  { name: "Promoções", href: "Promotions", icon: Tag },
  { name: "WhatsApp", href: "WhatsAppSettings", icon: MessageSquare },
  { name: "Equipe", href: "Professionals", icon: Stethoscope },
  { name: "Prontuários", href: "MedicalRecords", icon: FileText },
  { name: "Financeiro", href: "Financial", icon: DollarSign },
  { name: "Relatórios", href: "Reports", icon: BarChart3 },
  { name: "Configurações", href: "ClinicSettings", icon: Settings },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const u = await base44.auth.me();
        return u;
      } catch (e) {
        return null;
      }
    },
    retry: false
  });

  useEffect(() => {
    if (!authLoading && !user && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const all = await base44.entities.ClinicSettings.list();
      return all[0] || null;
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavItem = ({ item, isActive }) => (
    <Link
      to={createPageUrl(item.href)}
      className={`
        flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
        ${isCollapsed ? "justify-center px-0" : "px-4"}
        ${isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }
      `}
      onClick={() => setSidebarOpen(false)}
    >
      <div className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-white"} transition-colors shrink-0`}>
        <item.icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
      </div>
      {!isCollapsed && (
        <span className="truncate">{item.name}</span>
      )}
      {isCollapsed && isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-md"></div>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED Position */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 h-[100dvh]
          bg-[#111827] border-r border-[#1f2937]
          transition-transform md:transition-all duration-300 ease-in-out
          shadow-2xl md:shadow-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          w-64
        `}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center h-16 border-b border-[#1f2937] shrink-0 ${isCollapsed ? "justify-center px-0" : "justify-between px-6"}`}>
          {!isCollapsed ? (
            <>
              {clinicSettings?.logo_url ? (
                <img
                  src={clinicSettings.logo_url}
                  alt={clinicSettings.clinic_name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <Activity className="w-6 h-6 text-blue-500" />
                  <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">ClinicOS</span>
                </div>
              )}
            </>
          ) : (
            <Activity className="w-8 h-8 text-blue-500" />
          )}
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white absolute right-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          <TooltipProvider delayDuration={0}>
            {navigation.map((item) => {
              const isActive = location.pathname.includes(item.href);
              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div><NavItem item={item} isActive={isActive} /></div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 ml-2 z-50">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return <NavItem key={item.name} item={item} isActive={isActive} />
            })}
          </TooltipProvider>

          {/* Admin Link */}
          {(user?.email === "rafamarketingdb@gmail.com" || user?.role === "admin") && (
            <div className={`mt-6 pt-6 border-t border-[#1f2937] ${isCollapsed ? "px-2" : "px-4"}`}>
              <Link
                to="/admin"
                className={`
                  flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isCollapsed ? "justify-center px-0" : "px-4"}
                  text-rose-400 hover:bg-rose-900/20 hover:text-rose-300
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Target className="w-5 h-5" />
                {!isCollapsed && <span>Super Admin</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-[#1f2937] bg-[#0f1522] shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`w-full h-auto p-0 hover:bg-[#1f2937] shadow-none border-0 ${isCollapsed ? "justify-center" : "justify-start px-2 py-2"}`}>
                  <Avatar className="h-9 w-9 border border-[#374151]">
                    <AvatarImage src={user.photo_url} />
                    <AvatarFallback className="bg-blue-600 text-white font-medium">
                      {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 text-left ml-3 min-w-0 transition-opacity duration-200">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || user.display_name || user.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-slate-400 truncate w-full">{user.email}</p>
                    </div>
                  )}
                  {!isCollapsed && <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 bg-[#1f2937] border-[#374151] text-white z-50 ml-2" sideOffset={10}>
                <div className="px-3 py-3 border-b border-[#374151]">
                  <p className="text-sm font-medium text-white">
                    {user.name || user.display_name || user.full_name || "Usuário"}
                  </p>
                  <span className="text-xs text-slate-400 capitalize">{user.role || "Usuário"}</span>
                </div>
                <DropdownMenuSeparator className="bg-[#374151]" />
                <DropdownMenuItem asChild className="focus:bg-[#374151] focus:text-white cursor-pointer py-2">
                  <Link to={createPageUrl("Profile")} className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-rose-400 focus:bg-rose-900/20 focus:text-rose-300 cursor-pointer py-2"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Main Content Area - Responsive MARGINS - CRITICAL FIX */}
      <div
        className={`
          flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:ml-20" : "md:ml-64"}
        `}
      >
        {/* Header - Sticky */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm w-full">

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="-ml-2">
              <Menu className="w-6 h-6 text-slate-700" />
            </Button>
            <span className="font-semibold text-slate-900">ClinicOS</span>
          </div>

          {/* Desktop Sidebar Toggle & Info */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
            <div className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-full">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-slate-200" align="end">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="font-semibold text-slate-900">Notificações</h4>
                  {unreadCount > 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-700">{unreadCount} novas</Badge>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  <NotificationList
                    notifications={notifications}
                    onMarkAsRead={async (id) => await base44.entities.Notification.update(id, { read: true })}
                    onDelete={async (id) => await base44.entities.Notification.delete(id)}
                    onSendEmail={async () => { }}
                    user={user}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Mobile User Avatar */}
            <div className="md:hidden">
              <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                <AvatarImage src={user?.photo_url} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {user?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative w-full">
          {children}
        </main>
      </div>

      <NotificationPermissionPrompt />
    </div>
  );
}
