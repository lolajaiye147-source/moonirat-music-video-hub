import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function storagePathFromPublicUrl(value: string | null, bucket: string) {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(value.slice(index + marker.length));
}

export const removeVideoAsAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      videoId: z.string().uuid(),
      accessToken: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (userError || !userData.user) throw new Error("Admin authentication is required.");

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admin authorization is required.");

    const { data: video, error: videoError } = await supabaseAdmin
      .from("videos")
      .select("id, storage_path, thumbnail_url")
      .eq("id", data.videoId)
      .maybeSingle();
    if (videoError) throw videoError;
    if (!video) return { removed: false, alreadyMissing: true };

    const thumbnailPath = storagePathFromPublicUrl(video.thumbnail_url, "thumbnails");
    const client = supabaseAdmin as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => { select: (columns: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } };
        update: (row: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: Error | null }> };
      };
    };
    const { data: audit, error: auditError } = await client
      .from("moderation_actions")
      .insert({
        actor_id: userData.user.id,
        video_id: video.id,
        action: "remove_video",
        status: "started",
        video_storage_path: video.storage_path,
        thumbnail_storage_path: thumbnailPath,
      })
      .select("id")
      .single();
    if (auditError || !audit) throw auditError ?? new Error("Could not start moderation audit.");

    await supabaseAdmin.from("videos").update({ is_public: false }).eq("id", video.id);
    const removals = [];
    if (video.storage_path) removals.push(supabaseAdmin.storage.from("videos").remove([video.storage_path]));
    if (thumbnailPath) removals.push(supabaseAdmin.storage.from("thumbnails").remove([thumbnailPath]));
    const results = await Promise.all(removals);
    const storageError = results.find((result) => result.error)?.error;
    if (storageError) {
      await client.from("moderation_actions").update({ status: "failed", detail: storageError.message }).eq("id", audit.id);
      throw new Error(`Storage cleanup failed: ${storageError.message}`);
    }

    const { error: deleteError } = await supabaseAdmin.from("videos").delete().eq("id", video.id);
    if (deleteError) {
      await client.from("moderation_actions").update({ status: "failed", detail: deleteError.message }).eq("id", audit.id);
      throw deleteError;
    }
    await client
      .from("moderation_actions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", audit.id);
    return { removed: true, alreadyMissing: false };
  });