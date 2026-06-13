import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArtistsModule } from './artists/artists.module';
import { VideosModule } from './videos/videos.module';
import { FollowsModule } from './follows/follows.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { FeedModule } from './feed/feed.module';
import { SearchModule } from './search/search.module';
import { WatchHistoryModule } from './watch-history/watch-history.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    VideosModule,
    FollowsModule,
    PlaylistsModule,
    FeedModule,
    SearchModule,
    WatchHistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
