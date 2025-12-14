import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import creditRoutes from './routes/credits.js';
import llmRoutes from './routes/llm.js';
import adminRoutes from './routes/admin.js';
import adsRoutes from './routes/ads.js';
import cpxRoutes from './routes/cpx.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', authRoutes);
app.use('/credits', creditRoutes);
app.use('/llm', llmRoutes);
app.use('/admin', adminRoutes);
app.use('/ads', adsRoutes);
app.use('/cpx', cpxRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payless.ai backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;

