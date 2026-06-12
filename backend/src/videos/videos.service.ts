import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { VideoStatus } from '@prisma/client';
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

  // ── Upload helpers ────────────────────────────────────────────────────────

  async getUploadUrl(contentType: string, type: 'videos' | 'thumbnails') {
    return this.s3.getPresignedUploadUrl(type, contentType);
  }

  /** Server-side Multer upload: store files in S3 then persist metadata */
  async uploadAndCreate(
    userId: string,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    meta: { title: string; description?: string; duration?: number },
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new ForbiddenException('Artist profile required to upload videos');

    const [videoResult, thumbResult] = await Promise.all([
      this.s3.uploadBuffer('videos', videoFile.buffer, videoFile.mimetype, videoFile.originalname),
      thumbnailFile
        ? this.s3.uploadBuffer('thumbnails', thumbnailFile.buffer, thumbnailFile.mimetype, thumbnailFile.originalname)
        : Promise.resolve(null),
    ]);

    return this.prisma.video.create({
      data: {
        artistId: artist.id,
        title: meta.title,
        description: meta.description,
        duration: meta.duration,
        videoUrl: videoResult.fileUrl,
        thumbnailUrl: thumbResult?.fileUrl ?? null,
        status: VideoStatus.READY,
      },
      include: { artist: { select: { name: true, profileImage: true } } },
    });
  }

  // ── Metadata-only create (after client-side presigned upload) ─────────────

  async create(userId: string, dto: CreateVideoDto) {
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new ForbiddenException('Artist profile required to upload videos');

    return this.prisma.video.create({
      data: { artistId: artist.id, ...dto },
      include: { artist: { select: { name: true, profileImage: true } } },
    });
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { status: VideoStatus.READY },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
      }),
      this.prisma.video.count({ where: { status: VideoStatus.READY } }),
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

  async trending(limit = 10) {
    return this.prisma.video.findMany({
      where: { status: VideoStatus.READY },
      take: limit,
      orderBy: { views: 'desc' },
      include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
    });
  }

  async newReleases(limit = 10) {
    return this.prisma.video.findMany({
      where: { status: VideoStatus.READY },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { artist: { select: { id: true, name: true, profileImage: true, verified: true } } },
    });
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      status: VideoStatus.READY,
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy: { views: 'desc' },
        include: { artist: { select: { id: true, name: true, profileImage: true } } },
      }),
      this.prisma.video.count({ where }),
    ]);
    return { videos, total, page, limit };
  }

  async incrementViews(id: string) {
    return this.prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  // ── Writes ────────────────────────────────────────────────────────────────

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
}
