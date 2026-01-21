// src/server.js
import express from 'express';
import { env } from './env.js';
import healthRouter from './routes/health.js';
import authRouter from './auth/shopifyAuth.js';

const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);

// 👇 ADD THIS
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Recip</title>
        <meta charset="utf-8" />
      </head>
      <body>
        <h1>Recip is installed 🎉</h1>
        <p>Your Shopify app is running.</p>
      </body>
    </html>
  `);
});

app.listen(env.port, () => {
  console.log(`Recip server running on port ${env.port}`);
});