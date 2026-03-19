import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import router from './routes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import connectDB from './config/db.js';
import connectCloudinary from './config/cloudinary.js';

dotenv.config();

// Connect Config
connectDB();
connectCloudinary();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS for development
if (process.env.NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }),
  );
}

// Morgan for logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', router);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Production build
if (process.env.NODE_ENV === 'production') {
  // Serve the built React app
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Any route not matched by the API falls through to React's index.html
  // This must go BEFORE notFound middleware
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  }); 
}

// Global error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT} on ${process.env.NODE_ENV}`));
