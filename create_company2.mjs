import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgpougokmewdvgfxvutq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncG91Z29rbWV3ZHZnZnh2dXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzIwNDQsImV4cCI6MjA5OTQwODA0NH0.6JxUHlHh9I0eO6zBzqmq6zgUBNwJDjVGIde71-WDUJg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Attempting to sign up company@insureai.com...");
  const { data, error } = await supabase.auth.signUp({
    email: 'company@insureai.com',
    password: 'Company@2026!',
    options: {
      data: {
        full_name: 'Company Officer',
      }
    }
  });

  if (error) {
    console.error("SIGNUP_ERROR:", error.message);
  } else {
    console.log("Signup successful or user already exists.");
  }
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'company@insureai.com',
    password: 'Company@2026!',
  });

  if (signInError) {
    console.error("SIGNIN_ERROR:", signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log("Logged in successfully. User ID:", userId);

  console.log("Updating role to 'company'...");
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'company' })
    .eq('id', userId);

  if (updateError) {
    console.error("UPDATE_ERROR:", updateError.message);
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("PROFILE_FETCH_ERROR:", profileError.message);
    return;
  }

  console.log("SUCCESS");
  console.log("PROFILE:", JSON.stringify(profile, null, 2));
}

main();
