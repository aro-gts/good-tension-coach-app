// Use the modern `import` syntax
import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ==== Initialize API Keys ====
config();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// ==== Initialize OpenAI ====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==== Initialize Supabase ====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==== Middleware ====
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==== Tagging Logic ====
function getTagFromMessage(message) {
  const msg = message.toLowerCase();

  if (msg.includes('burnout') || msg.includes('exhausted') || msg.includes('too much') || msg.includes('overwhelmed')) {
    return 'overwhelm';
  } else if (msg.includes('disagree') || msg.includes('pushbac
