import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async follow(userId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    if (artist.userId === userId) throw new BadRequestException('Cannot follow yourself');

    try {
      const follow = await this.prisma.follow.create({ data: { userId, artistId } });
      await this.prisma.artist.update({
        where: { id: artistId },
        data: { followersCount: { increment: 1 } },
      });
      return follow;
    } catch {
      throw new ConflictException('Already following this artist');
    }
  }

  async unfollow(userId: string, artistId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    if (!follow) throw new NotFoundException('Not following this artist');

    await this.prisma.follow.delete({ where: { userId_artistId: { userId, artistId } } });
    await this.prisma.artist.update({
      where: { id: artistId },
      data: { followersCount: { decrement: 1 } },
    });
    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(artistId: string, page = 1, limit = 20) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { artistId },
        skip,
        take: limit,
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { artistId } }),
    ]);
    return { followers, total, page, limit };
  }

  async getFollowedArtists(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { artist: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { userId } }),
    ]);
    return { artists: follows.map((f) => f.artist), total, page, limit };
  }
}
