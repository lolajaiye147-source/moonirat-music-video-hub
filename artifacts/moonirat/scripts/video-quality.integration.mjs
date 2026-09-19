import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fixtureDir = process.env.MOONIRAT_VIDEO_FIXTURE_DIR || "/tmp/moonirat-quality";

assert(baseUrl, "SUPABASE_URL is required");
assert(publishableKey, "SUPABASE_PUBLISHABLE_KEY is required");
assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is required");

const fixtureExpectations = [
  { file: "landscape-720p30.mp4", width: 1280, height: 720, fps: 30 },
  { file: "landscape-1080p24.mp4", width: 1920, height: 1080, fps: 24 },
  { file: "portrait-720x1280-30.mp4", width: 720, height: 1280, fps: 30 },
  { file: "landscape-720p60.mp4", width: 1280, height: 720, fps: 60 },
];

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
};
const admin = createClient(baseUrl, serviceRoleKey, clientOptions);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseRate(rate) {
  const [numerator, denominator] = rate.split("/").map(Number);
  return denominator ? numerator / denominator : numerator;
}

async function probe(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=size,duration,format_name:stream=codec_name,profile,codec_type,width,height,r_frame_rate,pix_fmt,sample_rate,channels",
    "-of",
    "json",
    filePath,
  ]);
  return JSON.parse(stdout);
}

function assertProbe(actual, expected, label) {
  const video = actual.streams.find((stream) => stream.codec_type === "video");
  const audio = actual.streams.find((stream) => stream.codec_type === "audio");
  assert(video, `${label}: video stream is required`);
  assert(audio, `${label}: audio stream is required`);
  assert.equal(video.codec_name, "h264", `${label}: video codec must remain H.264`);
  assert.equal(video.profile, "High", `${label}: H.264 High profile must remain intact`);
  assert.equal(video.pix_fmt, "yuv420p", `${label}: pixel format must remain yuv420p`);
  assert.equal(video.width, expected.width, `${label}: width must be preserved`);
  assert.equal(video.height, expected.height, `${label}: height must be preserved`);
  assert(Math.abs(parseRate(video.r_frame_rate) - expected.fps) < 0.01, `${label}: FPS must be preserved`);
  assert.equal(audio.codec_name, "aac", `${label}: audio codec must remain AAC`);
  assert.equal(Number(audio.sample_rate), 48_000, `${label}: audio sample rate must remain 48 kHz`);
  assert.equal(audio.channels, 1, `${label}: test audio channel count must remain intact`);
  assert(Number(actual.format.duration) >= 3.9, `${label}: duration must remain intact`);
}

