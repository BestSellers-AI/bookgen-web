import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductKind } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { ProductService } from './product.service';

@Controller('products')
@Public()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query('kind') kind?: ProductKind) {
    return this.productService.findAll(kind);
  }

  @Get('credit-packs')
  async getCreditPacks() {
    return this.productService.getCreditPacks();
  }

  @Get('subscription-plans')
  async getSubscriptionPlans() {
    return this.productService.getSubscriptionPlans();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }
}
