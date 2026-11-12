import { parseBRL } from "../money";
import { buildPaymentOptions, pickBest } from "../payments";
import type { Offer } from "../types";
import { fetchHtml, sanitizeQuery } from "./fetch";

export async function searchZoom(query: string): Promise<Offer[]> {
  const q = sanitizeQuery(query);
  if (!q) return [];

  const url = `https://www.zoom.com.br/search?q=${encodeURIComponent(q)}`;
  const html = await fetchHtml(url);
  const now = new Date().toISOString();
  const offers: Offer[] = [];
  const seen = new Set<string>();

  const cards = html.split('data-testid="product-card"').slice(1);
  for (const card of cards.slice(0, 20)) {
    const chunk = card.slice(0, 3500);
    const href = chunk.match(/href="(\/[^"]+)"/)?.[1];
    const title =
      chunk.match(/data-testid="product-card::name"[^>]*>([^<]+)</)?.[1]?.trim() ||
      chunk.match(/alt="Imagem de ([^"]+)"/)?.[1]?.trim();
    const priceText = chunk.match(
      /data-testid="product-card::price"[^>]*>[\s\S]*?<strong>(R\$\s*[\d.,]+)<\/strong>/,
    )?.[1];
    const merchant = chunk.match(
      /BestOfferMerchant[\s\S]*?<span>Via\s+([^<]+)<\/span>/,
    )?.[1]?.trim();
    const image = chunk.match(/src="(https:\/\/i\.zst\.com\.br\/[^"]+)"/)?.[1];
    const idMatch = chunk.match(/product-card-(\d+)/);
    const price = priceText ? parseBRL(priceText) : null;

    if (!href || !title || !price || price <= 0) continue;
    const id = idMatch?.[1] || href;
    if (seen.has(id)) continue;
    seen.add(id);

    const paymentOptions = buildPaymentOptions({
      pixPrice: price,
      cardPrice: price,
    });
    const { bestPrice, bestMethod } = pickBest(paymentOptions, "pix");

    offers.push({
      id: `zoom-${id}`,
      store: "zoom",
      storeName: merchant ? `Zoom · ${merchant}` : "Zoom",
      title: decodeHtml(title),
      url: `https://www.zoom.com.br${href.replace(/&amp;/g, "&")}`,
      image,
      available: true,
      pixPrice: price,
      cardPrice: price,
      discountPercent: 0,
      paymentOptions,
      bestPrice,
      bestMethod,
      scrapedAt: now,
      campaign: merchant ? `Menor preço via ${merchant}` : undefined,
    });
  }

  return offers;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
