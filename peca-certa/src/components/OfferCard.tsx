"use client";

import { formatBRL } from "@/lib/money";
import type { Offer, PaymentMethod } from "@/lib/types";
import { PAYMENT_LABELS } from "@/lib/types";

export function OfferCard({
  offer,
  rank,
  paymentPreference,
  selected,
  onSelect,
}: {
  offer: Offer;
  rank: number;
  paymentPreference: PaymentMethod;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const preferred =
    offer.paymentOptions.find((p) => p.method === paymentPreference) ||
    offer.paymentOptions.find((p) => p.isBest) ||
    offer.paymentOptions[0];

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white/70 p-4 backdrop-blur transition ${
        selected
          ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-glow)]"
          : "border-[var(--line)] hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow)]"
      }`}
    >
      {rank === 1 && (
        <div className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Melhor agora
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--fog)]/60">
          {offer.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.image}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-xs text-[var(--muted)]">sem foto</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-md bg-[var(--ink)] px-2 py-0.5 font-semibold text-white">
              {offer.storeName}
            </span>
            {offer.campaign && (
              <span className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-[var(--accent-deep)]">
                {offer.campaign}
              </span>
            )}
            {offer.discountPercent > 0 && (
              <span className="text-[var(--good)]">
                -{offer.discountPercent}%
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--ink)]">
            {offer.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {preferred
                  ? PAYMENT_LABELS[preferred.method]
                  : "Melhor preço"}
              </p>
              <p
                className="font-[family-name:var(--font-display)] text-2xl font-700 text-[var(--ink)]"
                style={{ fontWeight: 700 }}
              >
                {formatBRL(preferred?.amount ?? offer.bestPrice)}
              </p>
              {offer.listPrice && offer.listPrice > offer.bestPrice && (
                <p className="text-xs text-[var(--muted)] line-through">
                  {formatBRL(offer.listPrice)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {onSelect && (
                <button
                  type="button"
                  data-testid="use-in-build"
                  onClick={onSelect}
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)]"
                >
                  {selected ? "Na montagem" : "Usar na montagem"}
                </button>
              )}
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)]"
              >
                Abrir loja
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {offer.paymentOptions.map((option) => (
          <div
            key={`${offer.id}-${option.method}`}
            className={`rounded-xl border px-3 py-2 ${
              option.isBest
                ? "border-[var(--accent)] bg-[var(--accent)]/8"
                : "border-[var(--line)] bg-white/50"
            }`}
          >
            <p className="text-[11px] font-medium text-[var(--muted)]">
              {option.label}
              {option.isBest ? " · melhor" : ""}
            </p>
            <p className="text-sm font-semibold">{formatBRL(option.amount)}</p>
            {option.details && (
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">
                {option.details}
              </p>
            )}
            {option.couponCode && (
              <p className="mt-1 inline-flex rounded-md bg-[#ffea00] px-1.5 py-0.5 text-[11px] font-bold text-black">
                {option.couponCode}
              </p>
            )}
          </div>
        ))}
      </div>

      {offer.coupon && !offer.paymentOptions.some((p) => p.method === "coupon") && (
        <p className="mt-3 text-xs text-[var(--warn)]">
          Cupom visto na vitrine: <strong>{offer.coupon.code}</strong>
          {offer.coupon.note ? ` — ${offer.coupon.note}` : ""}
        </p>
      )}
    </article>
  );
}
