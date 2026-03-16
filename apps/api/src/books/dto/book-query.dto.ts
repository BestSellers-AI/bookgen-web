import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class BookQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'title', 'updatedAt'])
  sortBy?: 'createdAt' | 'title' | 'updatedAt' = 'createdAt';
}
