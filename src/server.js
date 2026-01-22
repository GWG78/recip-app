// src/server.js


import express from 'express';
import { env } from './env.js';
import { prisma } from './db.js';
import healthRouter from './routes/health.js';
import authRouter from './auth/shopifyAuth.js';
import webhookRouter from './webhooks/index.js';

const app = express();

app.use('/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/webhooks', webhookRouter);


app.get('/', async (req, res) => {
  const shop =
    req.headers['x-shopify-shop-domain'] ||
    req.query.shop;

  if (!shop) {
    return res.status(400).send('Missing shop');
  }

  const existingShop = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!existingShop || !existingShop.accessToken) {
    console.log('🔁 Redirecting to auth/install for shop:', shop);
    return res.redirect(`/auth/install?shop=${shop}`);
  }

  res.send('<h1>Recip is installed and initialized 🎉</h1>');
});

app.listen(env.port, () => {
  console.log(`Recip server running on port ${env.port}`);
});