-- SAFE SCHEMA FOR POSTGRES (Auto-run compatible)

-- ----------------------------
-- BETTER AUTH TABLES
-- ----------------------------

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Safely add 'role' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='role') THEN
        ALTER TABLE "user" ADD COLUMN "role" TEXT DEFAULT 'user';
    END IF;
    
    -- Additional Profile Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='phone') THEN
        ALTER TABLE "user" ADD COLUMN "phone" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='specialty') THEN
        ALTER TABLE "user" ADD COLUMN "specialty" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='user_type') THEN
        ALTER TABLE "user" ADD COLUMN "user_type" TEXT DEFAULT 'profissional';
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

-- Organization Plugin Tables
CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "logo" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id"),
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id"),
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- ----------------------------
-- APP TABLES (Multi-tenant)
-- ----------------------------

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  specialty VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  agenda_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  patient_id INT,
  professional_id INT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'agendado',
  type VARCHAR(50) DEFAULT 'consulta',
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  origin VARCHAR(50),
  status VARCHAR(50) DEFAULT 'novo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  conversation_id INT,
  sender_id INT,
  content TEXT,
  file_urls JSON,
  read_by JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy users table (Deprecated by 'user' table above, kept if needed for migration or removed)
-- Removing to avoid confusion with new system
-- CREATE TABLE IF NOT EXISTS users (
--   id SERIAL PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password_hash VARCHAR(255) NOT NULL,
--   role VARCHAR(50) DEFAULT 'user'
-- );

-- Notification Preferences
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email_enabled" BOOLEAN DEFAULT TRUE,
  "push_enabled" BOOLEAN DEFAULT TRUE,
  "whatsapp_enabled" BOOLEAN DEFAULT FALSE,
  "marketing_updates" BOOLEAN DEFAULT FALSE,
  "appointment_reminders" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Clinic Settings
CREATE TABLE IF NOT EXISTS "clinic_settings" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "clinic_name" TEXT,
  "primary_color" TEXT DEFAULT '#3b82f6',
  "address" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "logo_url" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
