# 🧪 ROTEIRO DE TESTES - ClinicOS

## ⚙️ Preparação

### 1. Verificar Servidores
```bash
# Terminal 1 - Backend
npm run server
# Deve mostrar: "Connected to PostgreSQL database!"

# Terminal 2 - Frontend  
npm run dev
# Deve mostrar: "Local: http://localhost:5173/"
```

### 2. Verificar APIs
```bash
# Testar health check
curl http://localhost:3001/api/health

# Deve retornar:
# {"status":"ok","message":"ClinicOS Server is running"}
```

## 📝 Teste 1: Login e Organização

### Passo 1: Acessar o Sistema
1. Abrir navegador em `http://localhost:5173`
2. Fazer login com `rafamarketingdb@gmail.com`

### Passo 2: Verificar Sessão
Abrir Console do Navegador (F12) e executar:
```javascript
// Verificar sessão Supabase
const { data } = await supabase.auth.getSession();
console.log('✅ Sessão:', data.session ? 'ATIVA' : 'INATIVA');
console.log('📧 Email:', data.session?.user?.email);
```

### Passo 3: Verificar Organização
```javascript
// Verificar organization ID
const orgId = localStorage.getItem('active-org-id');
console.log('🏢 Organization ID:', orgId);

// Se não houver, buscar organizações
if (!orgId) {
    const token = (await supabase.auth.getSession()).data.session.access_token;
    const orgs = await fetch('http://localhost:3001/api/user/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    console.log('📋 Organizações:', orgs);
    
    if (orgs.length > 0) {
        localStorage.setItem('active-org-id', orgs[0].organizationId);
        console.log('✅ Organization ID salvo:', orgs[0].organizationId);
        location.reload();
    }
}
```

**Resultado Esperado:**
- ✅ Sessão ativa
- ✅ Organization ID presente no localStorage
- ✅ Usuário logado com sucesso

## 📝 Teste 2: Criar Paciente

### Passo 1: Navegar para Pacientes
1. Clicar no menu "Pacientes"
2. Clicar em "Novo Paciente"

### Passo 2: Preencher Formulário
- **Nome Completo:** João da Silva Teste
- **CPF:** 123.456.789-00
- **Data de Nascimento:** 01/01/1990
- **Gênero:** Masculino
- **Telefone:** (11) 99999-9999
- **WhatsApp:** (11) 99999-9999
- **Email:** joao.teste@example.com
- **Endereço:** Rua Teste, 123
- **Como conheceu:** Instagram Orgânico
- **Observações:** Paciente de teste

### Passo 3: Salvar
1. Clicar em "Cadastrar Paciente"
2. Aguardar mensagem de sucesso

### Passo 4: Verificar no Console
```javascript
// Verificar requisição
// Na aba Network (F12), procurar por:
// POST /api/Patient
// Status: 200 OK
// Response: { id: ..., name: "João da Silva Teste", ... }
```

**Resultado Esperado:**
- ✅ Paciente criado com sucesso
- ✅ Toast de confirmação exibido
- ✅ Paciente aparece na lista
- ✅ Formulário fechado

**Se Houver Erro:**
- ❌ 401: Fazer logout e login novamente
- ❌ 400: Verificar se organization ID está no localStorage
- ❌ 500: Verificar logs do servidor

## 📝 Teste 3: Criar Profissional

### Passo 1: Navegar para Profissionais
1. Clicar no menu "Profissionais"
2. Clicar em "Novo Profissional"

### Passo 2: Preencher Formulário
- **Nome:** Dra. Maria Santos
- **Email:** dra.maria.teste@example.com (DEVE SER ÚNICO!)
- **Especialidade:** Dermatologia
- **Telefone:** (11) 98888-8888
- **Status:** Ativo

### Passo 3: Salvar
1. Clicar em "Cadastrar Profissional"
2. Aguardar mensagem de sucesso

**Resultado Esperado:**
- ✅ Profissional criado com sucesso
- ✅ Toast de confirmação exibido
- ✅ Profissional aparece na lista

**Se Houver Erro de Email Duplicado:**
```javascript
// Adicionar timestamp ao email
const email = `dra.maria.${Date.now()}@example.com`;
```

## 📝 Teste 4: Criar Agendamento

