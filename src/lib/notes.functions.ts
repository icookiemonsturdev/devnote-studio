import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [dirs, folders, profile, subs, purchases] = await Promise.all([
      supabase.from("directories").select("*").order("created_at"),
      supabase.from("folders").select("*").order("created_at"),
      supabase.from("profiles").select("*").maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("skin_purchases").select("skin_id"),
    ]);

    const sub = subs.data as any;
    const isActive =
      !!sub &&
      ((["active", "trialing", "past_due"].includes(sub.status) &&
        (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
        (sub.status === "canceled" &&
          sub.current_period_end &&
          new Date(sub.current_period_end) > new Date()));

    return {
      directories: dirs.data ?? [],
      folders: folders.data ?? [],
      profile: profile.data,
      subscriptionActive: isActive,
      purchasedSkins: (purchases.data ?? []).map((p: any) => p.skin_id as string),
    };
  });

export const getNotesByFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ folderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: notes } = await context.supabase
      .from("notes")
      .select("*")
      .eq("folder_id", data.folderId)
      .order("updated_at", { ascending: false });
    return notes ?? [];
  });

export const getNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: note } = await context.supabase
      .from("notes")
      .select("*")
      .eq("id", data.id)
      .single();
    return note;
  });

export const createDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: dir, error } = await context.supabase
      .from("directories")
      .insert({ name: data.name, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return dir;
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ name: z.string().min(1).max(80), directoryId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: folder, error } = await context.supabase
      .from("folders")
      .insert({ name: data.name, directory_id: data.directoryId, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return folder;
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ folderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: note, error } = await context.supabase
      .from("notes")
      .insert({ folder_id: data.folderId, user_id: context.userId, title: "Untitled", content: "" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return note;
  });

export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      content: z.string().max(100000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("notes").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("notes").delete().eq("id", data.id);
    return { ok: true };
  });

export const deleteFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("folders").delete().eq("id", data.id);
    return { ok: true };
  });

export const deleteDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("directories").delete().eq("id", data.id);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      display_name: z.string().min(1).max(80).optional(),
      avatar_url: z.string().url().max(500).optional().or(z.literal("")),
      active_skin: z.string().min(1).max(40).optional(),
      heading_font: z.string().min(1).max(40).optional(),
      body_font: z.string().min(1).max(40).optional(),
      active_notebook_skin: z.string().min(1).max(40).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      cover_skin: z.string().min(1).max(40).optional(),
      name: z.string().min(1).max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("directories")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
