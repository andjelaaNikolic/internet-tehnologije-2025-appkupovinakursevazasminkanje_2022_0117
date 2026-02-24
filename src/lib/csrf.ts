import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET!;
if (!CSRF_SECRET) throw new Error("CSRF_SECRET nije definisan!");

export function generateCsrfToken() {
  return crypto.createHmac("sha256", CSRF_SECRET)
               .update(Date.now().toString())
               .digest("hex");
}

export function verifyCsrfToken(token: string) {
  // prima SAMO token
  return token.length === 64;
}