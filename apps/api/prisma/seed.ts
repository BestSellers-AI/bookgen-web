import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      prices: {
        create: [
          { currency: 'usd', amount: 2900, stripePriceId: null }, // monthly
          { currency: 'usd', amount: 22800, stripePriceId: null }, // annual
        ],
      },
    },
  });

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
      prices: {
        create: [
          { currency: 'usd', amount: 5900, stripePriceId: null },
          { currency: 'usd', amount: 46800, stripePriceId: null },
        ],
      },
    },
  });

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
      prices: {
        create: [
          { currency: 'usd', amount: 13900, stripePriceId: null },
          { currency: 'usd', amount: 106800, stripePriceId: null },
        ],
      },
    },
  });

  // ============================================
  // One-Time Book Purchase
  // ============================================
  await prisma.product.upsert({
    where: { slug: 'one-time-book' },
    update: {},
    create: {
      name: 'Obra Aspirante',
      slug: 'one-time-book',
      kind: 'ONE_TIME_BOOK',
      description: 'Generate 1 complete book (DOCX + PDF, personal license)',
      creditsAmount: 100,
      sortOrder: 10,
      prices: {
        create: [{ currency: 'usd', amount: 1900 }],
      },
    },
  });

  // ============================================
  // Credit Packs
  // ============================================
  await prisma.product.upsert({
    where: { slug: 'pack-100' },
    update: {},
    create: {
      name: '100 Credits',
      slug: 'pack-100',
      kind: 'CREDIT_PACK',
      description: '100 credits that never expire',
      creditsAmount: 100,
      sortOrder: 20,
      prices: {
        create: [{ currency: 'usd', amount: 990 }],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'pack-300' },
    update: {},
    create: {
      name: '300 Credits',
      slug: 'pack-300',
      kind: 'CREDIT_PACK',
      description: '300 credits that never expire',
      creditsAmount: 300,
      sortOrder: 21,
      prices: {
        create: [{ currency: 'usd', amount: 2490 }],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'pack-500' },
    update: {},
    create: {
      name: '500 Credits',
      slug: 'pack-500',
      kind: 'CREDIT_PACK',
      description: '500 credits that never expire',
      creditsAmount: 500,
      sortOrder: 22,
      prices: {
        create: [{ currency: 'usd', amount: 3490 }],
      },
    },
  });

  // ============================================
  // Book Generation Product
  // ============================================
  await prisma.product.upsert({
    where: { slug: 'book-generation' },
    update: {},
    create: {
      name: 'Book Generation',
      slug: 'book-generation',
      kind: 'BOOK_GENERATION',
      description: 'Generate a complete book',
      sortOrder: 30,
      prices: {
        create: [{ currency: 'usd', amount: 0, creditsCost: 100 }],
      },
    },
  });

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
    await prisma.product.upsert({
      where: { slug: addon.slug },
      update: {},
      create: {
        name: addon.name,
        slug: addon.slug,
        kind: addon.kind,
        sortOrder: addon.sort,
        prices: {
          create: [{ currency: 'usd', amount: 0, creditsCost: addon.credits }],
        },
      },
    });
  }

  console.log('Seed completed!');
  console.log(`Created: 3 subscription plans, 1 one-time book, 3 credit packs, 1 book-generation, 7 addons`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
