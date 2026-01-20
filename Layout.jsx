import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, BarChart3,
  Menu, X, LogOut, Settings, ChevronDown, Bell, Tag, MessageSquare, Target, Building2, ArrowLeft, Star, DollarSign,
  ChevronLeft, ChevronRight
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile Drawer State
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini Sidebar State

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

  // Render a Nav Link
  const NavItem = ({ item, isActive }) => (
    <Link
      to={createPageUrl(item.href)}
      className={`
          flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
          ${isCollapsed ? "justify-center px-2" : "px-4"}
          ${isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }
        `}
      onClick={() => setSidebarOpen(false)}
    >
      <div className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
        <item.icon className="w-5 h-5" />
      </div>
      {!isCollapsed && (
        <span className="truncate">{item.name}</span>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#111827] border-r border-[#1f2937] shadow-xl md:shadow-none
        transform transition-all duration-300 ease-in-out shrink-0 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:h-screen
        ${isCollapsed ? "md:w-20" : "md:w-64"}
        w-64
      `}>
        {/* Sidebar Header / Logo */}
        <div className={`flex items-center h-20 border-b border-[#1f2937] relative z-10 ${isCollapsed ? "justify-center px-2" : "justify-between px-6"}`}>
          {!isCollapsed ? (
            <>
              {clinicSettings?.logo_url ? (
                <img
                  src={clinicSettings.logo_url}
                  alt={clinicSettings.clinic_name}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <Building2 className="w-8 h-8 text-blue-500" />
                  <span className="text-lg font-bold tracking-tight">ClinicOS</span>
                </div>
              )}
              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          )}

        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          <TooltipProvider delayDuration={0}>
            {navigation.map((item) => {
              const isActive = location.pathname.includes(item.href);
              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div><NavItem item={item} isActive={isActive} /></div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return <NavItem key={item.name} item={item} isActive={isActive} />
            })}
          </TooltipProvider>

          {/* System Admin Link */}
          {(user?.email === "rafamarketingdb@gmail.com" || user?.role === "admin") && (
            <div className="pt-4 mt-4 border-t border-[#1f2937]">
              <Link
                to="/admin"
                className={`
                        flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                        ${isCollapsed ? "justify-center px-2" : "px-4"}
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
          <div className="p-4 border-t border-[#1f2937] relative z-10 w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`w-full h-auto p-0 hover:bg-[#1f2937] ${isCollapsed ? "justify-center py-2" : "justify-start px-2 py-2"}`}>
                  <Avatar className="h-9 w-9 border border-[#374151]">
                    <AvatarImage src={user.photo_url} />
                    <AvatarFallback className="bg-blue-600 text-white font-medium">
                      {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 text-left ml-3 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || user.display_name || user.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-slate-400 truncate w-full">{user.email}</p>
                    </div>
                  )}
                  {!isCollapsed && <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#1f2937] border-[#374151] text-white">
                <div className="px-3 py-2 border-b border-[#374151]">
                  <p className="text-sm font-medium text-white">
                    {user.name || user.display_name || user.full_name || "Usuário"}
                  </p>
                  <span className="text-xs text-slate-400 capitalize">{user.role || "Usuário"}</span>
                </div>
                <DropdownMenuSeparator className="bg-[#374151]" />
                <DropdownMenuItem asChild className="focus:bg-[#374151] focus:text-white">
                  <Link to={createPageUrl("Profile")} className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-rose-400 focus:bg-rose-900/20 focus:text-rose-300"
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

      {/* Main content */}
      <div className={`flex-1 min-w-0 flex flex-col h-screen overflow-y-auto transition-all duration-300`}>
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-4 h-16 px-6 bg-white border-b border-slate-200">
          {/* Left: Toggle & Page Info */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-500 hover:text-slate-700"
              title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
            {/* Optional: Breadcrumbs or Page Title could go here */}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 hover:bg-slate-100"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 text-white text-xs border-2 border-white font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4" align="end" sideOffset={8}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="font-semibold text-slate-900">Notificações</h4>
                  {unreadCount > 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-700">{unreadCount} novas</Badge>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  <NotificationList
                    notifications={notifications}
                    onMarkAsRead={async (id) => {
                      await base44.entities.Notification.update(id, { read: true });
                    }}
                    onDelete={async (id) => {
                      await base44.entities.Notification.delete(id);
                    }}
                    onSendEmail={async (notif) => {
                      // ...
                    }}
                    user={user}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-3 h-auto p-2 hover:bg-slate-50">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {user.email === "rafamarketingdb@gmail.com"
                            ? (user.name || user.display_name || user.full_name || "Usuário")
                            : (user.user_type === "profissional" ? `Dr(a). ${user.name || user.display_name || user.full_name || "Usuário"}` : user.name || user.display_name || user.full_name || "Usuário")
                          }
                        </p>
                        {user.role === "admin" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium text-[9px]">
                            Admin
                          </span>
                        )}
                      </div>
                      {user.email !== "rafamarketingdb@gmail.com" && (
                        <p className="text-xs text-slate-500">{user.email}</p>
                      )}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photo_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {user.email === "rafamarketingdb@gmail.com"
                            ? (user.name || user.display_name || user.full_name || "Usuário")
                            : (user.user_type === "profissional" ? `Dr(a). ${user.name || user.display_name || user.full_name || "Usuário"}` : user.name || user.display_name || user.full_name || "Usuário")
                          }
                        </p>
                        {user.email !== "rafamarketingdb@gmail.com" && (
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        )}
                      </div>
                      {user.role === "admin" && (
                        <span className="shrink-0 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-[10px] shadow-lg">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-rose-600"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-700" />
          </Button>

          <span className="font-semibold text-slate-800">ClinicOS</span>

          <div className="flex items-center gap-2">
            {/* Mobile Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-6 h-6 text-slate-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -1 -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full p-0 flex items-center justify-center text-[10px] text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Profile Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photo_url} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />
    </div>
  );
}
