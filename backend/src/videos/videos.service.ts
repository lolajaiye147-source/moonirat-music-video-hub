import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async getUploadUrl(contentType: string, type: 'videos' | 'thumbnails') {
    return this.s3.getPresignedUploadUrl(type, contentType);
  }

  async create(userId: string, dto: CreateVideoDto) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new ForbiddenException('Artist profile required to upload videos');

    return this.prisma.video.create({
      data: { artistId: artist.id, ...dto },
      include: { artist: { select: { name: true, profileImage: true } } },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
      }),
      this.prisma.video.count(),
    ]);
    return { videos, total, page, limit };
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async incrementViews(id: string) {
    return this.prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  async update(id: string, userId: string, dto: UpdateVideoDto) {
    const video = await this.findOne(id);
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist || video.artistId !== artist.id) throw new ForbiddenException();

    return this.prisma.video.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const video = await this.findOne(id);
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist || video.artistId !== artist.id) throw new ForbiddenException();

    await this.prisma.video.delete({ where: { id } });
    return { message: 'Video deleted successfully' };
  }

  async trending(limit = 10) {
    return this.prisma.video.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
    });
  }

  async newReleases(limit = 10) {
    return this.prisma.video.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
    });
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { views: 'desc' },
        include: { artist: { select: { id: true, name: true, profileImage: true } } },
      }),
      this.prisma.video.count({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    return { videos, total, page, limit };
  }
}
