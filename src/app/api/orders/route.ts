import { NextRequest, NextResponse } from "next/server";
import { queryOne, withTransaction } from "@/lib/db";
import { getCompany } from "@/lib/auth";
import { notifyStoreNewOrder } from "@/lib/push";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Public — places a real order for the "Add to Cart" purchase path
// (as opposed to /api/quote-requests, which is the no-payment lead
// capture path for quote-only items). Single-company mode: no slug,
// resolves the one store via getCompany().
const OrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(5),
  deliveryAddress: z.string().min(1),
  deliveryCity: z.string().optional().default(""),
  deliveryState: z.string().optional().default(""),
  deliveryNote: z.string().optional(),
  paymentMethod: z.enum(["paystack", "transfer"]),
  totalAmount: z.number().min(0),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, {
    key: "rl:orders",
    max: 10,
    window: 600,
    message: "Too many requests. Please wait a few minutes before trying again.",
  });
  if (limited) return limited;

  try {
    const company = await getCompany();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = OrderSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstField = Object.values(flat.fieldErrors)[0]?.[0];
      const firstForm = flat.formErrors[0];
      const message = firstField ?? firstForm ?? "Invalid request data";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const d = parsed.data;

    // Validate products: must exist, be active, purchasable, and in stock
    for (const item of d.items) {
      const product = await queryOne<{ id: string; stock_quantity: number; is_purchasable: boolean }>(
        "SELECT id, stock_quantity, is_purchasable FROM products WHERE id = $1 AND store_id = $2 AND is_active = true",
        [item.productId, company.id]
      );
      if (!product) {
        return NextResponse.json({ error: "Product not available" }, { status: 400 });
      }
      if (!product.is_purchasable) {
        return NextResponse.json({ error: "This product is quote-only and can't be purchased directly" }, { status: 400 });
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
      }
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const dbPaymentMethod = d.paymentMethod === "transfer" ? "bank_transfer" : "paystack";

    const result = await withTransaction(async (client) => {
      const orderRows = await client.query(
        `INSERT INTO orders (
          store_id, order_number, customer_name, customer_email, customer_phone,
          delivery_address, delivery_city, delivery_state, delivery_note,
          subtotal, total, payment_method
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, order_number`,
        [
          company.id, orderNumber,
          d.customerName,
          d.customerEmail || null,
          d.customerPhone,
          d.deliveryAddress,
          d.deliveryCity || null,
          d.deliveryState || null,
          d.deliveryNote || null,
          d.totalAmount,
          d.totalAmount,
          dbPaymentMethod,
        ]
      );

      const order = orderRows.rows[0];

      for (const item of d.items) {
        const prod = await client.query(
          "SELECT name, image_url, images FROM products WHERE id = $1",
          [item.productId]
        );
        const p = prod.rows[0];
        const img = p.image_url || p.images?.[0] || null;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [order.id, item.productId, p.name, img, item.unitPrice, item.quantity, item.unitPrice * item.quantity]
        );

        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.productId]
        );
      }

      return order;
    });

    notifyStoreNewOrder(
      company.id,
      result.id,
      result.order_number,
      d.customerName,
      d.totalAmount
    ).catch(() => {});

    return NextResponse.json(
      { orderId: result.id, orderNumber: result.order_number },
      { status: 201 }
    );
  } catch (err) {
    console.error("[orders] POST error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
