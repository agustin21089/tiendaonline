/**
 * Default HTML email templates — browser-safe, no Node.js imports.
 * Both email.ts (server) and settings-form.tsx (client) import from here.
 */

export const DEFAULT_ORDER_TEMPLATE = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
  <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">¡Gracias por tu compra, {{name}}!</h1>
  <p style="color:#555;margin-bottom:16px;">Recibimos tu pedido <strong>#{{orderNumber}}</strong> por <strong>{{total}}</strong>.</p>
  <p style="color:#555;">Nos pondremos en contacto para coordinar la entrega.</p>
  <p style="color:#888;font-size:13px;margin-top:24px;">Arena Deco House</p>
</div>
`.trim();

export const DEFAULT_VERIFY_TEMPLATE = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
  <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">Hola, {{name}} 👋</h1>
  <p style="color:#555;margin-bottom:24px;">Usá este código para verificar tu cuenta en <strong>Arena Deco House</strong>:</p>
  <div style="background:#f5f0eb;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
    <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#b08050;">{{code}}</span>
  </div>
  <p style="color:#888;font-size:13px;">El código expira en <strong>30 minutos</strong>. Si no creaste esta cuenta, ignorá este email.</p>
</div>
`.trim();
