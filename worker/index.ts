import handler from "vinext/server/fetch-handler";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const response = await handler.fetch(request, env, ctx);
    // WebSocket upgrade responses must be returned untouched (101 cannot be
    // reconstructed with the standard Response constructor).
    if (response.status === 101) return response;
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), fullscreen=(self), picture-in-picture=(self)");
    headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    if (request.url.startsWith("https://")) {
      headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    if (new URL(request.url).pathname.startsWith("/api/")) {
      headers.set("Cache-Control", "private, no-store");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
