import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase-admin"; // ensures Admin SDK is initialized

export async function verifyToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return await getAuth().verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch {
    return null;
  }
}
