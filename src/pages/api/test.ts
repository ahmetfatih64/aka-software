import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
    return new Response(JSON.stringify({
        message: "Rate limit test API'sine hoşgeldiniz!",
        status: "success"
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
