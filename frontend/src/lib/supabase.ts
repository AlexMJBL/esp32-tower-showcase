import { createClient } from '@supabase/supabase-js';

// Configuration par variables d'environnement Vite ou mode Démo Showcase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://demo-tower-garden.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-showcase-mode';

export const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_URL !== 'https://demo-tower-garden.supabase.co'
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface TelemetryPoint {
  id?: number;
  created_at: string;
  device_id?: string;
  t0: number;
  h0: number;
  p0: number;
  vpd0: number;
  t1: number;
  h1: number;
  p1: number;
  vpd1: number;
  t2: number;
  h2: number;
  p2: number;
  vpd2: number;
  lux4: number;
  ppfd4: number;
  lux5: number;
  ppfd5: number;
  lux6: number;
  ppfd6: number;
  lux7: number;
  ppfd7: number;
}

export interface DeviceCommand {
  id: string;
  created_at: string;
  device_id: string;
  command: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  executed_at?: string;
  error_message?: string;
}
