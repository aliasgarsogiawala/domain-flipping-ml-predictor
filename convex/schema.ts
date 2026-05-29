import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  watchedDomains: defineTable({
    userId: v.string(),
    domain: v.string(),
    score: v.optional(v.number()),
    availabilityStatus: v.optional(v.string()),
    resaleStatus: v.optional(v.string()),
    estimatedValueUsd: v.optional(v.number()),
    registrar: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    lastCheckedAt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_domain", ["userId", "domain"]),
});
