import { Controller, Post, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FollowsService } from './follows.service';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  // ── Write ──────────────────────────────────────────────────────────────────

  @Post(':artistId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow an artist' })
  follow(@CurrentUser('id') userId: string, @Param('artistId') artistId: string) {
    return this.followsService.follow(userId, artistId);
  }

  @Delete(':artistId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow an artist' })
  unfollow(@CurrentUser('id') userId: string, @Param('artistId') artistId: string) {
    return this.followsService.unfollow(userId, artistId);
  }

  // ── Read (must be declared before /:param routes to avoid shadowing) ────────

  /** GET /follows/following  — spec-required alias */
  @Get('following')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get artists I follow (following list)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowing(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followsService.getFollowedArtists(userId, +page, +limit);
  }

  /** GET /follows/me  — legacy alias kept for compatibility */
  @Get('me')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get artists I follow (alias: /following)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowedArtists(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followsService.getFollowedArtists(userId, +page, +limit);
  }

  /** GET /follows/followers/:artistId  — spec-required path */
  @Get('followers/:artistId')
  @ApiOperation({ summary: 'Get followers of an artist' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowers(
    @Param('artistId') artistId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followsService.getFollowers(artistId, +page, +limit);
  }

  /** GET /follows/artists/:artistId/followers  — legacy alias kept for compatibility */
  @Get('artists/:artistId/followers')
  @ApiOperation({ summary: 'Get followers of an artist (alias: /followers/:artistId)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowersLegacy(
    @Param('artistId') artistId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followsService.getFollowers(artistId, +page, +limit);
  }
}
