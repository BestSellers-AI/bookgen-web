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
  const aspiranteMetadata = {
    plan: 'ASPIRANTE',
    monthlyCredits: 300,
    booksPerMonth: 3,
    freeRegensPerMonth: 1,
    commercialLicense: false,
    queuePriority: 'standard',
    creditAccumulationMonths: 0,
    amazonDiscount: 0,
    historyRetentionDays: 30,
    fullEditor: false,
    prioritySupport: false,
  };

  const aspirante = await prisma.product.upsert({
    where: { slug: 'plan-aspirante' },
    update: { name: 'Aspiring', creditsAmount: 300, metadata: aspiranteMetadata, sortOrder: 1 },
    create: {
      name: 'Aspiring',
      slug: 'plan-aspirante',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'Perfect for getting started with AI book generation',
      creditsAmount: 300,
      metadata: aspiranteMetadata,
      sortOrder: 1,
    },
  });
  await upsertPrices(aspirante.id, [
    { currency: 'usd', amount: 2900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTt9UYPL3yWYT7FnF6Ma3' },
    { currency: 'usd', amount: 22800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTt9UYPL3yWYTMQAKeG1W' },
  ]);

  const profissionalMetadata = {
    plan: 'PROFISSIONAL',
    monthlyCredits: 750,
    booksPerMonth: 7,
    freeRegensPerMonth: 2,
    commercialLicense: true,
    queuePriority: 'priority',
    creditAccumulationMonths: 1,
    amazonDiscount: 10,
    historyRetentionDays: 180,
    fullEditor: true,
    prioritySupport: false,
  };

  const profissional = await prisma.product.upsert({
    where: { slug: 'plan-profissional' },
    update: { name: 'Professional', creditsAmount: 750, metadata: profissionalMetadata, sortOrder: 2 },
    create: {
      name: 'Professional',
      slug: 'plan-profissional',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'For serious authors who want commercial rights',
      creditsAmount: 750,
      metadata: profissionalMetadata,
      sortOrder: 2,
    },
  });
  await upsertPrices(profissional.id, [
    { currency: 'usd', amount: 5900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTu9UYPL3yWYTBl1ASRLr' },
    { currency: 'usd', amount: 46800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTu9UYPL3yWYT3alUpW00' },
  ]);

  const bestsellerMetadata = {
    plan: 'BESTSELLER',
    monthlyCredits: 2000,
    booksPerMonth: 20,
    freeRegensPerMonth: 5,
    commercialLicense: true,
    queuePriority: 'express',
    creditAccumulationMonths: 3,
    amazonDiscount: 15,
    historyRetentionDays: null,
    fullEditor: true,
    prioritySupport: true,
  };

  const bestseller = await prisma.product.upsert({
    where: { slug: 'plan-bestseller' },
    update: { name: 'BestSeller', creditsAmount: 2000, metadata: bestsellerMetadata, sortOrder: 3 },
    create: {
      name: 'BestSeller',
      slug: 'plan-bestseller',
      kind: 'SUBSCRIPTION_PLAN',
      description: 'Maximum power for professional authors',
      creditsAmount: 2000,
      metadata: bestsellerMetadata,
      sortOrder: 3,
    },
  });
  await upsertPrices(bestseller.id, [
    { currency: 'usd', amount: 13900, billingInterval: 'MONTHLY', stripePriceId: 'price_1T9cTv9UYPL3yWYTp94au7DE' },
    { currency: 'usd', amount: 106800, billingInterval: 'ANNUAL', stripePriceId: 'price_1T9cTv9UYPL3yWYTi6i0RsZk' },
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
    { currency: 'usd', amount: 2000, stripePriceId: 'price_1TCsiJ9UYPL3yWYTgBotLEK6' },
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
    { currency: 'usd', amount: 6000, stripePriceId: 'price_1TCsiK9UYPL3yWYTsxydFo04' },
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
    { currency: 'usd', amount: 10000, stripePriceId: 'price_1TCsiL9UYPL3yWYTgO40km13' },
  ]);

  // ============================================
  // Branded Credit Packs (Landing Page)
  // ============================================
  const aspiringWork = await prisma.product.upsert({
    where: { slug: 'aspiring-work' },
    update: { name: 'Aspiring Work', creditsAmount: 100, metadata: {} },
    create: {
      name: 'Aspiring Work',
      slug: 'aspiring-work',
      kind: 'CREDIT_PACK',
      description: 'Perfect for your first book — 100 credits to get started',
      creditsAmount: 100,
      sortOrder: 23,
    },
  });
  await upsertPrices(aspiringWork.id, [
    { currency: 'usd', amount: 1900, stripePriceId: 'price_1TAmqL9UYPL3yWYT3SnphATk' },
  ]);

  const completeWork = await prisma.product.upsert({
    where: { slug: 'complete-work' },
    update: { name: 'Complete Work', creditsAmount: 400, metadata: { fullPriceCents: 7700 } },
    create: {
      name: 'Complete Work',
      slug: 'complete-work',
      kind: 'CREDIT_PACK',
      description: 'Full creative toolkit — 400 credits for books, covers, and more',
      creditsAmount: 400,
      metadata: { fullPriceCents: 7700 },
      sortOrder: 24,
    },
  });
  await upsertPrices(completeWork.id, [
    { currency: 'usd', amount: 6900, stripePriceId: 'price_1TAmqM9UYPL3yWYTBg1CbvxC' },
  ]);

  const bestsellerPack = await prisma.product.upsert({
    where: { slug: 'bestseller' },
    update: { name: 'BestSeller', creditsAmount: 1500, metadata: { fullPriceCents: 27600 } },
    create: {
      name: 'BestSeller',
      slug: 'bestseller',
      kind: 'CREDIT_PACK',
      description: 'Maximum value — 1500 credits for the complete publishing experience',
      creditsAmount: 1500,
      metadata: { fullPriceCents: 27600 },
      sortOrder: 25,
    },
  });
  await upsertPrices(bestsellerPack.id, [
    { currency: 'usd', amount: 24900, stripePriceId: 'price_1TAmsf9UYPL3yWYTbe2fhed6' },
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
    { name: 'Custom Cover', slug: 'addon-cover', kind: 'ADDON_COVER' as const, credits: 150, sort: 40 },
    { name: 'Translation', slug: 'addon-translation', kind: 'ADDON_TRANSLATION' as const, credits: 100, sort: 41 },
    { name: 'Cover Translation', slug: 'addon-cover-translation', kind: 'ADDON_COVER_TRANSLATION' as const, credits: 100, sort: 42 },
    { name: 'Amazon Standard', slug: 'addon-amazon-standard', kind: 'ADDON_AMAZON_STANDARD' as const, credits: 700, sort: 43 },
    { name: 'Amazon Premium', slug: 'addon-amazon-premium', kind: 'ADDON_AMAZON_PREMIUM' as const, credits: 1000, sort: 44 },
    { name: 'Chapter Images', slug: 'addon-images', kind: 'ADDON_IMAGES' as const, credits: 150, sort: 45 },
    { name: 'Audiobook', slug: 'addon-audiobook', kind: 'ADDON_AUDIOBOOK' as const, credits: 150, sort: 46 },
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

  // ============================================
  // Update Stripe Product IDs
  // ============================================
  const stripeProductIds: Record<string, string> = {
    'plan-aspirante': 'prod_U7sEmBMvWyr6zA',
    'plan-profissional': 'prod_U7sE88EYTNawIY',
    'plan-bestseller': 'prod_U7sEzndvdaV0MD',
    'pack-100': 'prod_U7sEa7eJX2nFvv',
    'pack-300': 'prod_U7sEBNzwjxltBA',
    'pack-500': 'prod_U7sEWXU62GP2ib',
    'aspiring-work': 'prod_U94aQBhp8UFwnH',
    'complete-work': 'prod_U94a6uzhy2FYqx',
    'bestseller': 'prod_U95248e80AloB8',
  };

  for (const [slug, stripeId] of Object.entries(stripeProductIds)) {
    await prisma.product.updateMany({
      where: { slug },
      data: { stripeProductId: stripeId },
    });
  }

  // ============================================
  // App Configuration (operational settings)
  // ============================================
  const appConfigs = [
    {
      key: 'CREDITS_COST',
      value: {
        BOOK_GENERATION: 100,
        CHAPTER_REGENERATION: 10,
        ADDON_COVER: 150,
        ADDON_TRANSLATION: 100,
        ADDON_COVER_TRANSLATION: 100,
        ADDON_AMAZON_STANDARD: 700,
        ADDON_AMAZON_PREMIUM: 1000,
        ADDON_IMAGES: 150,
        ADDON_AUDIOBOOK: 150,
      },
    },
    {
      key: 'FREE_TIER',
      value: {
        previewsPerMonth: 3,
        credits: 0,
        booksPerMonth: 0,
        freeRegensPerMonth: 0,
        commercialLicense: false,
        queuePriority: 'standard',
        fullEditor: false,
      },
    },
    {
      key: 'BUNDLES',
      value: {
        BUNDLE_PUBLISH_PREMIUM: {
          id: 'BUNDLE_PUBLISH_PREMIUM',
          kinds: ['ADDON_COVER', 'ADDON_IMAGES', 'ADDON_AMAZON_PREMIUM'],
          originalCost: 1300,
          cost: 1100,
          discountPercent: 15.4,
        },
        BUNDLE_GLOBAL_LAUNCH: {
          id: 'BUNDLE_GLOBAL_LAUNCH',
          kinds: ['ADDON_TRANSLATION', 'ADDON_COVER_TRANSLATION', 'ADDON_AMAZON_PREMIUM'],
          originalCost: 1200,
          cost: 700,
          discountPercent: 41.7,
        },
      },
    },
  ];

  for (const config of appConfigs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value },
    });
  }

  console.log('Seed completed!');
  console.log(`Created: 3 subscription plans, 6 credit packs, 1 book-generation, 7 addons`);
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
