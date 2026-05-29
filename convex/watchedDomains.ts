import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

async function findExistingWatchedDomain(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: string,
  domain: string,
) {
  const items = await ctx.db.query("watchedDomains").collect();

  return (
    items.find((item: { userId: string; domain: string }) => item.userId === userId && item.domain === domain) ??
    null
  );
}

export const listWatchedDomains = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    return await ctx.db
      .query("watchedDomains")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addWatchedDomain = mutationGeneric({
  args: {
    domain: v.string(),
    score: v.optional(v.number()),
    availabilityStatus: v.optional(v.string()),
    resaleStatus: v.optional(v.string()),
    estimatedValueUsd: v.optional(v.number()),
    registrar: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    lastCheckedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const normalizedDomain = args.domain.trim().toLowerCase();

    const existing = await findExistingWatchedDomain(ctx, userId, normalizedDomain);

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        availabilityStatus: args.availabilityStatus,
        resaleStatus: args.resaleStatus,
        estimatedValueUsd: args.estimatedValueUsd,
        registrar: args.registrar,
        expiresAt: args.expiresAt,
        lastCheckedAt: args.lastCheckedAt ?? new Date().toISOString(),
        updatedAt: now,
      });

      return { inserted: false, id: existing._id };
    }

    const id = await ctx.db.insert("watchedDomains", {
      userId,
      domain: normalizedDomain,
      score: args.score,
      availabilityStatus: args.availabilityStatus,
      resaleStatus: args.resaleStatus,
      estimatedValueUsd: args.estimatedValueUsd,
      registrar: args.registrar,
      expiresAt: args.expiresAt,
      lastCheckedAt: args.lastCheckedAt ?? new Date().toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    return { inserted: true, id };
  },
});

export const removeWatchedDomain = mutationGeneric({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const normalizedDomain = args.domain.trim().toLowerCase();

    const existing = await findExistingWatchedDomain(ctx, userId, normalizedDomain);

    if (!existing) {
      return { removed: false };
    }

    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});

export const updateWatchedDomain = mutationGeneric({
  args: {
    domain: v.string(),
    score: v.optional(v.number()),
    availabilityStatus: v.optional(v.string()),
    resaleStatus: v.optional(v.string()),
    estimatedValueUsd: v.optional(v.number()),
    registrar: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    lastCheckedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const normalizedDomain = args.domain.trim().toLowerCase();

    const existing = await findExistingWatchedDomain(ctx, userId, normalizedDomain);

    if (!existing) {
      return { updated: false };
    }

    await ctx.db.patch(existing._id, {
      score: args.score,
      availabilityStatus: args.availabilityStatus,
      resaleStatus: args.resaleStatus,
      estimatedValueUsd: args.estimatedValueUsd,
      registrar: args.registrar,
      expiresAt: args.expiresAt,
      lastCheckedAt: args.lastCheckedAt,
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});
