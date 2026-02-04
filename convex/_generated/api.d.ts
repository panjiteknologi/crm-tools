/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crmTargets from "../crmTargets.js";
import type * as importCrmTargets from "../importCrmTargets.js";
import type * as initData from "../initData.js";
import type * as migrate from "../migrate.js";
import type * as notifications from "../notifications.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as staffTargets from "../staffTargets.js";
import type * as targets from "../targets.js";
import type * as uploads from "../uploads.js";
import type * as utils_authHelpers from "../utils/authHelpers.js";
import type * as utils_password from "../utils/password.js";
import type * as utils_rateLimiter from "../utils/rateLimiter.js";
import type * as utils_simpleHash from "../utils/simpleHash.js";
import type * as visitHistory from "../visitHistory.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crmTargets: typeof crmTargets;
  importCrmTargets: typeof importCrmTargets;
  initData: typeof initData;
  migrate: typeof migrate;
  notifications: typeof notifications;
  roles: typeof roles;
  seed: typeof seed;
  staffTargets: typeof staffTargets;
  targets: typeof targets;
  uploads: typeof uploads;
  "utils/authHelpers": typeof utils_authHelpers;
  "utils/password": typeof utils_password;
  "utils/rateLimiter": typeof utils_rateLimiter;
  "utils/simpleHash": typeof utils_simpleHash;
  visitHistory: typeof visitHistory;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
