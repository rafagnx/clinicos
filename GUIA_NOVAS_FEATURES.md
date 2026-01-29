# Guia de Implementação de Novas Features (Multi-Inquilino)

Este documento descreve a estratégia para implementar funcionalidades específicas para clientes (ex: Orofacial Clinic) sem impactar o sistema principal, garantindo segurança e escalabilidade.

---

## 1. Estratégia Geral: Feature Flags (Sinalizadores de Recurso)

Em vez de criar versões separadas do código para cada cliente, usamos o conceito de **Feature Flags**. O código é o mesmo para todos, mas as funcionalidades são ligadas ou desligadas baseadas em quem está logado.

### Benefícios:
- **Código Único:** Mais fácil de manter. Corrigiu um bug no "core", corrigiu para todos.
- **Segurança:** Funcionalidades em teste ficam invisíveis para outros clientes.
- **Venda Modular:** Facilita criar planos (ex: Plano Básico vs. Plano Premium com Módulo de Marketing).

---

## 2. Banco de Dados

Utilizamos a tabela `organization` para armazenar quais módulos cada clínica possui.

**Tabela:** `organization`
**Coluna Alvo:** `metadata` (JSON) ou nova coluna `features` (JSON).

**Exemplo de Conteúdo na Coluna:**
```json
{
  "features": {
    "marketing_module": true,
    "whatsapp_integration": true,
    "custom_reports": false
  },
  "config": {
    "marketing_pixel_id": "12345"
  }
}
```

---

## 3. Back-end (API / Servidor)

Protegemos as rotas da API para que apenas clínicas autorizadas possam acessá-las.

**Implementação:** Middleware (Filtro de Segurança).

**Lógica (Pseudocódigo):**
```javascript
// Middleware checkFeature.js
export function checkFeature(featureName) {
  return async (req, res, next) => {
    const organization = await getOrganization(req.user.organizationId);
    
    // Verifica se a flag está ativa no JSON
    if (organization.metadata.features[featureName] === true) {
      return next(); // Permitido
    } else {
      return res.status(403).json({ error: "Funcionalidade não contratada." });
    }
  };
}

// Uso na Rota
app.post('/api/marketing/campaign', checkFeature('marketing_module'), createCampaignController);
```

---

## 4. Front-end (Interface Visual)

A interface se adapta dinamicamente. Se a feature está desligada, o botão nem aparece.

**Lógica (React):**
```tsx
// Hook useFeature.ts
const { hasFeature } = useOrganization();

// No Menu Lateral
return (
  <nav>
    <Link to="/agenda">Agenda</Link>
    
    {/* Só renderiza se tiver a feature 'marketing_module' */}
    {hasFeature('marketing_module') && (
      <Link to="/marketing">
        <IconRocket /> Tráfego Pago
      </Link>
    )}
  </nav>
);
```

---

## 5. Fluxo de Trabalho Seguro (Workflow)

Para desenvolver sem quebrar o sistema atual:

1.  **Branch Separada:**
    - Crie uma branch para a feature específica: `git checkout -b feature/orofacial-marketing`.
    
2.  **Desenvolvimento Isolado:**
    - Implemente o código usando as *Feature Flags* descritas acima.
    
3.  **Deploy em Ambiente de Preview (V2/Staging):**
    - Suba essa branch para um ambiente de teste (ex: `preview.clinicos.unaux.com` ou Vercel Preview).
    - Valide online com dados reais ou cópia de segurança.
    
4.  **Merge e Ativação:**
    - Após aprovado, faça o merge com a `main`.
    - A feature vai para produção, mas **ninguém vê** até você ativar a flag no banco de dados da Orofacial Clinic.

---

## Resumo para Implementação Imediata

Quando for pedir para implementar a função de tráfego pago da Orofacial:

1.  **Diga:** "Quero criar o módulo de Marketing. Vamos usar a flag `marketing_module`."
2.  **Ação:** Eu criarei a rota protegida e a tela que só aparece condicionalmente.
3.  **Ativação:** Você vai no banco (ou painel admin) e coloca `"marketing_module": true` apenas para a Orofacial.
