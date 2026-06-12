import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateArtistDto) {
    const existing = await this.prisma.artist.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Artist profile already exists');

    return this.prisma.artist.create({
      data: { userId, ...dto },
    });
  }

  async findById(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [artists, total] = await Promise.all([
      this.prisma.artist.findMany({ skip, take: limit, orderBy: { followersCount: 'desc' } }),
      this.prisma.artist.count(),
    ]);
    return { artists, total, page, limit };
  }

  async update(userId: string, dto: UpdateArtistDto) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new NotFoundException('Artist profile not found');

    return this.prisma.artist.update({ where: { userId }, data: dto });
  }

  async getArtistVideos(artistId: string, page = 1, limit = 20) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { artistId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.video.count({ where: { artistId } }),
    ]);
    return { videos, total, page, limit };
  }

  async requestVerification(userId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new NotFoundException('Artist profile not found');
    if (artist.verified) throw new ConflictException('Artist already verified');

    return this.prisma.artist.update({
      where: { userId },
      data: { verificationRequestedAt: new Date() },
    });
  }

  async getMyProfile(userId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new NotFoundException('Artist profile not found');
    return artist;
  }
}
