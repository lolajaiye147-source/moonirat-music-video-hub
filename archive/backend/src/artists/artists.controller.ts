import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@ApiTags('Artists')
@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  // ── Static / named routes first ───────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my artist profile' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.artistsService.getMyProfile(userId);
  }

  /** POST /artists/verify-request  — spec-required path */
  @Post('verify-request')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request artist verification (spec alias)' })
  requestVerificationSpec(@CurrentUser('id') userId: string) {
    return this.artistsService.requestVerification(userId);
  }

  /** POST /artists/me/verify  — legacy alias kept for compatibility */
  @Post('me/verify')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request artist verification (alias: /verify-request)' })
  requestVerification(@CurrentUser('id') userId: string) {
    return this.artistsService.requestVerification(userId);
  }

  // ── Collection ────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all artists' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.artistsService.findAll(+page, +limit);
  }

  @Post()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create artist profile' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateArtistDto) {
    return this.artistsService.create(userId, dto);
  }

  // ── Single resource (/:id last to avoid swallowing named routes) ──────────

  @Get(':id')
  @ApiOperation({ summary: 'Get artist profile by ID' })
  findOne(@Param('id') id: string) {
    return this.artistsService.findById(id);
  }

  @Get(':id/videos')
  @ApiOperation({ summary: 'Get videos by artist' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getArtistVideos(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.artistsService.getArtistVideos(id, +page, +limit);
  }

  @Patch('me')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update my artist profile' })
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateArtistDto) {
    return this.artistsService.update(userId, dto);
  }
}
