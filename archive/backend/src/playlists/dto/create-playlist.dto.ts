import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Late Night Vibes' })
  @IsString()
  @MaxLength(100)
  name: string;
}
