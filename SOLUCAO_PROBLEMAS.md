# 🚨 GUIA DE SOLUÇÃO DE PROBLEMAS - ClinicOS

## ❌ Erro ao Criar Empresa (Organization)

### Sintomas
- Erro 401 (Unauthorized)
- Erro 500 (Internal Server Error)
- "Organization Context Required"

### Soluções

#### 1. Verificar Autenticação
```javascript
// No console do navegador
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

Se não houver sessão:
- Fazer logout e login novamente
- Verificar se o email está confirmado no Supabase

#### 2. Criar Organização Manualmente
```javascript
// No console do navegador
const response = await fetch('http://localhost:3001/api/admin/organization/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
        name: 'Minha Clínica',
        slug: 'minha-clinica-' + Date.now()
    })
});
const data = await response.json();
console.log('Organization:', data);
```

## ❌ Erro ao Criar Paciente (Patient)

### Sintomas
- Erro 500: "column 'full_name' does not exist"
- Erro 400: "Organization Context Required"

### Soluções

#### 1. Verificar Organization ID
```javascript
// No console do navegador
const orgId = localStorage.getItem('active-org-id');
console.log('Active Org ID:', orgId);
```

Se não houver `orgId`:
```javascript
// Buscar organizações do usuário
const orgs = await fetch('http://localhost:3001/api/user/organizations', {
    headers: {
        'Authorization': `Bearer ${session.access_token}`
    }
}).then(r => r.json());

// Salvar a primeira organização
localStorage.setItem('active-org-id', orgs[0].organizationId);
```

#### 2. Usar Campo Correto
O backend espera `name`, não `full_name`:
```javascript
// ✅ Correto
const patientData = {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999'
};

// ❌ Incorreto
const patientData = {
    full_name: 'João Silva', // Será convertido automaticamente, mas melhor usar 'name'
};
```

## ❌ Erro ao Criar Profissional (Professional)

### Sintomas
- Erro 500: "duplicate key value violates unique constraint"
- Email já existe

### Soluções

#### 1. Usar Email Único
```javascript
const professionalData = {
    name: 'Dr. João Silva',
    email: 'dr.joao' + Date.now() + '@example.com', // Email único
    specialty: 'Dermatologia'
};
```

#### 2. Verificar Profissionais Existentes
```javascript
const professionals = await fetch('http://localhost:3001/api/Professional', {
    headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-organization-id': orgId
    }
}).then(r => r.json());

console.log('Existing Professionals:', professionals);
```

## ❌ Erro ao Criar Agenda (Appointment)

### Sintomas
- Erro 500: "null value in column violates not-null constraint"
- Campos obrigatórios faltando

### Soluções

#### 1. Incluir Todos os Campos Obrigatórios
```javascript
const appointmentData = {
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(), // +1 hora
    status: 'agendado',
    type: 'consulta'
};
```

#### 2. Verificar Formato de Data
```javascript
// ✅ Correto - ISO 8601
start_time: '2026-01-24T10:00:00.000Z'

// ❌ Incorreto
start_time: '24/01/2026 10:00'
```

## 🔧 Comandos Úteis de Diagnóstico

### 1. Verificar Status do Backend
```bash
curl http://localhost:3001/api/health
```

### 2. Verificar Conexão com Banco
```bash
curl http://localhost:3001/api/diagnostics
```

### 3. Executar Migração
```bash
curl -X POST http://localhost:3001/api/debug/migrate
```

### 4. Verificar Logs do Servidor
```bash
# No terminal onde o servidor está rodando
# Procure por linhas com [DEBUG] ou [ERROR]
```

## 🎯 Checklist de Verificação

Antes de criar qualquer entidade, verifique:

- [ ] Servidor backend rodando na porta 3001
- [ ] Servidor frontend rodando na porta 5173
- [ ] Usuário autenticado no Supabase
- [ ] Token JWT válido
- [ ] Organization ID salvo no localStorage
- [ ] Headers corretos na requisição:
  - `Authorization: Bearer <token>`
  - `x-organization-id: <org-id>`
  - `Content-Type: application/json`

## 📞 Suporte

Se os problemas persistirem:

1. Verifique os logs do servidor em `server/server_error.log`
2. Verifique o console do navegador (F12)
3. Verifique a aba Network para ver as requisições
4. Execute o script de teste: `node test_full_flow.js`

## 🔄 Reset Completo

Se nada funcionar, faça um reset:

```bash
# 1. Parar todos os servidores
# Ctrl+C nos terminais

# 2. Limpar localStorage
# No console do navegador:
localStorage.clear();

# 3. Executar migração
curl -X POST http://localhost:3001/api/debug/migrate

# 4. Reiniciar servidores
npm run server  # Terminal 1
npm run dev     # Terminal 2

# 5. Fazer login novamente
# Acessar http://localhost:5173
```
