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
  private readonly region: string;

  constructor(private readonly appConfig: AppConfigService) {
    this.bucket = this.appConfig.s3Bucket;
    this.publicUrl = this.appConfig.s3PublicUrl;
    this.region = this.appConfig.s3Region;

    const s3Options: ConstructorParameters<typeof S3Client>[0] = {
      region: this.region,
      credentials: {
        accessKeyId: this.appConfig.s3AccessKey,
        secretAccessKey: this.appConfig.s3SecretKey,
      },
    };

    // Custom endpoint for S3-compatible services (R2, MinIO, etc.)
    const endpoint = this.appConfig.s3Endpoint;
    if (endpoint) {
      s3Options.endpoint = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`;
      s3Options.forcePathStyle = true;
    }

    this.s3 = new S3Client(s3Options);
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
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

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
