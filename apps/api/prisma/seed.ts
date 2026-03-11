import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

/** Upsert prices for a product — ensures stripePriceId and billingInterval are always set. */
async function upsertPrices(
  productId: string,
  prices: Array<{ currency: string; amount: number; stripePriceId?: string | null; billingInterval?: string | null; creditsCost?: number }>,
) {
  for (const p of prices) {
    const existing = await prisma.productPrice.findFirst({
      where: { productId, amount: p.amount, currency: p.currency },
    });

    if (existing) {
      await prisma.productPrice.update({
        where: { id: existing.id },
        data: {
          stripePriceId: p.stripePriceId ?? existing.stripePriceId,
          billingInterval: (p.billingInterval as any) ?? existing.billingInterval,
        },
      });
    } else {
      await prisma.productPrice.create({
        data: {
          productId,
          currency: p.currency,
          amount: p.amount,
          stripePriceId: p.stripePriceId,
          billingInterval: p.billingInterval as any,
          creditsCost: p.creditsCost,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding database...');

  // ============================================
  // Subscription Plans
  // ============================================
  const aspirante = await prisma.product.upsert({
    where: { slug: 'plan-aspirante' },
    update: {},
    create: {
      name: 'Aspiring Author',
      slug: 'plan-aspirante',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'Perfect for getting started with AI book generation',
      creditsAmount: 300,
      metadata: { plan: 'ASPIRANTE' },
      sortOrder: 1,
    },
  });
  await upsertPrices(aspirante.id, [
    { currency: 'usd', amount: 2900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTt9UYPL3yWYT7FnF6Ma3' },
    { currency: 'usd', amount: 22800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTt9UYPL3yWYTMQAKeG1W' },
  ]);

  const bestseller = await prisma.product.upsert({
    where: { slug: 'plan-bestseller' },
    update: {},
    create: {
      name: 'BestSeller Author',
      slug: 'plan-bestseller',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'For serious authors who want commercial rights',
      creditsAmount: 750,
      metadata: { plan: 'BESTSELLER' },
      sortOrder: 2,
    },
  });
  await upsertPrices(bestseller.id, [
    { currency: 'usd', amount: 5900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTu9UYPL3yWYTBl1ASRLr' },
    { currency: 'usd', amount: 46800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTu9UYPL3yWYT3alUpW00' },
  ]);

  const elite = await prisma.product.upsert({
    where: { slug: 'plan-elite' },
    update: {},
    create: {
      name: 'Elite Author',
      slug: 'plan-elite',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'Maximum power for professional authors',
      creditsAmount: 2000,
      metadata: { plan: 'ELITE' },
      sortOrder: 3,
    },
  });
  await upsertPrices(elite.id, [
    { currency: 'usd', amount: 13900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTv9UYPL3yWYTp94au7DE' },
    { currency: 'usd', amount: 106800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTv9UYPL3yWYTi6i0RsZk' },
  ]);

  // ============================================
  // One-Time Book Purchase
  // ============================================
  const oneTimeBook = await prisma.product.upsert({
    where: { slug: 'one-time-book' },
    update: {},
    create: {
      name: 'Obra Aspirante',
      slug: 'one-time-book',
      kind: 'ONE_TIME_BOOK',
      description: 'Generate 1 complete book (DOCX + PDF, personal license)',
      creditsAmount: 100,
      sortOrder: 10,
    },
  });
  await upsertPrices(oneTimeBook.id, [
    { currency: 'usd', amount: 1900, stripePriceId: 'price_1T9cTx9UYPL3yWYT00SbEksm' },
  ]);

  // ============================================
  // Credit Packs
  // ============================================
  const pack100 = await prisma.product.upsert({
    where: { slug: 'pack-100' },
    update: {},
    create: {
      name: '100 Credits',
      slug: 'pack-100',
      kind: 'CREDIT_PACK',
      description: '100 credits that never expire',
      creditsAmount: 100,
      sortOrder: 20,
    },
  });
  await upsertPrices(pack100.id, [
    { currency: 'usd', amount: 990, stripePriceId: 'price_1T9cTv9UYPL3yWYTGZlVwqUb' },
  ]);

  const pack300 = await prisma.product.upsert({
    where: { slug: 'pack-300' },
    update: {},
    create: {
      name: '300 Credits',
      slug: 'pack-300',
      kind: 'CREDIT_PACK',
      description: '300 credits that never expire',
      creditsAmount: 300,
      sortOrder: 21,
    },
  });
  await upsertPrices(pack300.id, [
    { currency: 'usd', amount: 2490, stripePriceId: 'price_1T9cTw9UYPL3yWYTI2JXSIt6' },
  ]);

  const pack500 = await prisma.product.upsert({
    where: { slug: 'pack-500' },
    update: {},
    create: {
      name: '500 Credits',
      slug: 'pack-500',
      kind: 'CREDIT_PACK',
      description: '500 credits that never expire',
      creditsAmount: 500,
      sortOrder: 22,
    },
  });
  await upsertPrices(pack500.id, [
    { currency: 'usd', amount: 3490, stripePriceId: 'price_1T9cTw9UYPL3yWYThkXcbvBf' },
  ]);

  // ============================================
  // Book Generation Product
  // ============================================
  const bookGen = await prisma.product.upsert({
    where: { slug: 'book-generation' },
    update: {},
    create: {
      name: 'Book Generation',
      slug: 'book-generation',
      kind: 'BOOK_GENERATION',
      description: 'Generate a complete book',
      sortOrder: 30,
    },
  });
  await upsertPrices(bookGen.id, [
    { currency: 'usd', amount: 0, creditsCost: 100 },
  ]);

  // ============================================
  // Addons
  // ============================================
  const addons = [
    { name: 'Custom Cover', slug: 'addon-cover', kind: 'ADDON_COVER' as const, credits: 30, sort: 40 },
    { name: 'Translation', slug: 'addon-translation', kind: 'ADDON_TRANSLATION' as const, credits: 50, sort: 41 },
    { name: 'Cover Translation', slug: 'addon-cover-translation', kind: 'ADDON_COVER_TRANSLATION' as const, credits: 20, sort: 42 },
    { name: 'Amazon Standard', slug: 'addon-amazon-standard', kind: 'ADDON_AMAZON_STANDARD' as const, credits: 40, sort: 43 },
    { name: 'Amazon Premium', slug: 'addon-amazon-premium', kind: 'ADDON_AMAZON_PREMIUM' as const, credits: 80, sort: 44 },
    { name: 'Chapter Images', slug: 'addon-images', kind: 'ADDON_IMAGES' as const, credits: 20, sort: 45 },
    { name: 'Audiobook', slug: 'addon-audiobook', kind: 'ADDON_AUDIOBOOK' as const, credits: 60, sort: 46 },
  ];

  for (const addon of addons) {
    const product = await prisma.product.upsert({
      where: { slug: addon.slug },
      update: {},
      create: {
        name: addon.name,
        slug: addon.slug,
        kind: addon.kind,
        sortOrder: addon.sort,
      },
    });
    await upsertPrices(product.id, [
      { currency: 'usd', amount: 0, creditsCost: addon.credits },
    ]);
  }

  // ============================================
  // Dev Users
  // ============================================
  const adminPassword = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  const userPassword = await bcrypt.hash('User1234!', BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bestsellers.ai' },
    update: {},
    create: {
      email: 'admin@bestsellers.ai',
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      onboardingCompleted: true,
      emailVerified: new Date(),
      wallet: {
        create: { balance: 1000 },
      },
    },
    include: { wallet: true },
  });

  // Add credits to admin wallet ledger
  if (admin.wallet) {
    await prisma.creditLedger.upsert({
      where: { id: 'seed-admin-credits' },
      update: {},
      create: {
        id: 'seed-admin-credits',
        walletId: admin.wallet.id,
        type: 'BONUS',
        amount: 1000,
        remaining: 1000,
        source: 'SEED',
      },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: 'user@bestsellers.ai' },
    update: {},
    create: {
      email: 'user@bestsellers.ai',
      name: 'Test User',
      passwordHash: userPassword,
      role: 'USER',
      onboardingCompleted: true,
      emailVerified: new Date(),
      wallet: {
        create: { balance: 500 },
      },
    },
    include: { wallet: true },
  });

  if (user.wallet) {
    await prisma.creditLedger.upsert({
      where: { id: 'seed-user-credits' },
      update: {},
      create: {
        id: 'seed-user-credits',
        walletId: user.wallet.id,
        type: 'BONUS',
        amount: 500,
        remaining: 500,
        source: 'SEED',
      },
    });
  }

  console.log('Seed completed!');
  console.log(`Created: 3 subscription plans, 1 one-time book, 3 credit packs, 1 book-generation, 7 addons`);
  console.log(`Created dev users:`);
  console.log(`  Admin: admin@bestsellers.ai / Admin123!`);
  console.log(`  User:  user@bestsellers.ai  / User1234!`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
