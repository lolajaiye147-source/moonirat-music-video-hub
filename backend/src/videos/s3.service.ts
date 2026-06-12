import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private config: ConfigService) {
    const customEndpoint = config.get<string>('AWS_S3_ENDPOINT');
    this.client = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      ...(customEndpoint ? { endpoint: customEndpoint } : {}),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', 'changeme'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', 'changeme'),
      },
      forcePathStyle: !!customEndpoint,
    });
    this.bucket = config.get('AWS_S3_BUCKET', 'moonirat-videos');
    this.endpoint = customEndpoint || 'https://s3.amazonaws.com';
  }

  private buildPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  /** Generate presigned URL for client-side upload */
  async getPresignedUploadUrl(
    folder: 'videos' | 'thumbnails',
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const ext = contentType.split('/')[1] || 'mp4';
    const key = `${folder}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return { uploadUrl, fileUrl: this.buildPublicUrl(key), key };
  }

  /** Upload a buffer directly (server-side — used by Multer upload flow) */
  async uploadBuffer(
    folder: 'videos' | 'thumbnails',
    buffer: Buffer,
    contentType: string,
    originalName?: string,
  ): Promise<{ fileUrl: string; key: string }> {
    const ext = originalName?.split('.').pop() || contentType.split('/')[1] || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { fileUrl: this.buildPublicUrl(key), key };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
