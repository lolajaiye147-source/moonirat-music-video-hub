import { Controller, Post, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FollowsService } from './follows.service';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private followsService: FollowsService) {}

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

  @Get('artists/:artistId/followers')
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

  @Get('me')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get artists I follow' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowedArtists(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followsService.getFollowedArtists(userId, +page, +limit);
  }
}
