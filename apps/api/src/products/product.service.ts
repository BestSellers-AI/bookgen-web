import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List active products, optionally filtered by kind.
   * Includes prices and orders by sortOrder ASC.
   */
  async findAll(kind?: ProductKind) {
    const where: Record<string, unknown> = { isActive: true };
    if (kind) {
      where.kind = kind;
    }

    return this.prisma.product.findMany({
      where,
      include: { prices: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Find a single product by slug, including prices.
   * Throws NotFoundException if not found.
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { prices: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  /**
   * Shortcut: list active credit pack products.
   */
  async getCreditPacks() {
    return this.findAll(ProductKind.CREDIT_PACK);
  }

  /**
   * Shortcut: list active subscription plan products.
   */
  async getSubscriptionPlans() {
    return this.findAll(ProductKind.SUBSCRIPTION_PLAN);
  }
}
