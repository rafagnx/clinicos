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
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, BarChart3,
  Menu, X, LogOut, Settings, ChevronDown, Bell, Tag, MessageSquare, Target, Building2, ArrowLeft, Star, DollarSign
} from "lucide-react";
import NotificationList from "@/components/notifications/NotificationList";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";

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
  { name: "Financeiro", href: "Financial", icon: DollarSign }, // New Link
  { name: "Relatórios", href: "Reports", icon: BarChart3 },
  { name: "Configurações", href: "ClinicSettings", icon: Settings },
  { name: "Procedimentos", href: "Settings/Procedures", icon: Stethoscope },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if on a public route to avoid loop? No, Layout is only for protected routes.
    // If better-auth session is missing, we redirect.
    base44.auth.me().then((u) => {
      if (!u && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      setUser(u);
    }).catch(() => {
      window.location.href = '/login';
    });
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-100 
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:z-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693c124e6b101587747b5b3e/13b7a1377_Designsemnome.png"
              alt="ClinicOS"
              className="h-16 w-auto"
            />
            <div className="w-9" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 relative z-10">
            {navigation.map((item, idx) => {
              const isActive = location.pathname.includes(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={createPageUrl(item.href)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    </motion.div>
                    {item.name}
                  </Link>
                </motion.div>
              );
            })}
            {/* System Admin Link */}
            {(user?.email === "rafamarketingdb@gmail.com" || user?.role === "admin") && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-all duration-200 mt-4 border border-rose-100"
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Target className="w-5 h-5" />
                  </motion.div>
                  Super Admin
                </Link>
              </motion.div>
            )}
          </nav>

          {/* User */}
          {user && (
            <div className="p-4 border-t border-slate-100 relative z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photo_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {user.email === "rafamarketingdb@gmail.com"
                          ? (user.display_name || user.full_name || "Usuário")
                          : (user.user_type === "profissional" ? `Dr(a). ${user.display_name || user.full_name || "Usuário"}` : user.display_name || user.full_name || "Usuário")
                        }
                      </p>
                      {user.email !== "rafamarketingdb@gmail.com" && (
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">
                      {user.user_type === "profissional" ? `Dr(a). ${user.display_name || user.full_name || "Usuário"}` : user.display_name || user.full_name || "Usuário"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.user_type && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <div className={`w-2 h-2 rounded-full ${user.user_type === "profissional" ? "bg-blue-500" :
                            user.user_type === "secretaria" ? "bg-green-500" :
                              "bg-purple-500"
                            }`} />
                          {user.user_type === "profissional" ? "Profissional" :
                            user.user_type === "secretaria" ? "Secretária" :
                              "Marketing"}
                        </span>
                      )}
                      {user.role === "admin" && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-[10px] shadow-lg">
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
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Desktop header */}
        <header className="hidden lg:flex sticky top-0 z-30 items-center justify-center gap-2 h-20 px-6 bg-white border-b border-slate-100 relative">
          {/* Menu Toggle Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo da Clínica */}
          <div className="flex items-center justify-center">
            {clinicSettings?.logo_url ? (
              <img
                src={clinicSettings.logo_url}
                alt={clinicSettings.clinic_name || "Clínica"}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-slate-400" />
                <span className="text-lg font-semibold text-slate-600">
                  {clinicSettings?.clinic_name || "Clínica"}
                </span>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4 absolute right-4">
            {user && (
              <>
                {/* Notification Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 hover:bg-slate-100"
                  onClick={() => setNotificationsOpen(true)}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 text-white text-xs border-2 border-white font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-3 h-auto p-2 hover:bg-slate-50">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <p className="text-sm font-medium text-slate-800">
                            {user.email === "rafamarketingdb@gmail.com"
                              ? (user.display_name || user.full_name || "Usuário")
                              : (user.user_type === "profissional" ? `Dr(a). ${user.display_name || user.full_name || "Usuário"}` : user.display_name || user.full_name || "Usuário")
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
                              ? (user.display_name || user.full_name || "Usuário")
                              : (user.user_type === "profissional" ? `Dr(a). ${user.display_name || user.full_name || "Usuário"}` : user.display_name || user.full_name || "Usuário")
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
              </>
            )}
          </div>
        </header>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 bg-white border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            {clinicSettings?.logo_url ? (
              <img
                src={clinicSettings.logo_url}
                alt={clinicSettings.clinic_name || "Clínica"}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-slate-400" />
                <span className="text-sm font-semibold text-slate-600">
                  {clinicSettings?.clinic_name || "Clínica"}
                </span>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              {/* Mobile Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 hover:bg-slate-100"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 text-white text-xs border-2 border-white font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Mobile User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photo_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">
                      {user.email === "rafamarketingdb@gmail.com"
                        ? (user.display_name || user.full_name || "Usuário")
                        : (user.user_type === "profissional" ? `Dr(a). ${user.display_name || user.full_name || "Usuário"}` : user.display_name || user.full_name || "Usuário")
                      }
                    </p>
                    {user.email !== "rafamarketingdb@gmail.com" && (
                      <p className="text-xs text-slate-500">{user.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {user.user_type && (
                        <span className="text-xs">
                          <div className={`inline-block w-2 h-2 rounded-full mr-1 ${user.user_type === "profissional" ? "bg-blue-500" :
                            user.user_type === "secretaria" ? "bg-green-500" :
                              "bg-purple-500"
                            }`} />
                          <span className="text-slate-500">
                            {user.user_type === "profissional" ? "Profissional" :
                              user.user_type === "secretaria" ? "Secretária" :
                                user.user_type === "marketing" ? "Marketing" :
                                  user.user_type === "gerente" ? "Gerente" : "Administrador"}
                          </span>
                        </span>
                      )}
                      {user.role === "admin" && (
                        <span className="ml-auto px-2 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-[10px] shadow-lg">
                          ADMIN
                        </span>
                      )}

                      {/* Exclusive Golden Badge */}
                      {user.email === "rafamarketingdb@gmail.com" && (
                        <span className="ml-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-[10px] shadow-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" /> ADMIN
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
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="pb-12">{children}</main>

        {/* Footer */}
        <footer className="fixed bottom-0 right-0 left-0 bg-white border-t border-slate-100 py-3 px-4">
          <p className="text-center text-xs text-slate-400 font-medium">
            DESIGNED BY EUSOULRAFA
          </p>
        </footer>
      </div>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Notifications Sheet */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Notificações</SheetTitle>
          </SheetHeader>
          <NotificationList
            notifications={notifications}
            onMarkAsRead={async (id) => {
              await base44.entities.Notification.update(id, { read: true });
            }}
            onDelete={async (id) => {
              await base44.entities.Notification.delete(id);
            }}
            onSendEmail={async (notif) => {
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: notif.title,
                body: notif.message,
              });
              await base44.entities.Notification.update(notif.id, { sent_email: true });
            }}
            user={user}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
