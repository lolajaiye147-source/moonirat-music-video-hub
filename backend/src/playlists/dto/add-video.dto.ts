import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddVideoDto {
  @ApiProperty({ example: 'uuid-of-the-video' })
  @IsUUID()
  videoId: string;
}
