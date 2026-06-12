import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  /**
   * GET /feed/home
   * Returns trending, new releases, and (when authenticated) followed-artist videos.
   * Auth is optional — unauthenticated callers still get trending + new.
   */
  @Get('home')
  @ApiOperation({
    summary: 'Home feed — trending, new releases, and followed artists',
    description:
      'Returns three ranked buckets. Authenticate with JWT to also receive followed-artists section. Videos are deduplicated across buckets.',
  })
  async home(@Request() req: any) {
    const userId: string | undefined = req.user?.id;
    return this.feedService.getHomeFeed(userId);
  }

  /** Authenticated alias — same endpoint but JWT required */
  @Get('home/authenticated')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Home feed (authenticated — includes followed artists)' })
  homeAuth(@Request() req: any) {
    return this.feedService.getHomeFeed(req.user.id);
  }
}
