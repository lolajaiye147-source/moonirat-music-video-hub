# Moonirat — Music Video Streaming Platform

A creator-first music video streaming platform where artists upload and manage their music videos, and fans discover, watch, follow, and share.

## Project Structure

```
moonirat/
├── backend/        # NestJS REST API
└── frontend/       # React + Vite frontend
```

---

## Backend (NestJS)

### Tech Stack
- **Node.js** + **NestJS** — REST API framework
- **PostgreSQL** + **Prisma ORM** — Database
- **JWT** — Authentication
- **AWS S3 / S3-compatible** — Video & thumbnail storage
- **Swagger** — API documentation at `/api/docs`

### Setup

```bash
cd backend
npm install
cp .env.example .env    # Fill in your values
npx prisma migrate dev  # Run database migrations
npm run start:dev       # Start development server (port 3000)
```

### API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Register, login, JWT tokens |
| Users | `/api/v1/users` | User profile management |
| Artists | `/api/v1/artists` | Artist profiles, verification |
| Videos | `/api/v1/videos` | Upload, stream, trending, search |
| Follows | `/api/v1/follows` | Follow/unfollow artists |
| Playlists | `/api/v1/playlists` | Create, manage playlists |

### Key Endpoints

```
POST   /api/v1/auth/register         Register (role: VIEWER | ARTIST)
POST   /api/v1/auth/login            Login → JWT token

GET    /api/v1/videos                List all videos
GET    /api/v1/videos/trending       Trending by views
GET    /api/v1/videos/new-releases   Newest uploads
GET    /api/v1/videos/search?q=...   Search videos
GET    /api/v1/videos/:id            Video details
POST   /api/v1/videos/:id/view       Increment view count
POST   /api/v1/videos/upload-url     Get S3 presigned upload URL
POST   /api/v1/videos                Create video record (ARTIST)

GET    /api/v1/artists               List artists
GET    /api/v1/artists/:id           Artist profile
GET    /api/v1/artists/:id/videos    Artist's videos
POST   /api/v1/artists               Create artist profile
POST   /api/v1/artists/me/verify     Request verification

POST   /api/v1/follows/:artistId     Follow artist
DELETE /api/v1/follows/:artistId     Unfollow artist
GET    /api/v1/follows/me            Artists I follow

POST   /api/v1/playlists             Create playlist
GET    /api/v1/playlists             My playlists
POST   /api/v1/playlists/:id/videos  Add video to playlist
DELETE /api/v1/playlists/:id/videos/:videoId  Remove video
```

Swagger docs: `http://localhost:3000/api/docs`

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/moonirat
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=moonirat-videos
AWS_S3_ENDPOINT=https://s3.amazonaws.com
PORT=3000
```

---

## Frontend (React + Vite)

### Tech Stack
- **React 18** + **TypeScript**
- **React Router v6** — Client-side routing
- **TanStack Query v5** — Server state management
- **Tailwind CSS** — Styling
- **React Player** — Video playback
- **Axios** — HTTP client

### Setup

```bash
cd frontend
npm install
cp .env.example .env    # Set VITE_API_URL
npm run dev             # Start dev server (port 5173)
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home — trending & new releases |
| `/trending` | Trending videos |
| `/artists` | Browse all artists |
| `/artists/:id` | Artist profile + follow |
| `/videos/:id` | Video player + details |
| `/search` | Search videos |
| `/playlists` | My playlists (auth) |
| `/following` | Artists I follow (auth) |
| `/dashboard` | Artist dashboard (ARTIST) |
| `/upload` | Upload video (ARTIST) |

---

## Video Upload Flow

1. Artist calls `POST /api/v1/videos/upload-url` → gets S3 presigned URL
2. Client uploads file directly to S3 using the presigned URL
3. Artist calls `POST /api/v1/videos` with the returned `fileUrl` as `videoUrl`

---

## Database Schema

- **Users** — id, email, password_hash, role (VIEWER/ARTIST)
- **Artists** — id, user_id, name, bio, profile_image, verified, followers_count
- **Videos** — id, artist_id, title, description, video_url, thumbnail_url, views
- **Follows** — id, user_id, artist_id (unique constraint)
- **Playlists** — id, user_id, name
- **PlaylistItems** — id, playlist_id, video_id (unique constraint)

---

## V1 Scope

Upload → Discover → Watch → Follow

Not included in V1: comments, ads, monetization, AI recommendations, notifications, live streaming, microservices, advanced video processing.
