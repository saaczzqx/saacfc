import { parseBRL } from "../money";
import { buildPaymentOptions, pickBest } from "../payments";
import type { Offer } from "../types";
import { fetchHtml, sanitizeQuery } from "./fetch";

export async function searchTerabyte(query: string): Promise<Offer[]> {
  const q = sanitizeQuery(query);
  if (!q) return [];

  const url = `https://www.terabyteshop.com.br/busca?str=${encodeURIComponent(q)}`;
  const html = await fetchHtml(url);
  const now = new Date().toISOString();

  const offers: Offer[] = [];
  const seen = new Set<string>();

  const cards = html.split('<div class="product-item"').slice(1);
  for (const card of cards.slice(0, 30)) {
    const chunk = '<div class="product-item"' + card.slice(0, 4500);
    const id = chunk.match(/data-tss-product="(\d+)"/)?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const pixRaw = chunk.match(/data-tss-price="([^"]*)"/)?.[1];
    const pixPrice = pixRaw ? Number(pixRaw) : null;
    const href = chunk.match(
      /href="(\/produto\/\d+\/[^"]+)"/,
    )?.[1];
    const title =
      chunk.match(/<h2>([^<]+)<\/h2>/)?.[1]?.trim() ||
      chunk.match(/title="([^"]+)"/)?.[1]?.trim();
    const image = chunk.match(/src="(https:\/\/img\.terabyteshop\.com\.br\/[^"]+)"/)?.[1];
    const oldPriceText = chunk.match(
      /product-item__old-price[\s\S]*?<span>(R\$\s*[\d.,]+)<\/span>/,
    )?.[1];
    const listPrice = oldPriceText ? parseBRL(oldPriceText) : undefined;
    const stock = chunk.match(/data-tss-estoque="([^"]*)"/)?.[1];
    const discountChip = chunk.match(
      /product-item__chip">-?(\d+)%/,
    )?.[1];

    const installMatch = chunk.match(
      /product-item__juros">\s*<span>(\d+)x<\/span>\s*<small>\s*de\s*<\/small>\s*<span>(R\$\s*[\d.,]+)<\/span>/i,
    );
    const installmentCount = installMatch ? Number(installMatch[1]) : undefined;
    const installmentAmount = installMatch
      ? parseBRL(installMatch[2])
      : undefined;

    if (!title || !href || !pixPrice || pixPrice <= 0) continue;

    // Terabyte headline price is PIX; card reference is often installment total
    const installments =
      installmentCount && installmentAmount
        ? {
            count: installmentCount,
            amount: installmentAmount,
            total: Math.round(installmentCount * installmentAmount * 100) / 100,
            interestFree: /sem juros/i.test(chunk),
          }
        : undefined;

    const cardPrice = installments?.total || pixPrice;
    const paymentOptions = buildPaymentOptions({
      pixPrice,
      cardPrice,
      listPrice: listPrice || undefined,
      installments,
    });
    const { bestPrice, bestMethod } = pickBest(paymentOptions, "pix");

    offers.push({
      id: `terabyte-${id}`,
      store: "terabyte",
      storeName: "Terabyte",
      title: decodeHtml(title),
      url: `https://www.terabyteshop.com.br${href}`,
      image,
      available: stock !== "0",
      listPrice: listPrice && listPrice > pixPrice ? listPrice : undefined,
      pixPrice,
      cardPrice,
      discountPercent: discountChip ? Number(discountChip) : 0,
      installments,
      paymentOptions,
      bestPrice,
      bestMethod,
      scrapedAt: now,
    });
  }

  return offers;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&agrave;/g, "à")
    .replace(/&atilde;/g, "ã")
    .replace(/&ccedil;/g, "ç");
}
