import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { searchOffers } from "@/lib/search";
import type { PaymentMethod, StoreId } from "@/lib/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "pix",
  "card",
  "installments",
  "coupon",
];
const STORES: StoreId[] = ["kabum", "terabyte", "zoom"];

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  const limited = rateLimit(`search:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas buscas. Aguarde um momento e tente de novo." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || "";
  const payment = (searchParams.get("payment") || "pix") as PaymentMethod;
  const storesParam = searchParams.get("stores");

  if (!PAYMENT_METHODS.includes(payment)) {
    return NextResponse.json(
      { error: "Forma de pagamento inválida." },
      { status: 400 },
    );
  }

  if (query.trim().length < 2) {
    return NextResponse.json(
      { error: "Digite ao menos 2 caracteres para buscar." },
      { status: 400 },
    );
  }

  let stores: StoreId[] | undefined;
  if (storesParam) {
    stores = storesParam
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is StoreId => STORES.includes(s as StoreId));
  }

  try {
    const result = await searchOffers({
      query,
      paymentPreference: payment,
      stores,
    });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(limited.remaining),
      },
    });
  } catch (error) {
    console.error("search failed", error);
    return NextResponse.json(
      { error: "Não foi possível buscar preços agora." },
      { status: 502 },
    );
  }
}
