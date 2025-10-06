import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cbjonqcvjheotxolfmti.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiam9ucWN2amhlb3R4b2xmbXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODYzMjIsImV4cCI6MjA3NTI2MjMyMn0.N6JNdUPgUJmzfrqkeD6qvnd19VFn92vK8wKOesYqGIs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
