/**
 * WhatsApp admin notifications.
 *
 * Priority:
 * 1. Twilio API (if TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM are set)
 * 2. Console log (dev / unconfigured)
 *
 * The recipient is taken from:
 * - ADMIN_WHATSAPP_NUMBER env var, OR
 * - SiteSettings.adminWhatsapp (set in /admin/configuracion)
 */

export type WhatsAppMessage = {
  to: string;          // E.164 without + (e.g. "5491112345678")
  body: string;
};

async function sendViaTwilio(msg: WhatsAppMessage): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!; // e.g. "whatsapp:+14155238886"

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:+${msg.to}`,
        Body: msg.body,
      }),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error ${res.status}: ${err}`);
  }
}

export async function notifyAdminWhatsApp(
  body: string,
  recipientOverride?: string | null
): Promise<void> {
  const to = recipientOverride ?? process.env.ADMIN_WHATSAPP_NUMBER;
  if (!to) return; // no recipient configured → silent skip

  const hasTwilio =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_WHATSAPP_FROM;

  if (hasTwilio) {
    await sendViaTwilio({ to, body });
    return;
  }

  // Fallback: log the message so it's visible in server logs / Vercel dashboard
  console.info(
    `[WhatsApp Admin] Would send to +${to}:\n${body}\n` +
    `(Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to enable delivery)`
  );
}

export function buildNewOrderMessage(
  orderNumber: number,
  customerName: string,
  total: number,
  items: number,
  city: string
): string {
  const price = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(total);

  return (
    `🛒 *Nueva orden #${orderNumber}*\n` +
    `👤 ${customerName} (${city})\n` +
    `📦 ${items} producto${items !== 1 ? "s" : ""} · ${price}\n` +
    `👉 Ver orden: ${process.env.NEXTAUTH_URL ?? "https://tu-tienda.vercel.app"}/admin/ordenes`
  );
}
