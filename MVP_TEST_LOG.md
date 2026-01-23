# Relatório de Testes MVP - ClinicOS
Data: 23/01/2026
Status Geral: Em Progresso

## Checklist de Verificação

### 1. Autenticação & Onboarding
- [ ] Login com credenciais inválidas (Validação de erro)
- [ ] Cadastro de novo usuário (Sign Up)
- [ ] Criação de nova organização (Onboarding inicial)
- [ ] Login com credenciais válidas
- [ ] Recuperação de sessão (Refresh)

### 2. Painel Admin (Master)
- [ ] Acesso à rota /admin (Proteção de rota)
- [ ] Listagem de organizações
- [ ] Criar nova empresa via Admin
- [ ] Teste do "Bypass PRO" (Ativar/Desativar assinatura)
- [ ] Exclusão de empresa

### 3. Funcionalidades Core (Clínica)
- [ ] **Dashboard**: Carregamento de métricas
- [ ] **Agenda**:
    - [ ] Visualização Diária/Semanal
    - [ ] Criar Agendamento
    - [ ] Mover/Editar Agendamento
- [ ] **Pacientes**:
    - [ ] Listar pacientes
    - [ ] Criar novo paciente
    - [ ] Filtros de busca
- [ ] **Prontuários**:
    - [ ] Acessar prontuário
    - [ ] Salvar evolução
- [ ] **Configurações**:
    - [ ] Editar Perfil (Foto, Dados)
    - [ ] Configurações da Clínica (Logo, Endereço)
- [ ] **Notificações**:
    - [ ] UI de notificações visível

## Registro de Falhas e Correções

| ID | Módulo | Descrição do Erro | Ação Corretiva | Status |
|----|--------|-------------------|----------------|--------|
| 1 | Pacientes | Erro 500 ao criar paciente (Coluna 'full_name' não existe) | Mapeamento full_name -> name no backend (server/index.js) | ✅ Corrigido |
| 2 | Agenda | Modais lentos na abertura | Pendente (Otimização futura) | ⚠️ Observação |
