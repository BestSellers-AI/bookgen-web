import { IsOptional, IsEnum, IsString, IsIn } from 'class-validator';
import { BookStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class BookQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'title', 'updatedAt'])
  sortBy?: 'createdAt' | 'title' | 'updatedAt' = 'createdAt';
}
