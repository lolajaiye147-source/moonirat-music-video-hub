import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsInt, Min, IsEnum } from 'class-validator';
import { VideoStatus } from '@prisma/client';

export class CreateVideoDto {
  @ApiProperty({ example: 'Midnight Drive' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'A cinematic journey through neon-lit streets.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/moonirat-videos/videos/abc123.mp4' })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/moonirat-videos/thumbnails/abc123.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 213, description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ enum: VideoStatus, default: VideoStatus.READY })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;
}
