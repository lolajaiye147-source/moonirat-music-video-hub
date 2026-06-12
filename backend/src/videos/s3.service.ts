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

  constructor(private config: ConfigService) {
    this.client = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      endpoint: config.get('AWS_S3_ENDPOINT'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: !!config.get('AWS_S3_ENDPOINT'),
    });
    this.bucket = config.get('AWS_S3_BUCKET', 'moonirat-videos');
  }

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
    const endpoint = this.config.get('AWS_S3_ENDPOINT') || `https://s3.amazonaws.com`;
    const fileUrl = `${endpoint}/${this.bucket}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async deleteObject(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
