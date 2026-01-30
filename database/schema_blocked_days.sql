-- ========================================
-- BLOCKED DAYS & HOLIDAYS SCHEMA
-- Feature: Day/Period blocking + Brazilian Holidays
-- ========================================

-- Blocked Days Table (Per Professional)
CREATE TABLE IF NOT EXISTS "blocked_days" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "professional_id" INT NOT NULL REFERENCES "professionals"("id") ON DELETE CASCADE,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id"),
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "reason" TEXT NOT NULL,
  "created_by" TEXT REFERENCES "user"("id"),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_days_professional ON blocked_days(professional_id);
CREATE INDEX IF NOT EXISTS idx_blocked_days_dates ON blocked_days(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_blocked_days_org ON blocked_days(organization_id);

-- Holidays Table (System-wide per Organization)
CREATE TABLE IF NOT EXISTS "holidays" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id"),
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT DEFAULT 'national', -- 'national' or 'local'
  "created_by" TEXT REFERENCES "user"("id"),
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_holidays_org_date ON holidays(organization_id, date);
-- Prevent duplicate holidays for same org/date/type
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_unique ON holidays(organization_id, date, type);

-- Comments for documentation
COMMENT ON TABLE blocked_days IS 'Individual professional calendar blocks (vacations, leave, etc)';
COMMENT ON TABLE holidays IS 'Organization holidays (national + local custom holidays)';
COMMENT ON COLUMN holidays.type IS 'national = auto-imported, local = admin-created';
