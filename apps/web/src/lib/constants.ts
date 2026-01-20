// Use relative URL by default for better self-hosting support
// The browser will call /api/v1/... which Next.js rewrites to the backend
// NEXT_PUBLIC_API_URL can still be set for direct API access if needed
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key-12345";
export const ACCESS_TOKEN_KEY = "babynest:token";
export const REFRESH_TOKEN_KEY = "babynest:refresh_token";
export const TOKEN_EXPIRY_KEY = "babynest:token_expiry";
export const LAST_ACTIVITY_KEY = "babynest:last_activity";
