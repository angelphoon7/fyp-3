-- KAI App — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Users (caregiver profiles, onboarding state)
CREATE TABLE IF NOT EXISTS users (
  phone TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily check-ins from WhatsApp bot
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,       -- format: "whatsapp:+60xxx_2026-06-03"
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp conversation messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App state synced from the web app (care tasks, medications, appointments, etc.)
CREATE TABLE IF NOT EXISTS kai_app_state (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (simple access for this project)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE kai_app_state DISABLE ROW LEVEL SECURITY;
