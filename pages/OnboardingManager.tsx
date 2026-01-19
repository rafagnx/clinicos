import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, CheckCircle2, Clock, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingManager() {
  const queryClient = useQueryClient();
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [tasks, setTasks] = useState([{ title: "", description: "" }]);

  const { data: onboardings = [], isLoading } = useQuery({
    queryKey: ["onboardings"],
    queryFn: () => base44.entities.Onboarding.list("-created_date")
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  const createOnboardingMutation = useMutation({
    mutationFn: (data) => base44.entities.Onboarding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      setIsNewUserOpen(false);
      setNewUserEmail("");
      setTasks([{ title: "", description: "" }]);
      toast.success("Onboarding criado! O usuário pode começar o processo.");
    }
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Onboarding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      toast.success("Onboarding atualizado!");
    }
  });

  const handleCreateOnboarding = () => {
    const user = users.find(u => u.email === newUserEmail);
    if (!user) {
      toast.error("Usuário não encontrado com este e-mail.");
      return;
    }

    createOnboardingMutation.mutate({
      user_id: user.id,
      user_name: user.full_name,
      status: "pendente",
      progress: 0,
      tasks: tasks.filter(t => t.title),
      created_date: new Date().toISOString()
    });
  };

  const addTask = () => setTasks([...tasks, { title: "", description: "" }]);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));
  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Onboarding</h1>
          <p className="text-slate-500">Acompanhe a integração de novos profissionais</p>
        </div>
        <Button onClick={() => setIsNewUserOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Onboarding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : onboardings.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed">
            <p className="text-slate-500">Nenhum processo de onboarding em andamento.</p>
          </div>
        ) : onboardings.map(onboarding => (
          <Card 
            key={onboarding.id} 
            className={`p-5 cursor-pointer transition-all hover:shadow-md border-slate-200 ${selectedOnboarding?.id === onboarding.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedOnboarding(onboarding)}
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                  {onboarding.user_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{onboarding.user_name}</h3>
                <p className="text-xs text-slate-500">Iniciado em {new Date(onboarding.created_date).toLocaleDateString()}</p>
              </div>
              <Badge variant={onboarding.status === 'concluido' ? 'success' : 'outline'}>
                {onboarding.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Progresso</span>
                <span className="text-blue-600">{onboarding.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${onboarding.progress}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Onboarding Sheet */}
      <Sheet open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Iniciar Novo Onboarding</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>E-mail do Usuário</Label>
              <Input 
                placeholder="exemplo@clinica.com" 
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 italic">O usuário já deve estar cadastrado no sistema.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tarefas de Integração</Label>
                <Button variant="ghost" size="sm" onClick={addTask} className="text-blue-600">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              
              {tasks.map((task, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2 relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTask(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Input 
                    placeholder="Título da tarefa" 
                    value={task.title}
                    onChange={e => updateTask(index, "title", e.target.value)}
                    className="bg-white"
                  />
                  <Textarea 
                    placeholder="Descrição (opcional)" 
                    value={task.description}
                    onChange={e => updateTask(index, "description", e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>
              ))}
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleCreateOnboarding}
              disabled={createOnboardingMutation.isPending}
            >
              {createOnboardingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Onboarding"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
