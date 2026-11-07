export function GET() {
  return Response.json(
    { key: process.env.VAPID_PUBLIC_KEY || "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
