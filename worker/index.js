import { createBarstile } from 'barstile/server';

let barstileInstance = null;

function getBarstile(env) {
  if (!barstileInstance) {
    barstileInstance = createBarstile({
      difficulty: 3,
      ttlMs: 60000,
      secret: env?.BARSTILE_SECRET || 'barstile_fixed_secret_portfolio_v1'
    });
  }
  return barstileInstance;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Barstile-Solution, X-Barstile-Clearance, X-Barstile-Telemetry',
  'Access-Control-Expose-Headers': 'X-Barstile-Challenge, X-Barstile-Clearance'
};

export default {
  async fetch(request, env) {
    // 1. Handle browser preflight checks
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const barstile = getBarstile(env);

      // 2. Barstile Proof-of-Work Gate
      const solution = request.headers.get('x-barstile-solution');

      if (!solution) {
        // Challenge the client with HTTP 449 Retry With Barstile
        const challenge = barstile.issueChallenge();
        return new Response(
          JSON.stringify({ success: false, error: 'Verification required', challenge }),
          {
            status: 449,
            statusText: 'Retry With Barstile',
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
              'X-Barstile-Challenge': challenge
            }
          }
        );
      }

      // Verify the solution using your actual Barstile library
      const verification = barstile.verify(solution);
      if (!verification.valid) {
        return new Response(
          JSON.stringify({ success: false, error: `Verification failed: ${verification.reason}` }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Extract parameters (supports both GET and POST)
      const url = new URL(request.url);
      let sender = url.searchParams.get('sender') || '';
      let message = url.searchParams.get('message') || '';
      const timestamp = url.searchParams.get('timestamp') || new Date().toISOString();

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          if (body.sender) sender = body.sender;
          if (body.message) message = body.message;
        } catch {
          // ignore JSON errors if sent via query params
        }
      }

      if (!sender) sender = 'Anonymous User';

      if (!message.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing message parameter' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // 4. Verify environment variables (supports both TELEGRAM_ prefix and short names)
      const botToken = env.TELEGRAM_BOT_TOKEN || env.BOT_TOKEN;
      const chatId = env.TELEGRAM_CHAT_ID || env.CHAT_ID;

      if (!botToken || !chatId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing Telegram env variables on Cloudflare',
            foundEnvKeys: Object.keys(env)
          }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // 5. Send message to Telegram Bot
      let replyLinks = '';
      if (sender.includes('@')) {
        const cleanSender = sender.trim();
        const encodedTo = encodeURIComponent(cleanSender);
        const encodedSub = encodeURIComponent('Re: Portfolio Inquiry');
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSub}`;
        replyLinks = `\n\n✉️ <b>Reply:</b> <a href="${gmailUrl}">Open in Gmail</a> | <a href="mailto:${cleanSender}?subject=Re:%20Portfolio%20Inquiry">Mail App</a>`;
      }

      const text = `💬 <b>New Portfolio Message!</b>\n\n<b>From:</b> <code>${sender}</code>\n<b>Message:</b>\n"${message}"${replyLinks}\n\n<i>${timestamp}</i>`;
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const telegramPayload = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      };

      const telegramRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramPayload)
      });

      const telegramData = await telegramRes.json();

      if (!telegramData.ok) {
        return new Response(
          JSON.stringify({ success: false, telegramError: telegramData.description }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Sent to Telegram!', verified: true }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  }
};

