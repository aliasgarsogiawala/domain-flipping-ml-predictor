import { makeFunctionReference, type FunctionReference } from "convex/server";

export const listWatchedDomainsRef = makeFunctionReference<"query">(
  "watchedDomains:listWatchedDomains",
) as FunctionReference<"query">;

export const addWatchedDomainRef = makeFunctionReference<"mutation">(
  "watchedDomains:addWatchedDomain",
) as FunctionReference<"mutation">;

export const removeWatchedDomainRef = makeFunctionReference<"mutation">(
  "watchedDomains:removeWatchedDomain",
) as FunctionReference<"mutation">;

export const updateWatchedDomainRef = makeFunctionReference<"mutation">(
  "watchedDomains:updateWatchedDomain",
) as FunctionReference<"mutation">;
