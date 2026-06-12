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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  // ── Named routes first (must precede /:id) ────────────────────────────────

  @Get('trending')
  @ApiOperation({ summary: 'Get trending videos by view count' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  trending(@Query('limit') limit = 10) {
    return this.videosService.trending(+limit);
  }

  @Get('new')
  @ApiOperation({ summary: 'Get newest video releases' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  newReleases(@Query('limit') limit = 10) {
    return this.videosService.newReleases(+limit);
  }

  @Get('new-releases')
  @ApiOperation({ summary: 'Get newest video releases (alias: /new)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  newReleasesAlias(@Query('limit') limit = 10) {
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
  @ApiOperation({ summary: 'List all videos (feed)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.videosService.findAll(+page, +limit);
  }

  /**
   * POST /videos/upload — real Multer/S3 upload (multipart/form-data)
   * Accepts: video file (required) + thumbnail file (optional) + JSON body fields
   */
  @Post('upload')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video', 'title'],
      properties: {
        video:       { type: 'string', format: 'binary', description: 'Video file (mp4, mov, etc.)' },
        thumbnail:   { type: 'string', format: 'binary', description: 'Thumbnail image (jpg, png) — optional' },
        title:       { type: 'string', example: 'Midnight Drive' },
        description: { type: 'string', example: 'A cinematic night-drive video' },
        duration:    { type: 'integer', example: 213, description: 'Duration in seconds' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload video + thumbnail directly (multipart/form-data)' })
  async uploadVideo(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('duration') duration?: string,
  ) {
    const videoFile = files?.video?.[0];
    if (!videoFile) throw new BadRequestException('Video file is required');
    if (!title?.trim()) throw new BadRequestException('title is required');

    return this.videosService.uploadAndCreate(
      userId,
      videoFile,
      files?.thumbnail?.[0],
      { title, description, duration: duration ? parseInt(duration, 10) : undefined },
    );
  }

  /** POST /videos/upload-url — generate presigned URL for client-side upload */
  @Post('upload-url')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get presigned S3 URL for client-side upload' })
  getUploadUrl(
    @Body('contentType') contentType: string,
    @Body('type') type: 'videos' | 'thumbnails',
  ) {
    return this.videosService.getUploadUrl(contentType, type || 'videos');
  }

  /** POST /videos — save metadata after client-side presigned upload */
  @Post()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save video metadata (after client-side S3 upload)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVideoDto) {
    return this.videosService.create(userId, dto);
  }

  // ── Single resource (/:id last) ───────────────────────────────────────────

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
