import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// bcrypt hash of "password123" with salt rounds 10
const DUMMY_PASSWORD_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ── Static demo data ─────────────────────────────────────────────────────────

const viewerData = [
  { email: 'alex.rivers@example.com' },
  { email: 'jamie.luna@example.com' },
  { email: 'morgan.cole@example.com' },
  { email: 'taylor.west@example.com' },
  { email: 'casey.night@example.com' },
];

const artistUserData = [
  { email: 'nova.eclipse@moonirat.com' },
  { email: 'solaris.king@moonirat.com' },
  { email: 'velvet.storm@moonirat.com' },
];

const artistProfileData = [
  {
    name: 'Nova Eclipse',
    bio: 'Indie-electronic producer from Berlin. Blending synth-wave textures with cinematic visuals that pull you into another dimension.',
    profileImage: 'https://i.pravatar.cc/300?img=11',
    verified: true,
    followersCount: 84,
  },
  {
    name: 'Solaris King',
    bio: 'Hip-hop artist and visual storyteller from Lagos. Every frame is intentional, every bar deliberate.',
    profileImage: 'https://i.pravatar.cc/300?img=33',
    verified: false,
    followersCount: 52,
  },
  {
    name: 'Velvet Storm',
    bio: 'Alt-pop duo with a love for moody lighting and big choruses. Our music videos are mini-films.',
    profileImage: 'https://i.pravatar.cc/300?img=47',
    verified: false,
    followersCount: 31,
  },
];

const videoData = [
  // Nova Eclipse
  {
    title: 'Neon Drift',
    description: 'A late-night drive through a rain-soaked city. Synths, neon, and speed.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/nova-neon-drift.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/neon-drift/640/360',
    views: randomInt(3000, 9800),
    createdAt: recentDate(3),
  },
  {
    title: 'Orbit',
    description: 'Zero-gravity visuals set to a pulsing synth-wave beat. Shot in one continuous take.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/nova-orbit.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/orbit/640/360',
    views: randomInt(1500, 7200),
    createdAt: recentDate(10),
  },
  {
    title: 'Glass City',
    description: 'Reflections and refractions. A visual meditation on isolation in modern architecture.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/nova-glass-city.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/glasscity/640/360',
    views: randomInt(800, 4400),
    createdAt: recentDate(22),
  },
  // Solaris King
  {
    title: 'King of the Afternoon',
    description: 'Shot over one afternoon in Lagos. Sun, shadow, and bars that hit different at golden hour.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/solaris-king-afternoon.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/afternoon/640/360',
    views: randomInt(2100, 8600),
    createdAt: recentDate(6),
  },
  {
    title: 'Frequency',
    description: 'Visualising the frequency of the streets. Raw, honest, and unflinching.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/solaris-frequency.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/frequency/640/360',
    views: randomInt(900, 5500),
    createdAt: recentDate(18),
  },
  // Velvet Storm
  {
    title: 'Paper Sky',
    description: 'We built a sky from paper and burned it down. A breakup song in three acts.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/velvet-paper-sky.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/papersky/640/360',
    views: randomInt(4200, 9900),
    createdAt: recentDate(2),
  },
  {
    title: 'Heavy Weather',
    description: 'Shot in a storm. No CGI. Just rain, a lighthouse, and two people trying to hold on.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/velvet-heavy-weather.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/heavyweather/640/360',
    views: randomInt(1800, 6100),
    createdAt: recentDate(14),
  },
  {
    title: 'Still Life',
    description: 'A quiet, intimate performance video. No effects — just the song.',
    videoUrl: 'https://s3.amazonaws.com/moonirat/videos/velvet-still-life.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/stilllife/640/360',
    views: randomInt(500, 2800),
    createdAt: recentDate(30),
  },
];

const playlistNames = [
  'My Favorites',
  'Chill Vibes',
  'Late Night Drive',
  'Top Hits',
  'Moodboard',
  'Workout Mix',
  'Rainy Day',
  'Road Trip',
  'Focus Mode',
  'Weekend Feels',
  'Deep Cuts',
  'New Discoveries',
  'Rewind',
  'Morning Energy',
  'After Hours',
];

// ── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌙  Moonirat — Database Seeder\n');

  // ── 1. Clean existing data (safe order) ──────────────────────────────────
  console.log('Cleaning existing seed data...');
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.video.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.user.deleteMany();

  // ── 2. Seed users ────────────────────────────────────────────────────────
  console.log('Seeding users...');

  const viewers = await Promise.all(
    viewerData.map((v) =>
      prisma.user.create({
        data: {
          email: v.email,
          passwordHash: DUMMY_PASSWORD_HASH,
          role: Role.VIEWER,
        },
      }),
    ),
  );
  console.log(`  ✓ ${viewers.length} viewer accounts`);

  const artistUsers = await Promise.all(
    artistUserData.map((a) =>
      prisma.user.create({
        data: {
          email: a.email,
          passwordHash: DUMMY_PASSWORD_HASH,
          role: Role.ARTIST,
        },
      }),
    ),
  );
  console.log(`  ✓ ${artistUsers.length} artist accounts`);

  // ── 3. Seed artist profiles ──────────────────────────────────────────────
  console.log('Seeding artists...');

  const artists = await Promise.all(
    artistProfileData.map((profile, i) =>
      prisma.artist.create({
        data: {
          userId: artistUsers[i].id,
          name: profile.name,
          bio: profile.bio,
          profileImage: profile.profileImage,
          verified: profile.verified,
          followersCount: profile.followersCount,
        },
      }),
    ),
  );
  console.log(`  ✓ ${artists.length} artist profiles`);

  // ── 4. Seed videos ────────────────────────────────────────────────────────
  console.log('Seeding videos...');

  // Videos 0-2 → Nova Eclipse, 3-4 → Solaris King, 5-7 → Velvet Storm
  const artistVideoMap: [number, number][] = [
    [0, 0], [1, 0], [2, 0],
    [3, 1], [4, 1],
    [5, 2], [6, 2], [7, 2],
  ];

  const videos = await Promise.all(
    artistVideoMap.map(([vIdx, aIdx]) =>
      prisma.video.create({
        data: {
          artistId: artists[aIdx].id,
          title: videoData[vIdx].title,
          description: videoData[vIdx].description,
          videoUrl: videoData[vIdx].videoUrl,
          thumbnailUrl: videoData[vIdx].thumbnailUrl,
          views: videoData[vIdx].views,
          createdAt: videoData[vIdx].createdAt,
        },
      }),
    ),
  );
  console.log(`  ✓ ${videos.length} videos`);

  // ── 5. Seed follows ───────────────────────────────────────────────────────
  console.log('Seeding follows...');

  // Each viewer follows 1–3 artists (no duplicates)
  const followPairs = new Set<string>();
  const followsToCreate: { userId: string; artistId: string }[] = [];

  for (const viewer of viewers) {
    const count = randomInt(1, 3);
    const shuffled = [...artists].sort(() => Math.random() - 0.5).slice(0, count);
    for (const artist of shuffled) {
      const key = `${viewer.id}:${artist.id}`;
      if (!followPairs.has(key)) {
        followPairs.add(key);
        followsToCreate.push({ userId: viewer.id, artistId: artist.id });
      }
    }
  }

  // Artists follow each other (cross-follows)
  const crossFollows: [number, number][] = [[0, 1], [1, 2], [2, 0]];
  for (const [uIdx, aIdx] of crossFollows) {
    const key = `${artistUsers[uIdx].id}:${artists[aIdx].id}`;
    if (!followPairs.has(key)) {
      followPairs.add(key);
      followsToCreate.push({ userId: artistUsers[uIdx].id, artistId: artists[aIdx].id });
    }
  }

  await prisma.follow.createMany({ data: followsToCreate });
  console.log(`  ✓ ${followsToCreate.length} follows`);

  // Update follower counts to reflect seeded follows
  for (const artist of artists) {
    const count = await prisma.follow.count({ where: { artistId: artist.id } });
    await prisma.artist.update({
      where: { id: artist.id },
      data: { followersCount: count },
    });
  }

  // ── 6. Seed playlists ─────────────────────────────────────────────────────
  console.log('Seeding playlists...');

  const playlists: Awaited<ReturnType<typeof prisma.playlist.create>>[] = [];

  // 3 playlists per viewer
  const namePool = [...playlistNames].sort(() => Math.random() - 0.5);
  let nameIdx = 0;

  for (const viewer of viewers) {
    for (let i = 0; i < 3; i++) {
      const pl = await prisma.playlist.create({
        data: {
          userId: viewer.id,
          name: namePool[nameIdx++ % namePool.length],
        },
      });
      playlists.push(pl);
    }
  }
  console.log(`  ✓ ${playlists.length} playlists`);

  // ── 7. Seed playlist items ────────────────────────────────────────────────
  const playlistItemsToCreate: { playlistId: string; videoId: string }[] = [];
  const itemKeys = new Set<string>();

  for (const pl of playlists) {
    const count = randomInt(2, 5);
    const shuffledVideos = [...videos].sort(() => Math.random() - 0.5).slice(0, count);
    for (const video of shuffledVideos) {
      const key = `${pl.id}:${video.id}`;
      if (!itemKeys.has(key)) {
        itemKeys.add(key);
        playlistItemsToCreate.push({ playlistId: pl.id, videoId: video.id });
      }
    }
  }

  await prisma.playlistItem.createMany({ data: playlistItemsToCreate });
  console.log(`  ✓ ${playlistItemsToCreate.length} playlist items`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅  Seed completed successfully\n');
  console.log('  Demo login credentials (all accounts use the same password):');
  console.log('  Password: password123\n');
  console.log('  Viewers:');
  viewers.forEach((v) => console.log(`    ${v.email}`));
  console.log('\n  Artists:');
  artistUsers.forEach((a, i) =>
    console.log(`    ${a.email}  →  ${artistProfileData[i].name}`),
  );
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
