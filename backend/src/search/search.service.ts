import { Injectable } from '@nestjs/common';
import { VideoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchVideos(q: string, page = 1, limit = 20) {
    if (!q?.trim()) return { videos: [], total: 0, page, limit };

    const skip = (page - 1) * limit;
    const where = {
      status: VideoStatus.READY,
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    };

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy: { views: 'desc' },
        include: {
          artist: { select: { id: true, name: true, profileImage: true, verified: true } },
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    return { videos, total, page, limit, query: q };
  }

  async searchArtists(q: string, page = 1, limit = 20) {
    if (!q?.trim()) return { artists: [], total: 0, page, limit };

    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { bio: { contains: q, mode: 'insensitive' as const } },
      ],
    };

    const [artists, total] = await Promise.all([
      this.prisma.artist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { followersCount: 'desc' },
      }),
      this.prisma.artist.count({ where }),
    ]);

    return { artists, total, page, limit, query: q };
  }
}
