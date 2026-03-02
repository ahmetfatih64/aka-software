import { defineMiddleware } from 'astro:middleware';

// In-Memory Rate Limiting Store
// Note: This resets on server restarts and may not share state across serverless instances.
// For production scale, replace this with Upstash Redis or a similar persistent store.
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

function getClientIp(request: Request): string {
    // Attempt to get IP from common headers, fallback to a mock IP for local dev if missing
    return request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record) {
        // First request
        rateLimitStore.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (now > record.expiresAt) {
        // Window expired, reset
        rateLimitStore.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= MAX_REQUESTS) {
        // Rate limit exceeded
        return false;
    }

    // Increment count
    record.count++;
    return true;
}

export const onRequest = defineMiddleware(async (context, next) => {

    // 1. Rate Limiting Check (Only apply to API routes to protect endpoints)
    if (context.url.pathname.startsWith('/api/')) {
        const ip = getClientIp(context.request);
        const isAllowed = checkRateLimit(ip);

        if (!isAllowed) {
            return new Response(JSON.stringify({
                error: 'Çok fazla istek gönderdiniz. Lütfen bir dakika sonra tekrar deneyin.'
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60'
                }
            });
        }
    }

    // 2. Process Request
    const response = await next();

    // 3. Apply Security Headers to HTML responses
    if (response.headers.get('content-type')?.includes('text/html')) {
        const headers = new Headers(response.headers);

        // Strict-Transport-Security (HSTS) - Force HTTPS
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // X-Content-Type-Options - Prevent MIME-type sniffing
        headers.set('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options - Prevent Clickjacking
        headers.set('X-Frame-Options', 'DENY');

        // Referrer-Policy - Control info sent in Referer header
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content-Security-Policy (Basic example)
        // Note: Needs to be tailored further for Decap CMS or other external scripts.
        // We use a relatively relaxed one here to ensure local dev tools work.
        headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://identity.netlify.com; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:*");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }

    return response;
});
