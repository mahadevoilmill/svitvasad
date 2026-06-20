import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabaseClient.js';
import { initWhatsApp, getStatus, sendMessage } from './whatsapp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize WhatsApp Client
initWhatsApp();

const formatAuthError = (error) => {
  if (!error) return null;
  const message = error.message || String(error);
  if (message.includes('email rate limit exceeded')) {
    return 'Too many signup emails were sent. Please wait a few minutes and try again, or use an existing account.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Double-check your credentials and try again.';
  }
  return message;
};

app.get('/api-status', (_req, res) => {
  res.json({ status: 'ok', message: 'Svit Vasad Campus API with Supabase' });
});

app.get('/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY,
  });
});

// WhatsApp Endpoints
app.get('/whatsapp/status', (_req, res) => {
  res.json(getStatus());
});

app.post('/whatsapp/send', async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: 'Number and message are required.' });
  }

  try {
    const result = await sendMessage(number, message);
    res.json({ success: true, messageId: result.id.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  console.log(`Signup attempt for: ${email}`);

  // If we have service role key, use admin API to bypass confirmation and rate limits
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      console.error('Admin signup error:', error);
      // If user already exists, try to fall back or return error
      return res.status(400).json({ error: formatAuthError(error) });
    }

    console.log(`Admin-created and confirmed user: ${email}`);
    return res.json({ user: data.user, message: 'Signup completed. You can now login.' });
  }

  // Fallback to standard signup
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Standard signup error:', error);
    return res.status(400).json({ error: formatAuthError(error) });
  }

  return res.json({ user: data.user, message: 'Signup initiated. Check email for confirmation if enabled.' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  console.log(`Login attempt for: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error('Login error:', error);
    
    // If user is unconfirmed and we have admin privileges, try to confirm them automatically
    if (error.message.includes('Email not confirmed') && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(`Attempting to auto-confirm existing user: ${email}`);
      try {
        // We need the user ID. We can get it by listing users or just trying to update by email if possible.
        // The easiest way is to use admin.listUsers or search.
        const { data: userData, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const user = userData.users.find(u => u.email === email);
          if (user) {
            await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
            console.log(`Successfully confirmed existing user: ${email}. Retrying login...`);
            // Retry login
            const retry = await supabase.auth.signInWithPassword({ email, password });
            if (!retry.error) {
              return res.json({ session: retry.data.session, user: retry.data.user });
            }
          }
        }
      } catch (adminError) {
        console.error('Auto-confirm retry failed:', adminError);
      }
    }
    
    return res.status(400).json({ error: formatAuthError(error) });
  }

  return res.json({ session: data.session, user: data.user });
});

const getAuthToken = (req) => {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  return parts[0] === 'Bearer' ? parts[1] : null;
};

app.get('/profile', async (req, res) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token.' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.json({ user: data.user });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
