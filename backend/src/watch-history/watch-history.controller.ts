import { Controller, Post, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WatchHistoryService } from './watch-history.service';

@ApiTags('Watch History')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('watch-history')
export class WatchHistoryController {
  constructor(private watchHistoryService: WatchHistoryService) {}

  /** POST /watch-history/:videoId  — record a watch event + increment views */
  @Post(':videoId')
  @ApiOperation({
    summary: 'Record a video watch event',
    description: 'Stores watch history and increments the video view counter atomically.',
  })
  record(
    @CurrentUser('id') userId: string,
    @Param('videoId') videoId: string,
  ) {
    return this.watchHistoryService.record(userId, videoId);
  }

  /** GET /watch-history  — current user's history, newest first */
  @Get()
  @ApiOperation({ summary: "Get current user's watch history" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.watchHistoryService.getMyHistory(userId, +page, +limit);
  }

  /** DELETE /watch-history  — wipe current user's history */
  @Delete()
  @ApiOperation({ summary: "Clear current user's watch history" })
  clearMyHistory(@CurrentUser('id') userId: string) {
    return this.watchHistoryService.clearMyHistory(userId);
  }
}
