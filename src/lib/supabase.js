import { createClient } from '@supabase/supabase-js'

//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
//const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = 'https://axiwfkpwgyvccdzpclfu.supabase.co'
const supabaseAnonKey = 'NkenBjbGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODAyNDcsImV4cCI6MjA5NDQ1NjI0N30.ZlTmi36sBkgYqFeMbzuqF8_oSkJMWxv1cEksm_iUPB8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
