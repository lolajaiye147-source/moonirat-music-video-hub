import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { Upload, Film, Image, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Moonirat" },
      { name: "description", content: "Upload your music videos to Moonirat." },
    ],
  }),
  component: UploadPage,
});

const genres = ["Pop", "Hip Hop", "Electronic", "R&B", "Rock", "Indie", "Jazz", "Country", "Latin", "Classical"];

function UploadPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);

    // In a real implementation, this would upload to Supabase Storage
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      toast.success("Video uploaded successfully!");
      setIsUploading(false);
      // Reset form
      setTitle("");
      setDescription("");
      setGenre("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }, 4000);
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
                videoFile ? "border-neon-purple bg-neon-purple/5" : "border-glass-border bg-glass hover:bg-glass/80"
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
                  <p className="text-xs text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
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
                thumbnailPreview ? "border-neon-purple bg-neon-purple/5" : "border-glass-border bg-glass hover:bg-glass/80"
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
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="mx-auto h-24 w-40 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setThumbnailFile(null); setThumbnailPreview(null); }}
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
                  <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-glass">
                <div
                  className="h-full rounded-full bg-neon-purple transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">{uploadProgress}% uploaded</p>
            </div>
          )}

          {/* Submit */}
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
