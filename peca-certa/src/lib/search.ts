import type { Offer, PaymentMethod, SearchResponse, StoreId } from "./types";
import { sanitizeQuery } from "./stores/fetch";
import { searchKabum } from "./stores/kabum";
import { searchTerabyte } from "./stores/terabyte";
import { searchZoom } from "./stores/zoom";

const STORE_SEARCHERS: Record<
  StoreId,
  (query: string) => Promise<Offer[]>
> = {
  kabum: searchKabum,
  terabyte: searchTerabyte,
  zoom: searchZoom,
};

export async function searchOffers(input: {
  query: string;
  paymentPreference?: PaymentMethod;
  stores?: StoreId[];
}): Promise<SearchResponse> {
  const started = Date.now();
  const query = sanitizeQuery(input.query);
  const paymentPreference = input.paymentPreference || "pix";
  const stores = input.stores?.length
    ? input.stores
    : (["kabum", "terabyte", "zoom"] as StoreId[]);

  if (!query || query.length < 2) {
    return {
      query,
      paymentPreference,
      offers: [],
      bestOffer: null,
      storesQueried: stores,
      storesFailed: [],
      tookMs: Date.now() - started,
      disclaimer: DISCLAIMER,
    };
  }

  const results = await Promise.allSettled(
    stores.map(async (store) => ({
      store,
      offers: await STORE_SEARCHERS[store](query),
    })),
  );

  const offers: Offer[] = [];
  const storesFailed: SearchResponse["storesFailed"] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      offers.push(...result.value.offers);
    } else {
      const store = stores[results.indexOf(result)]!;
      storesFailed.push({
        store,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Falha ao consultar a loja",
      });
    }
  }

  const ranked = rankOffers(offers, paymentPreference);
  const bestOffer = ranked[0] || null;

  return {
    query,
    paymentPreference,
    offers: ranked,
    bestOffer,
    storesQueried: stores,
    storesFailed,
    tookMs: Date.now() - started,
    disclaimer: DISCLAIMER,
  };
}

export function rankOffers(
  offers: Offer[],
  paymentPreference: PaymentMethod,
): Offer[] {
  return [...offers]
    .filter((o) => o.available && o.bestPrice > 0)
    .map((o) => {
      const preferred = o.paymentOptions.find(
        (p) => p.method === paymentPreference,
      );
      const amount = preferred?.amount ?? o.bestPrice;
      return { offer: o, amount };
    })
    .sort((a, b) => a.amount - b.amount)
    .map(({ offer }) => offer);
}

const DISCLAIMER =
  "Preços, cupons e condições de pagamento mudam em tempo real nas lojas. Confirme o valor final, frete e validade do cupom no checkout antes de comprar.";
