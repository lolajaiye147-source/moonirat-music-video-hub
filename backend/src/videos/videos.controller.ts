import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  // ── Static / named routes first (must precede /:id) ───────────────────────

  @Get('trending')
  @ApiOperation({ summary: 'Get trending videos by view count' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  trending(@Query('limit') limit = 10) {
    return this.videosService.trending(+limit);
  }

  /** GET /videos/new  — spec-required alias */
  @Get('new')
  @ApiOperation({ summary: 'Get newest video releases (alias: /new-releases)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  newReleasesAlias(@Query('limit') limit = 10) {
    return this.videosService.newReleases(+limit);
  }

  @Get('new-releases')
  @ApiOperation({ summary: 'Get newest video releases' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  newReleases(@Query('limit') limit = 10) {
    return this.videosService.newReleases(+limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search videos by title or description' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @Query('q') q: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.videosService.search(q, +page, +limit);
  }

  // ── Collection ────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all videos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.videosService.findAll(+page, +limit);
  }

  @Post('upload-url')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get presigned S3 URL for video/thumbnail upload' })
  getUploadUrl(
    @Body('contentType') contentType: string,
    @Body('type') type: 'videos' | 'thumbnails',
  ) {
    return this.videosService.getUploadUrl(contentType, type || 'videos');
  }

  @Post()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create video record after S3 upload' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVideoDto) {
    return this.videosService.create(userId, dto);
  }

  // ── Single resource (/:id last to avoid swallowing named routes) ──────────

  @Get(':id')
  @ApiOperation({ summary: 'Get video details' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment video view count' })
  incrementViews(@Param('id') id: string) {
    return this.videosService.incrementViews(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update video metadata' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videosService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a video' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.videosService.remove(id, userId);
  }
}
