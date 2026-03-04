import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly appConfig: AppConfigService) {
    this.bucket = this.appConfig.r2Bucket;
    this.publicUrl = this.appConfig.r2PublicUrl;

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.appConfig.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.appConfig.r2AccessKey,
        secretAccessKey: this.appConfig.r2SecretKey,
      },
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.appConfig.r2AccountId}.r2.cloudflarestorage.com/${this.bucket}/${key}`;

    this.logger.log(`Uploaded file: ${key}`);
    return url;
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSec = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSec });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.log(`Deleted file: ${key}`);
  }
}
