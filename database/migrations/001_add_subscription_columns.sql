-- Migration: Add Stripe Subscription Columns to Organization Table
-- Run this manually on Render PostgreSQL console or via psql

DO $$
BEGIN
    -- Add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='subscription_status'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "subscription_status" TEXT DEFAULT 'trialing';
        RAISE NOTICE 'Added subscription_status column';
    END IF;

    -- Add stripe_customer_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='stripe_customer_id'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "stripe_customer_id" TEXT;
        RAISE NOTICE 'Added stripe_customer_id column';
    END IF;

    -- Add stripe_subscription_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='stripe_subscription_id'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "stripe_subscription_id" TEXT;
        RAISE NOTICE 'Added stripe_subscription_id column';
    END IF;

    -- Add trial_ends_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='organization' AND column_name='trial_ends_at'
    ) THEN
        ALTER TABLE "organization" ADD COLUMN "trial_ends_at" TIMESTAMP;
        RAISE NOTICE 'Added trial_ends_at column';
    END IF;

    -- Add type column to notifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='type'
    ) THEN
        ALTER TABLE "notifications" ADD COLUMN "type" TEXT DEFAULT 'info';
        RAISE NOTICE 'Added type column to notifications';
    END IF;

    -- Add metadata column to notifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='metadata'
    ) THEN
        ALTER TABLE "notifications" ADD COLUMN "metadata" TEXT;
        RAISE NOTICE 'Added metadata column to notifications';
    END IF;

    RAISE NOTICE 'Migration completed successfully!';
END
$$;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'organization' 
  AND column_name IN ('subscription_status', 'stripe_customer_id', 'stripe_subscription_id', 'trial_ends_at')
ORDER BY column_name;
