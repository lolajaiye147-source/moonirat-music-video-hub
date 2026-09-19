import { supabase } from "@/integrations/supabase/client";
import { getPublicSupabaseConfig } from "@/integrations/supabase/config";

type UploadBucket = "videos" | "thumbnails";

type UploadOptions = {
  bucket: UploadBucket;
  path: string;
  file: File;
  contentType?: string;
  onProgress?: (percent: number) => void;
  maxAttempts?: number;
};

function splitPath(path: string) {
  const parts = path.split("/");
  const name = parts.pop();
  if (!name) throw new Error("Upload path is invalid.");
  return { folder: parts.join("/"), name };
}

async function objectMatches(bucket: UploadBucket, path: string, file: File) {
  const { folder, name } = splitPath(path);
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: name, limit: 10 });
  if (error) return false;
  const object = data.find((item) => item.name === name);
  return Number(object?.metadata?.size) === file.size;
}

function storageErrorMessage(status: number, responseText: string) {
  let providerMessage = "";
  try {
    const body = JSON.parse(responseText) as { message?: unknown; error?: unknown };
    if (typeof body.message === "string") providerMessage = body.message;
    else if (typeof body.error === "string") providerMessage = body.error;
  } catch {
    providerMessage = responseText.trim();
  }
  if (status === 401) return "Your session expired. Sign in and retry the upload.";
  if (status === 413) return "The selected file is larger than the upload limit.";
  return providerMessage
    ? `Storage rejected the upload (${status}): ${providerMessage}`
    : `Storage rejected the upload (${status}).`;
}

async function sendUpload(options: UploadOptions, token: string) {
  const { url, publishableKey } = getPublicSupabaseConfig();

  return new Promise<{ status: number; responseText: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `${url}/storage/v1/object/${options.bucket}/${options.path.split("/").map(encodeURIComponent).join("/")}`,
    );
    request.setRequestHeader("apikey", publishableKey);
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.setRequestHeader(
      "Content-Type",
      options.contentType || options.file.type || "application/octet-stream",
    );
    request.setRequestHeader("cache-control", "3600");
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onerror = () => reject(new Error("The network interrupted the upload."));
    request.onabort = () => reject(new Error("The upload was cancelled."));
    request.onload = () =>
      resolve({ status: request.status, responseText: request.responseText });
    request.send(options.file);
  });
}

async function uploadAttempt(options: UploadOptions) {
  const sessionResult = await supabase.auth.getSession();
  let token = sessionResult.data.session?.access_token;
  if (!token) {
    const refreshed = await supabase.auth.refreshSession();
    token = refreshed.data.session?.access_token;
  }
  if (!token) throw new Error("Your session expired. Sign in and retry the upload.");

  let result = await sendUpload(options, token);
  if (result.status === 401) {
    const refreshed = await supabase.auth.refreshSession();
    const refreshedToken = refreshed.data.session?.access_token;
    if (refreshedToken) result = await sendUpload(options, refreshedToken);
  }
  if (result.status < 200 || result.status >= 300) {
    throw new Error(storageErrorMessage(result.status, result.responseText));
  }
}

export async function uploadStorageObjectWithRecovery(options: UploadOptions) {
  const attempts = options.maxAttempts ?? 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await objectMatches(options.bucket, options.path, options.file)) {
      options.onProgress?.(100);
      return;
    }
    try {
      await uploadAttempt(options);
      options.onProgress?.(100);
      return;
    } catch (error) {
      lastError = error;
      if (await objectMatches(options.bucket, options.path, options.file)) {
        options.onProgress?.(100);
        return;
      }
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload failed after retrying.");
}