# 🔧 Como Aplicar a Migration no Render

O banco de dados de produção precisa das colunas de assinatura Stripe. Siga **UMA** das opções abaixo:

---

## ⚡ **OPÇÃO 1: Via Shell do Render (RECOMENDADO)**

1. Acesse o **Dashboard do Render**: https://dashboard.render.com
2. Vá em **Web Services** → Selecione `clinicos-it4q`
3. Clique na aba **Shell** (no menu superior)
4. Execute o comando:

```bash
npm run migrate
```

5. Aguarde a mensagem: `✅ Migration completed successfully!`
6. Pronto! Reinicie o serviço se necessário.

---

## 🗄️ **OPÇÃO 2: Via PostgreSQL Console (Alternativa)**

1. Acesse o **Dashboard do Render**: https://dashboard.render.com
2. Vá em **PostgreSQL** → Selecione seu banco de dados
3. Clique em **Connect** → **External Connection** → Copie a **Connection String**
4. Acesse o **psql** ou qualquer cliente PostgreSQL
5. Cole e execute o SQL abaixo:

```sql
DO $$
BEGIN
    -- Add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='subscription_status'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "subscription_status" TEXT DEFAULT 'trialing';
    END IF;

    -- Add stripe_customer_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='stripe_customer_id'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "stripe_customer_id" TEXT;
    END IF;

    -- Add stripe_subscription_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='stripe_subscription_id'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "stripe_subscription_id" TEXT;
    END IF;

    -- Add trial_ends_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='trial_ends_at'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "trial_ends_at" TIMESTAMP;
    END IF;

    -- Add type column to notifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='type'
    ) THEN
        ALTER TABLE "notifications" ADD COLUMN "type" TEXT DEFAULT 'info';
    END IF;

    -- Add metadata column to notifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='metadata'
    ) THEN
        ALTER TABLE "notifications" ADD COLUMN "metadata" TEXT;
    END IF;
END
$$;
```

6. Verifique se funcionou:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'organization' 
  AND column_name IN ('subscription_status', 'stripe_customer_id', 'stripe_subscription_id', 'trial_ends_at')
ORDER BY column_name;
```

---

## ✅ **Verificação**

Após rodar a migration, acesse:
- `https://clinicosapp.vercel.app/admin/organizations`
- O **Toggle PRO** deve funcionar sem erros!

---

## 🚨 **Troubleshooting**

Se ainda der erro:
1. Verifique se as variáveis de ambiente `DATABASE_URL` estão corretas no Render
2. Reinicie o serviço manualmente
3. Verifique os logs em tempo real: `Logs` → `Live Logs`
