import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain:
        process.env.CLERK_FRONTEND_API_URL ??
        process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ??
        process.env.CLERK_JWT_ISSUER_DOMAIN ??
        process.env.CLERK_JWT_ISSUER_URL ??
        "",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
