import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSessionUser() {
  let reqHeaders: Headers;
  try {
    reqHeaders = await headers();
  } catch {
    reqHeaders = new Headers();
  }

  try {
    const session = await auth.api.getSession({ headers: reqHeaders });
    return session?.user ?? null;
  } catch {
    return null;
  }
}
