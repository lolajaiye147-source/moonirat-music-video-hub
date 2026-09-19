import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
} from "@/lib/moonirat-data";

const feedbackType = z.enum(FEEDBACK_TYPES.map((item) => item.value) as [string, ...string[]]);
const feedbackStatus = z.enum(FEEDBACK_STATUSES.map((item) => item.value) as [string, ...string[]]);
const feedbackPriority = z.enum(FEEDBACK_PRIORITIES.map((item) => item.value) as [string, ...string[]]);

async function requireAdmin(accessToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("Admin authentication is required.");

  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) throw roleError;
  if (!role) throw new Error("Admin authorization is required.");

  return { supabaseAdmin, user: userData.user };
}

export const listFeedbackAsAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      search: z.string().max(100).optional(),
      status: feedbackStatus.optional(),
      type: feedbackType.optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin(data.accessToken);
    let query = supabaseAdmin
      .from("feedback_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.status) query = query.eq("status", data.status);
    if (data.type) query = query.eq("type", data.type);
    const search = data.search?.trim().replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ");
    if (search) query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`);

    const { data: feedback, error } = await query;
    if (error) throw error;
    return feedback;
  });

export const updateFeedbackAsAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      feedbackId: z.string().uuid(),
      status: feedbackStatus,
      priority: feedbackPriority,
      adminResponse: z.string().max(4000),
      adminNotes: z.string().max(4000),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin(data.accessToken);
    const { data: feedback, error } = await supabaseAdmin
      .from("feedback_submissions")
      .update({
        status: data.status,
        priority: data.priority,
        admin_response: data.adminResponse.trim() || null,
        admin_notes: data.adminNotes.trim() || null,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", data.feedbackId)
      .select("*")
      .single();
    if (error) throw error;
    return feedback;
  });