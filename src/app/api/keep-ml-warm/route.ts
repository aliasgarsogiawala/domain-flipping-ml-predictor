import { NextResponse } from "next/server";

function getAuthToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const mlUrl = process.env.DOMAIN_ML_URL;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (!mlUrl) {
    return NextResponse.json(
      { error: "DOMAIN_ML_URL is not configured." },
      { status: 500 },
    );
  }

  if (getAuthToken(request) !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${mlUrl.replace(/\/$/, "")}/health`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await response
      .json()
      .catch(() => ({ status: response.ok ? "ok" : "unknown" }));

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      warmedAt: new Date().toISOString(),
      ml: payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Warmup failed",
        warmedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
