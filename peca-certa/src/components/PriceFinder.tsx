"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { OfferCard } from "@/components/OfferCard";
import { BuildSummary } from "@/components/BuildSummary";
import {
  CATEGORY_LABELS,
  type BuildPart,
  type PartCategory,
  type PaymentMethod,
  type SearchResponse,
} from "@/lib/types";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "pix", label: "PIX", hint: "à vista, geralmente o menor" },
  { id: "coupon", label: "Cupom", hint: "quando a loja exibe código" },
  { id: "card", label: "Cartão 1x", hint: "referência no cartão" },
  { id: "installments", label: "Parcelado", hint: "total no cartão" },
];

const QUICK_SEARCHES: { category: PartCategory; query: string }[] = [
  { category: "cpu", query: "Ryzen 5 5600" },
  { category: "gpu", query: "RTX 4060" },
  { category: "ram", query: "memoria ddr4 16gb 3200" },
  { category: "storage", query: "ssd nvme 1tb" },
  { category: "psu", query: "fonte 650w 80 plus" },
  { category: "motherboard", query: "placa mae b550" },
];

const STORAGE_KEY = "peca-certa-build-v1";

function newPart(category: PartCategory, query: string): BuildPart {
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    query,
  };
}

export function PriceFinder() {
  const [query, setQuery] = useState("Ryzen 5 5600");
  const [category, setCategory] = useState<PartCategory>("cpu");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<BuildPart[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setParts(JSON.parse(raw) as BuildPart[]);
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  }, [parts, hydrated]);

  useEffect(() => {
    // Auto first search so the app shows live data on open
    void runSearch("Ryzen 5 5600");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankedOffers = useMemo(() => {
    if (!result) return [];
    return [...result.offers].sort((a, b) => {
      const priceA =
        a.paymentOptions.find((o) => o.method === payment)?.amount ??
        a.bestPrice;
      const priceB =
        b.paymentOptions.find((o) => o.method === payment)?.amount ??
        b.bestPrice;
      return priceA - priceB;
    });
  }, [result, payment]);

  const best = rankedOffers[0];

  const storeStats = useMemo(() => {
    if (!result) return [];
    const counts = new Map<string, number>();
    for (const offer of result.offers) {
      counts.set(offer.storeName, (counts.get(offer.storeName) || 0) + 1);
    }
    return [...counts.entries()];
  }, [result]);

  async function runSearch(nextQuery = query) {
    const q = nextQuery.trim();
    if (q.length < 2) {
      setError("Digite ao menos 2 caracteres.");
      return;
    }

    setError(null);
    setHasSearched(true);
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&payment=${payment}`,
          );
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Falha na busca.");
            setResult(null);
            return;
          }
          setResult(data as SearchResponse);
        } catch {
          setError("Não foi possível conectar à busca agora.");
          setResult(null);
        }
      })();
    });
  }

  function handleSelectOffer(offerId: string) {
    if (!result) return;
    const offer = result.offers.find((o) => o.id === offerId);
    if (!offer) return;

    setParts((current) => {
      const existingIndex = current.findIndex(
        (p) => p.category === category && p.selectedOffer,
      );
      const part = newPart(category, query);
      part.selectedOfferId = offer.id;
      part.selectedOffer = offer;

      if (existingIndex >= 0) {
        const copy = [...current];
        copy[existingIndex] = part;
        return copy;
      }
      return [...current, part];
    });
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="rise mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
          comparador ao vivo · BR
        </p>
        <h1
          className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--ink)] sm:text-6xl"
          style={{ fontWeight: 800 }}
        >
          PeçaCerta
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
          Acha promoção em tempo real nas principais lojas de hardware,
          considerando <strong>PIX</strong>, <strong>cupom</strong> e{" "}
          <strong>parcelamento</strong> para montar o PC pelo menor custo real.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <form
            className="rise rise-delay-1 rounded-3xl border border-[var(--line)] bg-white/75 p-4 shadow-[var(--shadow)] backdrop-blur sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Categoria
                </span>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as PartCategory)
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none ring-[var(--accent)] focus:ring-2"
                >
                  {(Object.keys(CATEGORY_LABELS) as PartCategory[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {CATEGORY_LABELS[key]}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block sm:col-span-1">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Peça / modelo
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex.: RTX 4060, B550M, SSD 1TB..."
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none ring-[var(--accent)] focus:ring-2"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60 sm:w-auto"
                  style={{ animation: isPending ? "pulse-soft 1.2s infinite" : undefined }}
                >
                  {isPending ? "Buscando..." : "Buscar preços"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Priorizar forma de pagamento
              </p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    data-testid={`payment-${option.id}`}
                    onClick={() => setPayment(option.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      payment === option.id
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--line)] bg-white hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={`block text-[11px] ${
                        payment === option.id
                          ? "text-white/80"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((item) => (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => {
                    setCategory(item.category);
                    setQuery(item.query);
                    void runSearch(item.query);
                  }}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
                >
                  {item.query}
                </button>
              ))}
            </div>
          </form>

          {error && (
            <div className="rounded-2xl border border-[var(--warn)]/30 bg-[#fff4ee] px-4 py-3 text-sm text-[var(--warn)]">
              {error}
            </div>
          )}

          {best && (
            <div className="rise rise-delay-2 rounded-3xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                Melhor oferta agora · {PAYMENT_OPTIONS.find((p) => p.id === payment)?.label}
              </p>
              <p
                className="mt-2 font-[family-name:var(--font-display)] text-3xl"
                style={{ fontWeight: 800 }}
              >
                {best.storeName}
              </p>
              <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
                {best.title}
              </p>
              {result && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {result.offers.length} ofertas em {storeStats.length} fontes ·{" "}
                  {result.tookMs} ms
                  {result.storesFailed.length > 0 &&
                    ` · falha: ${result.storesFailed.map((s) => s.store).join(", ")}`}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {isPending && !result && (
              <>
                <div className="skeleton h-40" />
                <div className="skeleton h-40" />
              </>
            )}

            {rankedOffers.map((offer, index) => (
              <div key={offer.id} className="rise rise-delay-3">
                <OfferCard
                  offer={offer}
                  rank={index + 1}
                  paymentPreference={payment}
                  selected={parts.some((p) => p.selectedOfferId === offer.id)}
                  onSelect={() => handleSelectOffer(offer.id)}
                />
              </div>
            ))}

            {hasSearched && !isPending && result && result.offers.length === 0 && (
              <p className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-6 text-sm text-[var(--muted)]">
                Nenhuma oferta encontrada para “{result.query}”. Tente um modelo
                mais específico (ex.: incluir marca e capacidade).
              </p>
            )}
          </div>

          {result && (
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              {result.disclaimer}
            </p>
          )}
        </section>

        <div className="rise rise-delay-2 lg:sticky lg:top-6 lg:self-start">
          <BuildSummary
            parts={parts}
            paymentPreference={payment}
            onRemove={(id) =>
              setParts((current) => current.filter((p) => p.id !== id))
            }
            onClear={() => setParts([])}
          />
        </div>
      </div>
    </div>
  );
}
