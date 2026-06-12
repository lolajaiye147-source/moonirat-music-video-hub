import { Injectable } from '@nestjs/common';
import { VideoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getHomeFeed(userId?: string) {
    const artistInclude = {
      select: { id: true, name: true, profileImage: true, verified: true },
    };

    const [trending, newReleases, followedVideos] = await Promise.all([
      this.prisma.video.findMany({
        where: { status: VideoStatus.READY },
        take: 10,
        orderBy: { views: 'desc' },
        include: { artist: artistInclude },
      }),

      this.prisma.video.findMany({
        where: { status: VideoStatus.READY },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { artist: artistInclude },
      }),

      userId
        ? this.prisma.video.findMany({
            where: {
              status: VideoStatus.READY,
              artist: {
                follows: { some: { userId } },
              },
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { artist: artistInclude },
          })
        : Promise.resolve([]),
    ]);

    // Deduplicate across buckets by id, preserving priority order:
    // followed → trending → new
    const seen = new Set<string>();
    const dedup = (videos: typeof trending) =>
      videos.filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

    return {
      followed: dedup(followedVideos),
      trending: dedup(trending),
      newReleases: dedup(newReleases),
    };
  }
}
