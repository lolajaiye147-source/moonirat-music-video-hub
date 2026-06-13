import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoDto } from './dto/add-video.dto';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePlaylistDto) {
    return this.prisma.playlist.create({ data: { userId, name: dto.name } });
  }

  async findMyPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userId },
      include: { items: { include: { video: { include: { artist: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            video: { include: { artist: { select: { id: true, name: true, profileImage: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userId !== userId) throw new ForbiddenException();
    return playlist;
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    await this.findOne(id, userId);
    return this.prisma.playlist.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.playlist.delete({ where: { id } });
    return { message: 'Playlist deleted' };
  }

  async addVideo(playlistId: string, userId: string, dto: AddVideoDto) {
    await this.findOne(playlistId, userId);
    const video = await this.prisma.video.findUnique({ where: { id: dto.videoId } });
    if (!video) throw new NotFoundException('Video not found');

    try {
      return await this.prisma.playlistItem.create({
        data: { playlistId, videoId: dto.videoId },
      });
    } catch {
      throw new ConflictException('Video already in playlist');
    }
  }

  async removeVideo(playlistId: string, videoId: string, userId: string) {
    await this.findOne(playlistId, userId);
    const item = await this.prisma.playlistItem.findUnique({
      where: { playlistId_videoId: { playlistId, videoId } },
    });
    if (!item) throw new NotFoundException('Video not in playlist');
    await this.prisma.playlistItem.delete({
      where: { playlistId_videoId: { playlistId, videoId } },
    });
    return { message: 'Video removed from playlist' };
  }
}
