// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://zmehmjwlzahsvvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWhtandsemFoc3V2cm10cWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjA0NDUsImV4cCI6MjA2NjM5NjQ0NX0.BDvCG-WLrdJ6ZkTzG2TSrXJwaFz2Kom7jmt3o217ixE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
