import { buildPaymentOptions, pickBest } from "../payments";
import type { CouponInfo, Offer } from "../types";
import { extractNextData, fetchHtml, sanitizeQuery } from "./fetch";

interface KabumProduct {
  code: number;
  name: string;
  friendlyName: string;
  sellerName?: string;
  image?: string;
  available?: boolean;
  price?: number;
  priceWithDiscount?: number;
  oldPrice?: number;
  discountPercentage?: number;
  maxInstallment?: string;
  stamps?: { title?: string; name?: string } | null;
  offer?: {
    name?: string;
    price?: number;
    priceWithDiscount?: number;
    discountPercentage?: number;
    endsAt?: number;
  } | null;
  flags?: { isOffer?: boolean };
}

interface KabumNextData {
  props?: {
    pageProps?: {
      data?: string | { catalogServer?: { data?: KabumProduct[] } };
    };
  };
}

export async function searchKabum(query: string): Promise<Offer[]> {
  const q = sanitizeQuery(query);
  if (!q) return [];

  const url = `https://www.kabum.com.br/busca/${encodeURIComponent(q).replace(/%20/g, "-")}`;
  const html = await fetchHtml(url);
  const next = extractNextData<KabumNextData>(html);
  const raw = next?.props?.pageProps?.data;
  if (!raw) return [];

  const catalog =
    typeof raw === "string"
      ? (JSON.parse(raw) as { catalogServer?: { data?: KabumProduct[] } })
      : raw;

  const products = catalog.catalogServer?.data ?? [];
  const now = new Date().toISOString();

  return products
    .filter((p) => p?.name && p?.code)
    .slice(0, 24)
    .map((p) => mapKabumProduct(p, now))
    .filter((o): o is Offer => o !== null);
}

function mapKabumProduct(p: KabumProduct, scrapedAt: string): Offer | null {
  const cardPrice = Number(p.price) || 0;
  const pixPrice = Number(p.priceWithDiscount) || cardPrice;
  if (pixPrice <= 0 && cardPrice <= 0) return null;

  const listPrice = Number(p.oldPrice) || undefined;
  const installments = parseInstallments(p.maxInstallment, cardPrice || pixPrice);
  const coupon = extractCoupon(p);
  const offerCouponPrice = coupon && p.offer?.priceWithDiscount
    ? Number(p.offer.priceWithDiscount)
    : undefined;

  // Only treat coupon price as better deal when it's actually lower than PIX
  const effectiveCouponPrice =
    offerCouponPrice &&
    offerCouponPrice > 0 &&
    offerCouponPrice + 0.009 < (pixPrice || cardPrice)
      ? offerCouponPrice
      : undefined;

  const paymentOptions = buildPaymentOptions({
    pixPrice: pixPrice || cardPrice,
    cardPrice: cardPrice || pixPrice,
    listPrice,
    installments,
    coupon: effectiveCouponPrice ? coupon : undefined,
    couponPrice: effectiveCouponPrice,
  });

  const { bestPrice, bestMethod } = pickBest(paymentOptions, "pix");

  return {
    id: `kabum-${p.code}`,
    store: "kabum",
    storeName: "KaBuM!",
    title: p.name,
    url: `https://www.kabum.com.br/produto/${p.code}/${p.friendlyName}`,
    image: p.image,
    available: p.available !== false,
    seller: p.sellerName,
    listPrice: listPrice && listPrice > pixPrice ? listPrice : undefined,
    pixPrice: pixPrice || cardPrice,
    cardPrice: cardPrice || pixPrice,
    discountPercent: Number(p.discountPercentage) || 0,
    installments,
    coupon: coupon || undefined,
    paymentOptions,
    bestPrice,
    bestMethod,
    scrapedAt,
    campaign: p.offer?.name || (p.stamps?.title && !coupon ? p.stamps.title : undefined),
  };
}

function extractCoupon(p: KabumProduct): CouponInfo | undefined {
  const stampTitle = p.stamps?.title || p.stamps?.name;
  if (!stampTitle) return undefined;

  // Only treat explicit coupon stamps as redeemable codes
  const match = stampTitle.match(/CUPOM\s+([A-Z0-9][A-Z0-9_-]*)/i);
  if (!match?.[1]) return undefined;

  const code = match[1].toUpperCase();
  const offerDiscount = p.offer?.discountPercentage;
  return {
    code,
    label: stampTitle,
    estimatedDiscountPercent: offerDiscount || undefined,
    note: p.offer?.priceWithDiscount
      ? `Campanha ${p.offer.name || "ativa"} — confirme o cupom no checkout`
      : "Confirme o cupom e o desconto no checkout da KaBuM!",
  };
}

function parseInstallments(
  text: string | undefined,
  fallbackTotal: number,
): Offer["installments"] | undefined {
  if (!text) return undefined;
  const match = text.match(/(\d+)\s*x\s*de\s*R\$\s*([\d.]+,\d{2})/i);
  if (!match) return undefined;

  const count = Number(match[1]);
  const amount = Number(match[2].replace(/\./g, "").replace(",", "."));
  if (!count || !amount) return undefined;

  const product = Math.round(count * amount * 100) / 100;
  // KaBuM installment labels are usually interest-free; prefer the card total
  const total = fallbackTotal > 0 ? fallbackTotal : product;

  return {
    count,
    amount,
    total,
    interestFree: true,
  };
}
