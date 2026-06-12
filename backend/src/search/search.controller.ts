import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('videos')
  @ApiOperation({ summary: 'Search videos by title or description (LIKE query)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchVideos(
    @Query('q') q: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchVideos(q, +page, +limit);
  }

  @Get('artists')
  @ApiOperation({ summary: 'Search artists by name or bio (LIKE query)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchArtists(
    @Query('q') q: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchArtists(q, +page, +limit);
  }
}