async function createTestUser(label) {
  const email = `moonirat-video-quality-${label}-${randomUUID()}@example.test`;
  const password = `Moonirat-${randomUUID()}!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(created.error);
  assert(created.data.user?.id, `${label}: test user was not created`);

  const client = createClient(baseUrl, publishableKey, clientOptions);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  assert(signedIn.data.session?.access_token, `${label}: test user did not sign in`);
  return { id: created.data.user.id, client };
}

async function publicObjectEvidence(publicUrl, expectedBytes, expectedHash, downloadPath) {
  const head = await fetch(publicUrl, { method: "HEAD" });
  assert(head.ok, `Public object HEAD failed with ${head.status}`);
  assert.equal(head.headers.get("content-type")?.split(";")[0], "video/mp4");
  assert.equal(Number(head.headers.get("content-length")), expectedBytes);

  const range = await fetch(publicUrl, { headers: { Range: "bytes=0-1023" } });
  assert.equal(range.status, 206, "Public object must support byte-range delivery");
  assert.equal((await range.arrayBuffer()).byteLength, Math.min(1024, expectedBytes));
  assert.match(range.headers.get("content-range") || "", /^bytes 0-1023\/\d+$/);

  const full = await fetch(publicUrl);
  assert(full.ok, `Public object download failed with ${full.status}`);
  const downloaded = Buffer.from(await full.arrayBuffer());
  assert.equal(downloaded.byteLength, expectedBytes, "Downloaded byte length must match upload");
  assert.equal(sha256(downloaded), expectedHash, "Downloaded hash must match upload");
  await writeFile(downloadPath, downloaded);

  return {
    headStatus: head.status,
    contentType: head.headers.get("content-type"),
    contentLength: Number(head.headers.get("content-length")),
    rangeStatus: range.status,
    contentRange: range.headers.get("content-range"),
    sha256: expectedHash,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  fixtureDir,
  cases: [],
  authorization: {},
  cleanup: {},
};
const users = [];
const rows = [];
const objects = [];
let artistId = null;
const cleanupDelivery = [];

try {
  const owner = await createTestUser("owner");
  const intruder = await createTestUser("intruder");
  users.push(owner.id, intruder.id);

  const artist = await owner.client
    .from("artists")
    .insert({
      user_id: owner.id,
      name: "Moonirat Quality Certification",
      slug: `quality-cert-${randomUUID()}`,
    })
    .select("id")
    .single();
  assert.ifError(artist.error);
  artistId = artist.data.id;

  const thumbnailBytes = await readFile(path.join(fixtureDir, "thumbnail.jpg"));

  for (const expected of fixtureExpectations) {
    const bytes = await readFile(path.join(fixtureDir, expected.file));
    const originalHash = sha256(bytes);
    const uploadId = randomUUID();
    const storagePath = `${owner.id}/videos/${uploadId}-${expected.file}`;
    const thumbnailPath = `${owner.id}/thumbnails/${uploadId}.jpg`;
    objects.push({ bucket: "videos", path: storagePath });
    objects.push({ bucket: "thumbnails", path: thumbnailPath });

    const videoUpload = await owner.client.storage.from("videos").upload(storagePath, bytes, {
      contentType: "video/mp4",
      cacheControl: "3600",
      upsert: false,
    });
    assert.ifError(videoUpload.error);
    const thumbnailUpload = await owner.client.storage
      .from("thumbnails")
      .upload(thumbnailPath, thumbnailBytes, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
    assert.ifError(thumbnailUpload.error);

    const publicUrl = owner.client.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;
    const thumbnailUrl = owner.client.storage
      .from("thumbnails")
      .getPublicUrl(thumbnailPath).data.publicUrl;
    const localProbe = await probe(path.join(fixtureDir, expected.file));
    assertProbe(localProbe, expected, `${expected.file} local`);

    const inserted = await owner.client
      .from("videos")
      .insert({
        upload_id: uploadId,
        artist_id: artistId,
        user_id: owner.id,
        title: `Quality certification: ${expected.file}`,
        video_url: publicUrl,
        storage_path: storagePath,
        thumbnail_url: thumbnailUrl,
        thumbnail_storage_path: thumbnailPath,
        duration: Number(localProbe.format.duration),
        release_date: new Date().toISOString().slice(0, 10),
        is_public: true,
      })
      .select("id,upload_id,user_id,artist_id,video_url,storage_path,thumbnail_url,thumbnail_storage_path,duration,is_public")
      .single();
    assert.ifError(inserted.error);
    rows.push(inserted.data.id);
    assert.equal(inserted.data.storage_path, storagePath);
    assert.equal(inserted.data.thumbnail_storage_path, thumbnailPath);
    assert.equal(inserted.data.video_url, publicUrl);
    assert.equal(inserted.data.thumbnail_url, thumbnailUrl);

    const publicRow = await createClient(baseUrl, publishableKey, clientOptions)
      .from("videos")
      .select("id,video_url,storage_path,thumbnail_storage_path,is_public")
      .eq("id", inserted.data.id)
      .single();
    assert.ifError(publicRow.error);
    assert.equal(publicRow.data.video_url, publicUrl);
    assert.equal(publicRow.data.storage_path, storagePath);
    assert.equal(publicRow.data.thumbnail_storage_path, thumbnailPath);
    assert.equal(publicRow.data.is_public, true);

    const downloadPath = path.join(fixtureDir, `downloaded-${expected.file}`);
    const delivery = await publicObjectEvidence(
      publicUrl,
      bytes.byteLength,
      originalHash,
      downloadPath,
    );
    const downloadedProbe = await probe(downloadPath);
    assertProbe(downloadedProbe, expected, `${expected.file} downloaded`);

    report.cases.push({
      fixture: expected.file,
      expected,
      bytes: bytes.byteLength,
      durationSeconds: Number(downloadedProbe.format.duration),
      video: downloadedProbe.streams.find((stream) => stream.codec_type === "video"),
      audio: downloadedProbe.streams.find((stream) => stream.codec_type === "audio"),
      delivery,
      rowIntegrity: "PASS",
    });
  }

  const protectedCase = report.cases[0];
  const protectedPath = objects.find((object) => object.bucket === "videos")?.path;
  assert(protectedPath && protectedCase, "A protected certification object is required");
  const replacement = Buffer.from("not a valid replacement");
  const foreignStorageUpdate = await intruder.client.storage
    .from("videos")
    .update(protectedPath, replacement, { contentType: "video/mp4", upsert: true });
  assert(foreignStorageUpdate.error, "Another account must not overwrite the owner's object");

  const foreignRowUpdate = await intruder.client
    .from("videos")
    .update({ title: "Unauthorized title" })
    .eq("id", rows[0])
    .select("id");
  assert.ifError(foreignRowUpdate.error);
  assert.deepEqual(foreignRowUpdate.data, [], "Another account must not update the owner's row");

  const persisted = await owner.client
    .from("videos")
    .select("title")
    .eq("id", rows[0])
    .single();
  assert.ifError(persisted.error);
  assert.notEqual(persisted.data.title, "Unauthorized title");
  report.authorization = {
    foreignStorageOverwrite: "REJECTED",
    foreignDatabaseUpdate: "ZERO_ROWS",
    persistedOwnerDataUnchanged: "PASS",
  };

  console.log("video quality integration: PASS");
} finally {
  if (rows.length) {
    const deletedRows = await admin.from("videos").delete().in("id", rows);
    assert.ifError(deletedRows.error);
  }
  for (const { bucket, path: objectPath } of objects) {
    const removed = await admin.storage.from(bucket).remove([objectPath]);
    assert.ifError(removed.error);
  }
  if (artistId) {
    const deletedArtist = await admin.from("artists").delete().eq("id", artistId);
    assert.ifError(deletedArtist.error);
  }
  for (const userId of users) {
    const deletedUser = await admin.auth.admin.deleteUser(userId);
    assert.ifError(deletedUser.error);
  }

  if (rows.length) {
    const remainingRows = await admin.from("videos").select("id").in("id", rows);
    assert.ifError(remainingRows.error);
    assert.deepEqual(remainingRows.data, []);
  }
  for (const { bucket, path: objectPath } of objects) {
    const parts = objectPath.split("/");
    const name = parts.pop();
    const folder = parts.join("/");
    const listed = await admin.storage.from(bucket).list(folder, {
      search: name,
      limit: 10,
    });
    assert.ifError(listed.error);
    assert(
      !listed.data.some((item) => item.name === name),
      `${bucket}/${objectPath} must be absent from Storage`,
    );

    const { data: publicData } = admin.storage.from(bucket).getPublicUrl(objectPath);
    const uncachedUrl = new URL(publicData.publicUrl);
    uncachedUrl.searchParams.set("moonirat_cleanup_check", randomUUID());
    const uncachedResponse = await fetch(uncachedUrl, {
      headers: { "cache-control": "no-cache" },
    });
    assert(
      !uncachedResponse.ok,
      `${bucket}/${objectPath} must be unavailable on an uncached request`,
    );
    cleanupDelivery.push({
      bucket,
      storageListing: "ABSENT",
      uncachedPublicStatus: uncachedResponse.status,
    });
  }
  report.cleanup = {
    videoRows: "REMOVED",
    videoObjects: "REMOVED",
    thumbnailObjects: "REMOVED",
    artist: "REMOVED",
    authUsers: "REMOVED",
    verification: cleanupDelivery,
    note:
      "Previously fetched public URLs can remain in CDN caches for the upload cache-control TTL; uncached URLs return a non-success status after removal.",
  };
  await writeFile(
    path.join(fixtureDir, "live-certification-evidence.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}