import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService, S3Service],
  exports: [VideosService],
})
export class VideosModule {}
