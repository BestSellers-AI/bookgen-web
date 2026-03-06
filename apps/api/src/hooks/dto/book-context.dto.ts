import { IsOptional, IsString } from 'class-validator';

export class BookContextDto {
  @IsOptional()
  @IsString()
  bookId!: string;

  @IsString()
  context!: string;
}
