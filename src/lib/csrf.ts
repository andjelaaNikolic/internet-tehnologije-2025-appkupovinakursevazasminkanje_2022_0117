import { NextResponse } from "next/server";

export function csrf(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const csrfToken = req.headers.get("x-csrf-token");
      if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
        return NextResponse.json({ message: "CSRF zaštita: nevalidan token" }, { status: 403 });
      }
    }
    return handler(req);
  };
}
