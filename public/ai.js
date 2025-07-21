import supabase from './supabase.js';

export async function logMessage(session_id, user_message, ai_response, tags, turn_type) {
  await supabase.from('QA').insert([
    {
      session_id,
      user_message,
      ai_response,
      tags,
      turn_type
    }
  ]);
}
