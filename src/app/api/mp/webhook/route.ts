import { prisma } from "@/lib/prisma";
import { mpClient, Payment } from "@/lib/mp";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);

    // MP sends the payment ID either as a query param or in the JSON body
    let paymentId = url.searchParams.get("data.id");
    const type = url.searchParams.get("type");

    if (!paymentId || type !== "payment") {
      // Try reading from JSON body (newer MP webhook format)
      const body = await request.json().catch(() => null);
      if (body?.type === "payment" && body?.data?.id) {
        paymentId = String(body.data.id);
      } else {
        return Response.json({ ok: true });
      }
    }

    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) return Response.json({ ok: true });

    if (payment.status === "approved") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "APPROVED",
          status: "CONFIRMED",
          paymentRef: String(paymentId),
        },
      });
    } else if (payment.status === "rejected") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "REJECTED" },
      });
    }
  } catch (e) {
    console.error("MP webhook error:", e);
  }

  return Response.json({ ok: true });
}
