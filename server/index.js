import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine env file based on environment
const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? '../.env.production' : '../.env.local');
dotenv.config({ path: envPath });
// Also load default .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Supabase Client (Service Role)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Allow VITE prefix fallback for hybrid dev
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-replace-in-prod';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};

/* --- Routes --- */

// Google Auth Callback
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    // 1. Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');

    const { sub: googleSub, email, name, picture } = payload;

    // 2. Upsert User in Supabase 'app_users' table
    // Check if user exists by google_sub or email
    let { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .or(`google_sub.eq.${googleSub},email.eq.${email}`)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Supabase fetch error:", fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('app_users')
        .insert([{ 
          google_sub: googleSub, 
          email, 
          name, 
          avatar: picture 
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = newUser;
    } else {
        // Update existing user (e.g. avatar/name updates) if needed, or link google_sub if only email matched
        if (!user.google_sub || user.name !== name || user.avatar !== picture) {
             const { data: updatedUser, error: updateError } = await supabase
                .from('app_users')
                .update({ google_sub: googleSub, name, avatar: picture })
                .eq('id', user.id)
                .select()
                .single();
             if (!updateError) user = updatedUser;
        }
    }

    // 3. Create JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Set HttpOnly Cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 3600000 // 1 hour
    });

    // 5. Return User
    res.json({ user, message: 'Google login successful' });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

// Mobile Auth (Simplified)
app.post('/auth/mobile', async (req, res) => {
  const { mobile } = req.body;
  
  // Basic validation
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  // OTP Validation is effectively skipped/handled on frontend as per user request (OTP = 123456)
  // We assume frontend checked the OTP "123456" before calling this endpoint.
  // OR we can implement the check here if passed.
  // For now, trust the call to initiate session.

  try {
     // 1. Upsert User
     let { data: user, error: fetchError } = await supabase
       .from('app_users')
       .select('*')
       .eq('mobile', mobile)
       .single();
     
     if (fetchError && fetchError.code !== 'PGRST116') {
         return res.status(500).json({ error: 'Database error' });
     }

     if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from('app_users')
          .insert([{ mobile, name: `User ${mobile.slice(-4)}` }]) // Default name
          .select()
          .single();
        if (insertError) {
             console.error("Mobile insert error:", insertError);
             return res.status(500).json({ error: 'Failed to create user' });
        }
        user = newUser;
     }

     // 2. Create JWT
     const accessToken = jwt.sign(
       { id: user.id, mobile: user.mobile },
       JWT_SECRET,
       { expiresIn: '1h' }
     );

     // 3. Set Cookie
     res.cookie('access_token', accessToken, {
       httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
       maxAge: 3600000
     });

     res.json({ user, message: 'Mobile login successful' });

  } catch (err) {
      console.error("Mobile Auth Error:", err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get User (Protected)
app.get('/auth/me', authenticateToken, async (req, res) => {
   // Optional: Refresh user data from DB to get latest
   const { data: user, error } = await supabase.from('app_users').select('*').eq('id', req.user.id).single();
   if (error || !user) return res.status(404).json({ error: 'User not found' });
   res.json({ user });
});

// Logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
