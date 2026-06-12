import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

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

  @ApiProperty({ example: 'https://cdn.example.com/video.mp4' })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
