import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result; // { session, user } or null
}

export async function requireAuth() {
  const result = await getSession();
  if (!result?.session) {
    throw new Error("Unauthorized");
  }
  return result;
}
