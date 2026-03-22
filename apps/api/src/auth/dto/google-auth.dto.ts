import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  idToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  browserLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  geoCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  geoCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fbp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fbc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  leadEventId?: string;
}
