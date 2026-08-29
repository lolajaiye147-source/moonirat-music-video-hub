import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import { Upload, Film, Image, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentArtist } from "@/lib/moonirat-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Moonirat" },
      { name: "description", content: "Upload your music videos to Moonirat." },
    ],
  }),
  component: UploadPage,
});

const genres = [
  "Pop",
  "Hip Hop",
  "Electronic",
  "R&B",
  "Rock",
  "Indie",
  "Jazz",
  "Country",
  "Latin",
  "Classical",
  "Afrobeats",
  "Amapiano",
];

function UploadPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const artistQuery = useQuery({
    queryKey: ["artist", "current", user?.id],
    queryFn: () => getCurrentArtist(user!.id),
    enabled: Boolean(user?.id),
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const supportedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
      if (!supportedVideoTypes.includes(file.type)) {
        toast.error("Use an MP4, WebM, or MOV video.");
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be less than 500MB");
        return;
      }
      setVideoFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!supportedImageTypes.includes(file.type)) {
        toast.error("Use a JPG, PNG, WebP, or GIF thumbnail.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Thumbnail must be less than 10MB");
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (!user) {
      toast.error("You must be signed in to upload.");
      return;
    }
    if (!artistQuery.data) {
      toast.error("Create your artist profile before uploading.");
      return;
    }

    setIsUploading(true);
    const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const videoPath = `${user.id}/videos/${crypto.randomUUID()}-${safeName}`;
    const uploadedPaths: Array<{ bucket: "videos" | "thumbnails"; path: string }> = [];
    let thumbnailPath: string | null = null;
    try {
      setUploadStage("Uploading video…");
      const videoUpload = await supabase.storage.from("videos").upload(videoPath, videoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: videoFile.type,
      });
      if (videoUpload.error) throw videoUpload.error;
      uploadedPaths.push({ bucket: "videos", path: videoPath });

      if (thumbnailFile) {
        setUploadStage("Uploading thumbnail…");
        thumbnailPath = `${user.id}/thumbnails/${crypto.randomUUID()}-${thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const thumbnailUpload = await supabase.storage
          .from("thumbnails")
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: thumbnailFile.type,
          });
        if (thumbnailUpload.error) throw thumbnailUpload.error;
        uploadedPaths.push({ bucket: "thumbnails", path: thumbnailPath });
      }
      setUploadStage("Saving video details…");

      const { data: videoPublic } = supabase.storage.from("videos").getPublicUrl(videoPath);
      const thumbnailPublic = thumbnailPath
        ? supabase.storage.from("thumbnails").getPublicUrl(thumbnailPath).data.publicUrl
        : null;
      const duration = await getVideoDuration(videoFile);
      const inserted = await supabase
        .from("videos")
        .insert({
          artist_id: artistQuery.data.id,
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          genre: genre || null,
          video_url: videoPublic.publicUrl,
          storage_path: videoPath,
          thumbnail_url: thumbnailPublic,
          duration,
          release_date: new Date().toISOString().slice(0, 10),
          is_public: true,
        })
        .select("id")
        .single();
      if (inserted.error) throw inserted.error;
      setUploadStage("Published");
      await queryClient.invalidateQueries({ queryKey: ["artist-dashboard", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success("Video uploaded successfully!");
      setTitle("");
      setDescription("");
      setGenre("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
    } catch (error) {
      const cleanupResults = await Promise.all(
        uploadedPaths.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])),
      );
      const cleanupFailed = cleanupResults.some((result) => result.error);
      setUploadStage(null);
      toast.error(
        `${error instanceof Error ? error.message : "Upload failed. Nothing was published."}${cleanupFailed ? " Some uploaded files may need manual cleanup." : ""}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Upload Video</h1>
        <p className="text-sm text-muted-foreground mt-1">Share your music with the world</p>

        <form onSubmit={handleUpload} className="mt-6 space-y-5">
          {/* Video File Upload */}
          <div>
            <Label className="text-sm font-medium">Video File</Label>
            <div
              onClick={() => videoInputRef.current?.click()}
              className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
                videoFile
                  ? "border-neon-purple bg-neon-purple/5"
                  : "border-glass-border bg-glass hover:bg-glass/80"
              }`}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              {videoFile ? (
                <div className="text-center">
                  <Film className="mx-auto h-8 w-8 text-neon-purple" />
                  <p className="mt-2 text-sm font-medium text-foreground">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                    }}
                    className="mt-2 text-xs text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">Click to upload video</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to 500MB</p>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <Label className="text-sm font-medium">Thumbnail</Label>
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
                thumbnailPreview
                  ? "border-neon-purple bg-neon-purple/5"
                  : "border-glass-border bg-glass hover:bg-glass/80"
              }`}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              {thumbnailPreview ? (
                <div className="text-center">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="mx-auto h-24 w-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                    className="mt-2 text-xs text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Image className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-sm text-muted-foreground">Click to add thumbnail</p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-glass border-glass-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell viewers about your video"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-glass border-glass-border min-h-[100px]"
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label>Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-glass border-glass-border">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {genres.map((g) => (
                  <SelectItem key={g} value={g.toLowerCase()}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-glass">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-neon-purple" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadStage ?? "Working…"}
              </p>
            </div>
          )}
          {artistQuery.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Your artist profile could not be loaded. Try again before uploading.
            </p>
          )}

          {/* Submit */}
          {!artistQuery.isLoading && !artistQuery.data && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              You need an artist profile before you can publish a video.
            </p>
          )}
          <Button
            type="submit"
            disabled={isUploading}
            className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-semibold h-11"
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </form>
      </div>
    </div>
  );
}

async function getVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const element = document.createElement("video");
    const url = URL.createObjectURL(file);
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? Math.round(element.duration) : null;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    element.src = url;
  });
}
