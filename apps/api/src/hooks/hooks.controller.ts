import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { N8nSecretGuard } from './guards/n8n-secret.guard';
import { HooksService } from './hooks.service';
import {
  PreviewResultDto,
  ChapterResultDto,
  GenerationCompleteDto,
  GenerationErrorDto,
  AddonResultDto,
  TranslationChapterResultDto,
} from './dto';

@Controller('hooks/n8n')
@Public()
@SkipThrottle()
@UseGuards(N8nSecretGuard)
export class HooksController {
  constructor(private readonly hooksService: HooksService) {}

  @Post('preview-result')
  @HttpCode(200)
  async previewResult(@Body() dto: PreviewResultDto) {
    await this.hooksService.processPreviewResult(dto);
    return { received: true };
  }

  @Post('chapter-result')
  @HttpCode(200)
  async chapterResult(@Body() dto: ChapterResultDto) {
    await this.hooksService.processChapterResult(dto);
    return { received: true };
  }

  @Post('generation-complete')
  @HttpCode(200)
  async generationComplete(@Body() dto: GenerationCompleteDto) {
    await this.hooksService.processGenerationComplete(dto);
    return { received: true };
  }

  @Post('generation-error')
  @HttpCode(200)
  async generationError(@Body() dto: GenerationErrorDto) {
    await this.hooksService.processGenerationError(dto);
    return { received: true };
  }

  @Post('addon-result')
  @HttpCode(200)
  async addonResult(@Body() dto: AddonResultDto) {
    await this.hooksService.processAddonResult(dto);
    return { received: true };
  }

  @Post('translation-chapter')
  @HttpCode(200)
  async translationChapter(@Body() dto: TranslationChapterResultDto) {
    await this.hooksService.processTranslationChapter(dto);
    return { received: true };
  }
}
