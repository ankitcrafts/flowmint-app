import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from './middlewares/auth.ts';
import { supabase } from './utils/supabase.ts';
import { ManualFinancialParser } from './modules/upload/upload.service.ts';
import { AnalyticsService } from './modules/analytics/analytics.service.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// File Upload Config
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(null, false);
  }
});

// --- ROUTES ---

/**
 * POST /api/financial/upload
 * Secure PDF statement upload
 */
app.post('/api/financial/upload', authenticateToken, upload.single('statement'), async (req: AuthRequest, res: any) => {
  if (!req.file || !req.user) {
    return res.status(400).json({ error: 'Please upload a PDF file' });
  }

  try {
    const parser = new ManualFinancialParser();
    const parsedData = await parser.parseCreditStatement(req.file.buffer);

    // Track in financial_sources
    const { data: source, error: sourceErr } = await supabase
      .from('financial_sources')
      .insert([{ 
        user_id: req.user.id, 
        source_type: 'manual_upload' 
      }])
      .select()
      .single();

    if (sourceErr) throw sourceErr;

    // Log Audit
    await supabase.from('audit_logs').insert([{
      user_id: req.user.id,
      action: 'UPLOAD_PDF',
      metadata: { filename: req.file.originalname, fileSize: req.file.size }
    }]);

    res.json({ 
      message: 'Statement parsed successfully', 
      data: parsedData,
      sourceId: source.id 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/credit
 * Fetch user credit accounts
 */
app.get('/api/credit', authenticateToken, async (req: AuthRequest, res: any) => {
  const { data, error } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('user_id', req.user?.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * PATCH /api/credit/:id/autopay
 * Toggle autopay and audit
 */
app.patch('/api/credit/:id/autopay', authenticateToken, async (req: AuthRequest, res: any) => {
  const { enabled } = req.body;
  const { id } = req.params;

  const { data, error } = await supabase
    .from('credit_accounts')
    .update({ autopay_enabled: enabled })
    .eq('id', id)
    .eq('user_id', req.user?.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_logs').insert([{
    user_id: req.user?.id,
    action: 'TOGGLE_AUTOPAY',
    metadata: { account_id: id, state: enabled }
  }]);

  res.json(data);
});

/**
 * GET /api/analytics
 * Real-time financial health analytics
 */
app.get('/api/analytics', authenticateToken, async (req: AuthRequest, res: any) => {
  const userId = req.user?.id;

  const [creditRes, loanRes] = await Promise.all([
    supabase.from('credit_accounts').select('*').eq('user_id', userId),
    supabase.from('loan_accounts').select('*').eq('user_id', userId)
  ]);

  const analytics = AnalyticsService.calculateAnalytics(
    creditRes.data || [],
    loanRes.data || [],
    50000 // Default income if profile not found, real implementation should fetch from user_financial_profiles
  );

  res.json(analytics);
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', version: '2.0.0-modular' }));

app.listen(port, () => {
  console.log(`FlowMint Core Server running on port ${port}`);
});
