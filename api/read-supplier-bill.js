import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./_lib/publicEnv.js";

const MODEL = "claude-sonnet-5-5";

const PROMPT = `This is a photo of a supplier's invoice to a saree shop in India. Read it and reply with JSON only, no other text:
{
  "supplier_name": string|null,
  "gstin": string|null,
  "bill_no": string|null,
  "bill_date": "YYYY-MM-DD"|null,
  "taxable_amount": number|null,
  "gst_rate": number|null,
  "hsn": string|null,
  "total": number|null,
  "items": [{"description": string, "quantity": number|null, "rate": number|null, "amount": number|null}],
  "notes": string|null
}
"total" is the final payable amount. "gst_rate" is the combined GST percentage (for example 5, not 2.5). Use null for anything you cannot read; never guess digits. Indian dates are day first.`;

async function signedIn(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  return response.ok;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "Bill reading is not set up (ANTHROPIC_API_KEY is missing)." }, { status: 503 });
  if (!(await signedIn(request))) return Response.json({ error: "Please sign in again." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { image, mediaType = "image/jpeg" } = body ?? {};
  if (!image || !/^image\/(jpeg|png|webp)$/.test(mediaType)) {
    return Response.json({ error: "Send the bill as a JPEG, PNG or WebP image." }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });
  if (!response.ok) return Response.json({ error: "The bill could not be read right now." }, { status: 502 });

  const result = await response.json();
  const text = (result.content || []).filter((part) => part.type === "text").map((part) => part.text).join("");
  const match = text.match(/\{[\s\S]*\}/);
  try {
    return Response.json({ bill: JSON.parse(match?.[0] ?? "") });
  } catch {
    return Response.json({ error: "Couldn't make sense of that photo. Try a clearer, flatter picture." }, { status: 422 });
  }
}
