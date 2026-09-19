import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(baseUrl, "SUPABASE_URL is required");
assert(publishableKey, "SUPABASE_PUBLISHABLE_KEY is required");
assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is required");

const adminHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

function authHeaders(token) {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

async function createTestUser(label) {
  const email = `moonirat-watch-${label}-${randomUUID()}@example.test`;
  const password = `Moonirat-${randomUUID()}!`;
  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const user = created.body?.user ?? created.body;
  assert(created.ok && user?.id, `Could not create ${label} test user`);

  const signedIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  assert(signedIn.ok && signedIn.body?.access_token, `Could not sign in ${label} test user`);

  return {
    id: user.id,
    email,
    password,
    accessToken: signedIn.body.access_token,
  };
}

async function deleteTestUser(userId) {
  return request(`/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

async function removeStaleTestUsers() {
  const listed = await request("/auth/v1/admin/users?page=1&per_page=1000", {
    headers: adminHeaders,
  });
  assert(listed.ok, "Could not list test users for cleanup");
  const staleUsers = (listed.body?.users ?? []).filter((user) =>
    user.email?.startsWith("moonirat-watch-"),
  );
  for (const user of staleUsers) {
    const deleted = await deleteTestUser(user.id);
    assert(deleted.ok, "Could not remove stale watch-history test user");
  }
}

let userA;
let userB;
let videoId;

try {
  await removeStaleTestUsers();

  const videos = await request("/rest/v1/videos?select=id&is_public=eq.true&limit=1", {
    headers: authHeaders(publishableKey),
  });
  videoId = videos.body?.[0]?.id;
  assert(videos.ok && videoId, "A public video is required for watch-history integration testing");

  userA = await createTestUser("a");
  userB = await createTestUser("b");

  const userAHistoryPath =
    `/rest/v1/watch_history?select=id,user_id,video_id,progress_seconds,duration_seconds,` +
    `completed,last_watched_at,created_at,updated_at&user_id=eq.${userA.id}&video_id=eq.${videoId}`;

  const inserted = await request("/rest/v1/watch_history", {
    method: "POST",
    headers: { ...authHeaders(userA.accessToken), Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userA.id,
      video_id: videoId,
      progress_seconds: 17,
      duration_seconds: 100,
      completed: false,
    }),
  });
  assert.equal(inserted.status, 201, "User A should be able to create watch history");
  assert(inserted.body?.[0]?.id, "The watch-history primary key should be generated");

  const userBRead = await request(userAHistoryPath, {
    headers: authHeaders(userB.accessToken),
  });
  assert.equal(userBRead.status, 200);
  assert.deepEqual(userBRead.body, [], "User B must not be able to read User A's history");

  const userBInsert = await request("/rest/v1/watch_history", {
    method: "POST",
    headers: { ...authHeaders(userB.accessToken), Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userA.id,
      video_id: videoId,
      progress_seconds: 99,
      duration_seconds: 100,
      completed: false,
    }),
  });
  assert.equal(userBInsert.status, 403, "User B must not insert history for User A");

  const userBUpdate = await request(
    `/rest/v1/watch_history?user_id=eq.${userA.id}&video_id=eq.${videoId}`,
    {
      method: "PATCH",
      headers: { ...authHeaders(userB.accessToken), Prefer: "return=representation" },
      body: JSON.stringify({ progress_seconds: 99 }),
    },
  );
  assert.deepEqual(userBUpdate.body, [], "User B must not update User A's history");

  const userBDelete = await request(
    `/rest/v1/watch_history?user_id=eq.${userA.id}&video_id=eq.${videoId}`,
    {
      method: "DELETE",
      headers: { ...authHeaders(userB.accessToken), Prefer: "return=representation" },
    },
  );
  assert.deepEqual(userBDelete.body, [], "User B must not delete User A's history");

  const beforeUpdate = await request(userAHistoryPath, {
    headers: authHeaders(userA.accessToken),
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  const updated = await request(
    `/rest/v1/watch_history?user_id=eq.${userA.id}&video_id=eq.${videoId}`,
    {
      method: "PATCH",
      headers: { ...authHeaders(userA.accessToken), Prefer: "return=representation" },
      body: JSON.stringify({
        progress_seconds: 37,
        duration_seconds: 100,
        completed: false,
        last_watched_at: new Date().toISOString(),
      }),
    },
  );
  assert.equal(updated.body?.[0]?.progress_seconds, 37, "User A's progress should update");
  assert.notEqual(
    updated.body?.[0]?.updated_at,
    beforeUpdate.body?.[0]?.updated_at,
    "The updated_at trigger should run",
  );

  const freshSignIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: userA.email, password: userA.password }),
  });
  assert(freshSignIn.ok && freshSignIn.body?.access_token, "User A should sign in again");
  const resumed = await request(userAHistoryPath, {
    headers: authHeaders(freshSignIn.body.access_token),
  });
  assert.equal(
    resumed.body?.[0]?.progress_seconds,
    37,
    "Progress should persist for a fresh authenticated session",
  );

  console.log("watch_history integration: PASS");
} finally {
  if (userA) {
    await request(`/rest/v1/watch_history?user_id=eq.${userA.id}`, {
      method: "DELETE",
      headers: authHeaders(userA.accessToken),
    });
    await deleteTestUser(userA.id);
  }
  if (userB) await deleteTestUser(userB.id);
  await removeStaleTestUsers();
}