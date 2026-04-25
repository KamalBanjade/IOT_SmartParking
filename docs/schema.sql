-- ============================================================
--  Smart Parking System — PostgreSQL Schema
--  DB: smart_parking
--  Run via: node config/initDb.js
-- ============================================================

-- ── 1. parking_slots ─────────────────────────────────────────
-- Represents physical parking spaces.
-- controller_id maps 1:1 to an ESP32 device (e.g. "ESP32-A1").
-- Rule: NEVER hardcode slot IDs — always resolve via controller_id.
CREATE TABLE IF NOT EXISTS parking_slots (
  id              SERIAL PRIMARY KEY,
  label           VARCHAR(10)   NOT NULL,               -- human-readable: "A1", "B2"
  status          VARCHAR(20)   NOT NULL DEFAULT 'available',  -- available | occupied
  controller_id   VARCHAR(50)   UNIQUE NOT NULL,        -- e.g. "ESP32-A1"
  last_updated    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── 2. users ──────────────────────────────────────────────────
-- Walk-in users AND members share this table.
-- Members have is_member=TRUE and a unique qr_token for QR entry.
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  phone          VARCHAR(20)   UNIQUE NOT NULL,
  is_member      BOOLEAN       NOT NULL DEFAULT FALSE,
  qr_token       VARCHAR(100)  UNIQUE,              -- NULL for walk-in users
  password_hash  VARCHAR(255),
  email          VARCHAR(100)  UNIQUE,
  is_active      BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── 2.5 operators ─────────────────────────────────────────────
-- Staff who manage the parking system.
CREATE TABLE IF NOT EXISTS operators (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   DEFAULT 'operator',  -- operator | admin
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMP     DEFAULT NOW(),
  last_login    TIMESTAMP
);

-- ── 3. parking_sessions ───────────────────────────────────────
-- One session per slot-visit. Tracks entry/exit and duration.
-- user_id is NULL for anonymous / walk-in parking.
CREATE TABLE IF NOT EXISTS parking_sessions (
  id                SERIAL PRIMARY KEY,
  slot_id           INT           NOT NULL REFERENCES parking_slots(id) ON DELETE RESTRICT,
  user_id           INT           REFERENCES users(id) ON DELETE SET NULL,  -- NULL = walk-in
  entry_time        TIMESTAMP     NOT NULL DEFAULT NOW(),
  exit_time         TIMESTAMP,
  duration_minutes  INT,
  status            VARCHAR(20)   NOT NULL DEFAULT 'active'  -- active | completed | abandoned
);

-- ── 4. payments ───────────────────────────────────────────────
-- Each completed session produces one payment record.
-- Rate is dynamic (admin-configurable via PARKING_RATE_PER_HOUR env var).
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL PRIMARY KEY,
  session_id  INT           NOT NULL REFERENCES parking_sessions(id) ON DELETE RESTRICT,
  amount      DECIMAL(10,2) NOT NULL,
  method      VARCHAR(30)   NOT NULL DEFAULT 'cash',    -- cash | esewa | khalti
  status      VARCHAR(20)   NOT NULL DEFAULT 'pending', -- pending | paid | failed
  paid_at     TIMESTAMP
);

-- ── 5. loyalty_points ─────────────────────────────────────────
-- Rewarded to members after each paid session (future feature).
CREATE TABLE IF NOT EXISTS loyalty_points (
  id          SERIAL PRIMARY KEY,
  user_id     INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  INT           NOT NULL REFERENCES parking_sessions(id) ON DELETE CASCADE,
  points      INT           NOT NULL,
  awarded_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  SEED DATA — 5 Parking Slots
--  Naming convention: ESP32-{Zone}{Number}
-- ============================================================
INSERT INTO parking_slots (label, status, controller_id) VALUES
  ('A1', 'available', 'ESP32-A1'),
  ('A2', 'available', 'ESP32-A2'),
  ('B1', 'available', 'ESP32-B1'),
  ('B2', 'available', 'ESP32-B2'),
  ('B3', 'available', 'ESP32-B3')
ON CONFLICT (controller_id) DO NOTHING;

-- Seed default admin operator
-- Email: admin@smartparking.np
-- Password: Admin@1234
INSERT INTO operators (name, email, password_hash, role) VALUES
  ('System Admin', 'admin@smartparking.np', '$2b$12$5hD4avqH0wZJYEq6MZlJVeVZLa8Ho0SqWFyHkkyfFIeDKStdiRqt6', 'admin')
ON CONFLICT (email) DO NOTHING;
