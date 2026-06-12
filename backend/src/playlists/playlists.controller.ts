import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoDto } from './dto/add-video.dto';

@ApiTags('Playlists')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a playlist' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my playlists' })
  findMyPlaylists(@CurrentUser('id') userId: string) {
    return this.playlistsService.findMyPlaylists(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist details' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.playlistsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update playlist name' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a playlist' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.playlistsService.remove(id, userId);
  }

  @Post(':id/videos')
  @ApiOperation({ summary: 'Add video to playlist' })
  addVideo(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddVideoDto,
  ) {
    return this.playlistsService.addVideo(id, userId, dto);
  }

  @Delete(':id/videos/:videoId')
  @ApiOperation({ summary: 'Remove video from playlist' })
  removeVideo(
    @Param('id') id: string,
    @Param('videoId') videoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playlistsService.removeVideo(id, videoId, userId);
  }
}
