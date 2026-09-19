import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { supabase } from "@/integrations/supabase/client";
import { getCurrentArtist } from "@/lib/moonirat-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadStorageObjectWithRecovery } from "@/lib/storage-upload";
import { videoPath as publicVideoPath } from "@/lib/video-links";

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

const videoContentTypes: Record<string, string> = {
  mp4: "video/mp4",
};

const thumbnailContentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function supportedContentType(file: File, allowed: Record<string, string>) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const inferred = allowed[extension];
  if (file.type && Object.values(allowed).includes(file.type)) return file.type;
  return inferred ?? null;
}

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const uploadIdRef = useRef<string | null>(null);
  const videoPathRef = useRef<string | null>(null);
  const thumbnailPathRef = useRef<string | null>(null);
  const artistQuery = useQuery({
    queryKey: ["artist", "current", user?.id],
    queryFn: () => getCurrentArtist(user!.id),
    enabled: Boolean(user?.id),
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!supportedContentType(file, videoContentTypes)) {
        toast.error("Use an MP4 encoded with H.264 video and AAC audio.");
        e.target.value = "";
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be 500MB or smaller.");
        e.target.value = "";
        return;
      }
      setVideoFile(file);
      uploadIdRef.current = null;
      videoPathRef.current = null;
      thumbnailPathRef.current = null;
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!supportedContentType(file, thumbnailContentTypes)) {
        toast.error("Use a JPG, PNG, WebP, or GIF thumbnail.");
        e.target.value = "";
        return;
      }
       if (file.size > 5 * 1024 * 1024) {
         toast.error("Thumbnail must be 5MB or smaller.");
         e.target.value = "";
        return;
      }
      setThumbnailFile(file);
      thumbnailPathRef.current = null;
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
    setUploadMessage(null);
    setUploadPercent(0);
    const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const uploadId = uploadIdRef.current ?? crypto.randomUUID();
    uploadIdRef.current = uploadId;
    const videoPath =
      videoPathRef.current ?? `${user.id}/videos/${uploadId}-${safeName}`;
    videoPathRef.current = videoPath;
    const uploadedPaths: Array<{ bucket: "videos" | "thumbnails"; path: string }> = [];
    let thumbnailPath = thumbnailPathRef.current;
    try {
      setUploadStage("Uploading video…");
      await uploadStorageObjectWithRecovery({
        bucket: "videos",
        path: videoPath,
        file: videoFile,
        contentType: supportedContentType(videoFile, videoContentTypes) ?? undefined,
        onProgress: (percent) => setUploadPercent(Math.round(percent * 0.9)),
      });
      uploadedPaths.push({ bucket: "videos", path: videoPath });

      if (thumbnailFile) {
        setUploadStage("Uploading thumbnail…");
        thumbnailPath =
          thumbnailPath ??
          `${user.id}/thumbnails/${uploadId}-${thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        thumbnailPathRef.current = thumbnailPath;
        await uploadStorageObjectWithRecovery({
          bucket: "thumbnails",
          path: thumbnailPath,
          file: thumbnailFile,
          contentType:
            supportedContentType(thumbnailFile, thumbnailContentTypes) ?? undefined,
          onProgress: (percent) => setUploadPercent(90 + Math.round(percent * 0.1)),
        });
        uploadedPaths.push({ bucket: "thumbnails", path: thumbnailPath });
      }
      setUploadStage("Saving video details…");
      setUploadPercent(100);

      const { data: videoPublic } = supabase.storage.from("videos").getPublicUrl(videoPath);
      const thumbnailPublic = thumbnailPath
        ? supabase.storage.from("thumbnails").getPublicUrl(thumbnailPath).data.publicUrl
        : null;
      const duration = await getVideoDuration(videoFile);
      const inserted = await supabase
        .from("videos")
        .upsert({
          upload_id: uploadId,
          artist_id: artistQuery.data.id,
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          genre: genre || null,
          video_url: videoPublic.publicUrl,
          storage_path: videoPath,
          thumbnail_url: thumbnailPublic,
          thumbnail_storage_path: thumbnailPath,
          duration,
          release_date: new Date().toISOString().slice(0, 10),
          is_public: true,
        }, { onConflict: "upload_id" })
        .select("id, public_slug")
        .single();
      if (inserted.error) throw inserted.error;
      setUploadStage("Published");
      setUploadMessage("Video uploaded successfully. Opening the published video…");
      await queryClient.invalidateQueries({ queryKey: ["artist-dashboard", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success("Video uploaded successfully!");
      setTitle("");
      setDescription("");
      setGenre("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      uploadIdRef.current = null;
      videoPathRef.current = null;
      thumbnailPathRef.current = null;
      await navigate({
        to: publicVideoPath(inserted.data),
      });
    } catch (error) {
      const cleanupResults = await Promise.all(
        uploadedPaths.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])),
      );
      const cleanupFailed = cleanupResults.some((result) => result.error);
      setUploadStage(null);
      setUploadPercent(0);
      const message = `${error instanceof Error ? error.message : "Upload failed. Nothing was published."}${cleanupFailed ? " Some uploaded files may need manual cleanup." : ""}`;
      setUploadMessage(message);
      toast.error(message);
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
                accept=".mp4,video/mp4"
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
                      if (videoInputRef.current) videoInputRef.current.value = "";
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
                  <p className="text-xs text-muted-foreground">
                    H.264/AAC MP4, up to 500MB
                  </p>
                  <p className="mt-1 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
                    Moonirat V1 preserves your uploaded resolution and quality. It does not
                    automatically create lower-quality versions.
                  </p>
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
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
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
                      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
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
                <div
                  className="h-full rounded-full bg-neon-purple transition-[width]"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadStage ?? "Working…"} {uploadPercent}%
              </p>
            </div>
          )}
          {artistQuery.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Your artist profile could not be loaded. Try again before uploading.
            </p>
          )}
          {uploadMessage && (
            <p
              className={`rounded-lg border p-3 text-sm ${
                uploadStage === "Published"
                  ? "border-neon-purple/30 bg-neon-purple/10 text-foreground"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
              role={uploadStage === "Published" ? "status" : "alert"}
            >
              {uploadMessage}
            </p>
          )}

          {/* Submit */}
          {!artistQuery.isLoading && !artistQuery.data && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p>You need an artist profile before you can publish a video.</p>
              <Link
                to="/artist-dashboard"
                className="mt-2 inline-flex font-semibold text-neon-purple hover:text-neon-purple/80"
              >
                Create your artist profile
              </Link>
            </div>
          )}
          <Button
            type="submit"
            disabled={
              isUploading ||
              artistQuery.isLoading ||
              artistQuery.isError ||
              !artistQuery.data
            }
            className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-semibold h-11"
          >
            {isUploading
              ? "Uploading..."
              : artistQuery.isLoading
                ? "Checking creator profile..."
                : "Upload Video"}
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
