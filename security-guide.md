# Relatório de Auditoria de Segurança - ClinicOS
**Data:** 22 de Janeiro de 2026
**Auditor:** Antigravity (IA Security Specialist)
**Classificação:** 🔴 CRÍTICO

---

## 1. Sumário Executivo

A auditoria de segurança "Zero Trust" realizada no código-fonte do ClinicOS revelou uma arquitetura baseada em isolamento de inquilinos (Multi-tenant) funcional, utilizando bibliotecas modernas de autenticação (Better Auth).

No entanto, foram identificadas **Vulnerabilidades Críticas de Injeção de SQL (SQL Injection)** nos endpoints genéricos da API (`/api/:entity`). Essas falhas permitem que um atacante autenticado manipule consultas ao banco de dados, podendo levar à exfiltração de dados, modificação não autorizada ou negação de serviço.

A postura de segurança atual é **INSUFICIENTE** para entrar em produção. A correção das falhas de injeção é mandatória e urgente.

---

## 2. Matriz de Vulnerabilidades

### 🔴 1. SQL Injection via Identificadores de Coluna (Critical)
**CVSS v3.1 Score:** 9.1 (Critical) - Admin ou User autenticado pode explorar.
**Localização:** `server/index.js`
- Linha 711 (INSERT): construção da query.
- Linha 755 (UPDATE): construção da query `setClause`.

**🐛 O Problema:**
O backend constrói consultas SQL dinâmicas concatenando as chaves do objeto JSON recebido (`req.body`) diretamente na string SQL. O driver `pg` protege apenas os *valores* (via `$1`, `$2`), mas não os *nomes das colunas*.

Um atacante pode enviar um payload malicioso no corpo da requisição:
```json
{
    "full_name) VALUES ('hacked'); --": "valor_ignorado"
}
```
Isso resultaria em uma query corrompida ou na execução de comandos arbitrários, dependendo das permissões do usuário do banco.

**🛡️ A Solução:**
1. **Whitelist:** Defina estritamente quais colunas podem ser escritas para cada tabela.
2. **Sanitização:** Se a whitelist for inviável, valide se as chaves contêm *apenas* caracteres alfanuméricos e underscores antes de usar.
3. **Escaping:** Use `JSON.stringify` ou uma lib como `pg-format` para escapar identificadores (e.g., `"nome_coluna"`).

---

### 🟠 2. Mass Assignment (Alta)
**Localização:** `server/index.js` (Rotas POST e PUT genéricas)

**🐛 O Problema:**
O endpoint aceita qualquer campo enviado no JSON e tenta gravá-lo no banco. Se uma tabela tiver colunas sensíveis (ex: `is_admin`, `verified`, `subscription_tier`), um usuário malicioso pode forçar a alteração desses valores simplesmente enviando-os na requisição.

**🛡️ A Solução:**
Implementar um filtro de colunas permitidas (`fillable`) para cada entidade ou remover chaves sensíveis do `req.body` antes de passar para a query.

---

### 🟡 3. Exposição de Detalhes de Erro (Média)
**Localização:** `server/index.js` (Blocos `catch`)

**🐛 O Problema:**
O servidor retorna `res.status(500).json({ error: error.message });`. Mensagens de erro SQL (ex: "column 'xyz' does not exist") ajudam atacantes a mapear a estrutura do banco de dados (Database Enumeration).

**🛡️ A Solução:**
Retorne mensagens genéricas para o cliente (ex: "Internal Server Error") e logue o erro real apenas no console/sistema de monitoramento.

---

### 🟡 4. Falta de Rate Limiting Robusto (Média)
**Localização:** Global (`server/index.js`)

**🐛 O Problema:**
Embora existam configurações de rate limit no objeto `auth`, não há evidência clara de um middleware de limitação de requisições (`express-rate-limit` ou similar) aplicado às rotas da API genérica. Isso expõe a API a ataques de força bruta ou DoS.

**🛡️ A Solução:**
Aplicar um middleware de Rate Limit em todas as rotas `/api/*`.

---

## 3. Checklist de Implementação (Prioridade)

1. [CRÍTICO] **Corrigir SQL Injection no `server/index.js`:**
   - Adicionar validação regex (`/^[a-zA-Z0-9_]+$/`) nas chaves do `req.body` dentro de POST e PUT.
   - Rejeitar a requisição se encontrar chaves suspeitas.

2. [ALTA] **Implementar Whitelist de Colunas:**
   - Definir quais campos podem ser editados para `Professionals`, `Patients`, etc.

3. [MÉDIA] **Ocultar Erros de Banco de Dados:**
   - Alterar os `res.status(500)` para não devolver `error.message`.

4. [BAIXA] **Revisar Hardcoded Credentials:**
   - Mover o email de super admin (`rafamarketingdb@gmail.com`) para variável de ambiente.

---

## 🔒 Código Seguro Exemplo (Correção Imediata)

Substitua a lógica de construção de queries no `server/index.js` por:

```javascript
// Validação de Identificadores (Mitigação SQLi)
const isValidIdentifier = (key) => /^[a-zA-Z0-9_]+$/.test(key);

// No POST/PUT:
const keys = Object.keys(data).filter(k => isValidIdentifier(k));

if (keys.length !== Object.keys(data).length) {
    return res.status(400).json({ error: "Invalid column names detected" });
}

// Além disso, proteja colunas sensíveis:
const forbiddenColumns = ['is_admin', 'created_at']; 
const safeKeys = keys.filter(k => !forbiddenColumns.includes(k));
```
