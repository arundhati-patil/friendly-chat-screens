// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://owuooithipepubfxwndk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dW9vaXRoaXBlcHViZnh3bmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTgzNjUsImV4cCI6MjA2MzU5NDM2NX0.zqXjUtIB1KRBUiH04oO5dbiuoTRzqWULyFme4077sFA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);