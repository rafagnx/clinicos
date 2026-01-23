# 🚨 SOLUÇÃO URGENTE - Configurar Variáveis no Vercel

## ❌ Problema Atual

O Vercel **NÃO** está lendo o arquivo `.env.production`. Por isso o backend URL está undefined e as requisições estão falhando.

## ✅ SOLUÇÃO: Configurar Variáveis no Painel do Vercel

### Passo 1: Acessar o Painel do Vercel

1. Acesse: https://vercel.com/rafagnx/clinicos/settings/environment-variables
2. Ou:
   - Vá para https://vercel.com
   - Clique no projeto `clinicos`
   - Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar as Variáveis

Adicione **EXATAMENTE** estas 3 variáveis:

#### Variável 1: VITE_BACKEND_URL
```
Name: VITE_BACKEND_URL
Value: https://clinicos-it4q.onrender.com
Environment: Production
```

#### Variável 2: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://yhfjhovhemgcamigimaj.supabase.co
Environment: Production
```

#### Variável 3: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZmpob3ZoZW1nY2FtaWdpbWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzE1NzAsImV4cCI6MjA4NDY0NzU3MH0.6a8aSDM12eQwTRZES5r_hqFDGq2akKt9yMOys3QzodQ
Environment: Production
```

### Passo 3: Fazer Redeploy

Depois de adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deployment
3. Clique em **Redeploy**
4. Aguarde ~2 minutos

## 📸 Como Deve Ficar

No painel do Vercel, você deve ver:

```
Environment Variables (3)

VITE_BACKEND_URL
  Production: https://clinicos-it4q.onrender.com

VITE_SUPABASE_URL
  Production: https://yhfjhovhemgcamigimaj.supabase.co

VITE_SUPABASE_ANON_KEY
  Production: eyJhbGci... (valor longo)
```

## ⚠️ IMPORTANTE

- **NÃO** adicione aspas nos valores
- **NÃO** adicione espaços antes ou depois
- Certifique-se de selecionar **Production** no dropdown de Environment
- Depois de adicionar, **SEMPRE** faça um Redeploy

## 🧪 Como Testar Depois

1. Aguarde o redeploy terminar
2. Acesse: https://clinicosapp.vercel.app
3. Abra o console (F12)
4. Deve aparecer:
   ```
   ClinicOS Client v1.2 Loaded - Supabase Mode
   Backend URL: https://clinicos-it4q.onrender.com/api
   Environment: production
   ```

## 🔄 Alternativa Rápida (Se Não Conseguir Acessar o Painel)

Se você não conseguir acessar o painel do Vercel, podemos:

1. **Opção A**: Usar outro serviço de deploy (Netlify, Cloudflare Pages)
2. **Opção B**: Fazer build local e subir os arquivos manualmente
3. **Opção C**: Usar o Vercel CLI para configurar as variáveis

### Usando Vercel CLI (Opção C)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Configurar variáveis
vercel env add VITE_BACKEND_URL production
# Quando pedir o valor, cole: https://clinicos-it4q.onrender.com

vercel env add VITE_SUPABASE_URL production
# Quando pedir o valor, cole: https://yhfjhovhemgcamigimaj.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Quando pedir o valor, cole: eyJhbGci...

# Fazer redeploy
vercel --prod
```

## 📝 Checklist

- [ ] Acessei o painel do Vercel
- [ ] Adicionei VITE_BACKEND_URL
- [ ] Adicionei VITE_SUPABASE_URL
- [ ] Adicionei VITE_SUPABASE_ANON_KEY
- [ ] Selecionei "Production" para todas
- [ ] Fiz Redeploy
- [ ] Aguardei 2-3 minutos
- [ ] Testei no navegador
- [ ] Verifiquei o console (F12)

---

**Depois de fazer isso, o sistema vai funcionar perfeitamente!** 🚀

Me avise quando terminar de configurar!
