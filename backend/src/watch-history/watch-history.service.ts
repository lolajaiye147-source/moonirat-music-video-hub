import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchHistoryService {
  constructor(private prisma: PrismaService) {}

  /** Record a watch event and increment the video's view counter atomically */
  async record(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const [history] = await this.prisma.$transaction([
      this.prisma.watchHistory.create({ data: { userId, videoId } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
      }),
    ]);

    return history;
  }

  /** Get the current user's full watch history (newest first, paginated) */
  async getMyHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { watchedAt: 'desc' },
        include: {
          video: {
            include: {
              artist: { select: { id: true, name: true, profileImage: true } },
            },
          },
        },
      }),
      this.prisma.watchHistory.count({ where: { userId } }),
    ]);
    return { history, total, page, limit };
  }

  /** Clear the current user's entire watch history */
  async clearMyHistory(userId: string) {
    await this.prisma.watchHistory.deleteMany({ where: { userId } });
    return { message: 'Watch history cleared' };
  }
}
