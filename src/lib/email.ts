import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? `Arena Deco House <${process.env.SMTP_USER}>`;

export async function sendVerificationEmail(email: string, name: string, code: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verificá tu cuenta — Arena Deco House",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">Hola, ${name} 👋</h1>
        <p style="color:#555;margin-bottom:24px;">Usá este código para verificar tu cuenta en <strong>Arena Deco House</strong>:</p>
        <div style="background:#f5f0eb;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#b08050;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">El código expira en <strong>30 minutos</strong>. Si no creaste esta cuenta, ignorá este email.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: number,
  total: number
) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Pedido #${orderNumber} confirmado — Arena Deco House`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">¡Gracias por tu compra, ${name}!</h1>
        <p style="color:#555;margin-bottom:16px;">Recibimos tu pedido <strong>#${orderNumber}</strong> por <strong>$${total.toLocaleString("es-AR")}</strong>.</p>
        <p style="color:#555;">Nos pondremos en contacto para coordinar la entrega.</p>
        <p style="color:#888;font-size:13px;margin-top:24px;">Arena Deco House</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/recuperar/${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Restablecé tu contraseña — Arena Deco House",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">Hola, ${name} 👋</h1>
        <p style="color:#555;margin-bottom:24px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Arena Deco House</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#b08050;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;">
          Restablecer contraseña
        </a>
        <p style="color:#888;font-size:13px;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignorá este email.</p>
        <p style="color:#bbb;font-size:12px;margin-top:16px;word-break:break-all;">O copiá este enlace: ${resetUrl}</p>
      </div>
    `,
  });
}