### Passo 1: Navegar para Agenda
1. Clicar no menu "Agenda"
2. Selecionar um profissional (se houver filtro)

### Passo 2: Criar Agendamento
1. Clicar em um horário vazio no calendário
2. Preencher:
   - **Paciente:** Selecionar o paciente criado
   - **Profissional:** Selecionar o profissional criado
   - **Data/Hora:** Manter a sugerida
   - **Duração:** 1 hora
   - **Tipo:** Consulta
   - **Status:** Agendado
   - **Observações:** Primeira consulta

### Passo 3: Salvar
1. Clicar em "Agendar"
2. Aguardar mensagem de sucesso

**Resultado Esperado:**
- ✅ Agendamento criado com sucesso
- ✅ Aparece no calendário
- ✅ Cores e status corretos

## 📝 Teste 5: Criar Empresa (Admin)

### Passo 1: Acessar Painel Admin
1. Clicar no menu "Admin" (se visível)
2. Ou acessar diretamente: `http://localhost:5173/admin`

### Passo 2: Criar Organização
```javascript
// No console do navegador
const token = (await supabase.auth.getSession()).data.session.access_token;

const response = await fetch('http://localhost:3001/api/admin/organization/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        name: 'Clínica Teste ' + Date.now(),
        slug: 'clinica-teste-' + Date.now()
    })
});

const org = await response.json();
console.log('🏢 Nova Organização:', org);
```

**Resultado Esperado:**
- ✅ Organização criada
- ✅ Retorna ID e dados da organização

## 🔍 Verificação de Dados no Banco

### Verificar Pacientes
```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;
const orgId = localStorage.getItem('active-org-id');

const patients = await fetch('http://localhost:3001/api/Patient', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
    }
}).then(r => r.json());

console.log('👥 Pacientes:', patients);
```

### Verificar Profissionais
```javascript
const professionals = await fetch('http://localhost:3001/api/Professional', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
    }
}).then(r => r.json());

console.log('👨‍⚕️ Profissionais:', professionals);
```

### Verificar Agendamentos
```javascript
const appointments = await fetch('http://localhost:3001/api/Appointment', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
    }
}).then(r => r.json());

console.log('📅 Agendamentos:', appointments);
```

## ✅ Checklist Final

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 5173
- [ ] Login com Supabase funcionando
- [ ] Organization ID salvo no localStorage
- [ ] Paciente criado com sucesso
- [ ] Profissional criado com sucesso
- [ ] Agendamento criado com sucesso
- [ ] Empresa criada com sucesso (admin)
- [ ] Dados aparecem nas listagens
- [ ] Sem erros no console

## 🐛 Problemas Comuns

### "Organization Context Required"
```javascript
// Solução rápida
const token = (await supabase.auth.getSession()).data.session.access_token;
const orgs = await fetch('http://localhost:3001/api/user/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

localStorage.setItem('active-org-id', orgs[0].organizationId);
location.reload();
```

### "Unauthorized"
```javascript
// Fazer logout e login novamente
await supabase.auth.signOut();
localStorage.clear();
location.href = '/login';
```

### Erro 500 no Servidor
```bash
# Verificar logs
# No terminal do servidor, procurar por linhas com [DEBUG] ou [ERROR]

# Executar migração
curl -X POST http://localhost:3001/api/debug/migrate
```

## 📊 Relatório de Teste

Após completar todos os testes, preencha:

```
Data: ___/___/______
Testador: _________________

✅ Teste 1 - Login e Organização: [ ] OK [ ] FALHOU
✅ Teste 2 - Criar Paciente: [ ] OK [ ] FALHOU
✅ Teste 3 - Criar Profissional: [ ] OK [ ] FALHOU
✅ Teste 4 - Criar Agendamento: [ ] OK [ ] FALHOU
✅ Teste 5 - Criar Empresa: [ ] OK [ ] FALHOU

Observações:
_________________________________________________
_________________________________________________
_________________________________________________
```

## 🎉 Sucesso!

Se todos os testes passaram, o sistema está funcionando corretamente e pronto para uso!

**Próximos passos:**
1. Testar em produção (Vercel + Render)
2. Configurar domínio personalizado
3. Configurar Stripe para pagamentos
4. Adicionar mais funcionalidades
