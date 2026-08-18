// The PIN is intentionally client-side: casual gate, not security.
export const SITE_PIN = "6969"
// Weak shared secret for the /api/chat bridge — public by design (client-side).
// The real key lives server-side in the bridge (~/.hermes/env/nuno-chat-bridge.env).
export const SITE_TOKEN = "191dee32f2265378737ea2c7d0d8beee"
