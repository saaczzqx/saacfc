"use client";

import { formatBRL } from "@/lib/money";
import {
  CATEGORY_LABELS,
  type BuildPart,
  type PaymentMethod,
} from "@/lib/types";

export function BuildSummary({
  parts,
  paymentPreference,
  onRemove,
  onClear,
}: {
  parts: BuildPart[];
  paymentPreference: PaymentMethod;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const selected = parts.filter((p) => p.selectedOffer);
  const total = selected.reduce((sum, part) => {
    const offer = part.selectedOffer!;
    const preferred = offer.paymentOptions.find(
      (o) => o.method === paymentPreference,
    );
    return sum + (preferred?.amount ?? offer.bestPrice);
  }, 0);

  const coupons = selected
    .map((p) => p.selectedOffer?.coupon?.code)
    .filter(Boolean) as string[];

  return (
    <aside className="rounded-3xl border border-[var(--line)] bg-white/75 p-5 shadow-[var(--shadow)] backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
            Sua montagem
          </p>
          <h2
            data-testid="build-count"
            className="mt-1 font-[family-name:var(--font-display)] text-2xl"
            style={{ fontWeight: 700 }}
          >
            {selected.length} peça{selected.length === 1 ? "" : "s"}
          </h2>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {selected.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Busque uma peça e toque em <strong>Usar na montagem</strong> para
          somar o melhor preço com cupom e forma de pagamento.
        </p>
      ) : (
        <ul className="space-y-3">
          {selected.map((part) => {
            const offer = part.selectedOffer!;
            const preferred = offer.paymentOptions.find(
              (o) => o.method === paymentPreference,
            );
            return (
              <li
                key={part.id}
                className="rounded-2xl border border-[var(--line)] bg-white/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {CATEGORY_LABELS[part.category]}
                    </p>
                    <p className="line-clamp-2 text-sm font-semibold">
                      {offer.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {offer.storeName}
                      {offer.coupon ? ` · cupom ${offer.coupon.code}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(part.id)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--warn)]"
                    aria-label="Remover peça"
                  >
                    remover
                  </button>
                </div>
                <p className="mt-2 text-base font-bold">
                  {formatBRL(preferred?.amount ?? offer.bestPrice)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          Total estimado
        </p>
        <p
          className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]"
          style={{ fontWeight: 800 }}
        >
          {formatBRL(total)}
        </p>
        {coupons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...new Set(coupons)].map((code) => (
              <span
                key={code}
                className="rounded-md bg-[#ffea00] px-2 py-1 text-xs font-bold text-black"
              >
                {code}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Total considera a forma de pagamento selecionada. Frete e validade de
          cupom ficam a cargo de cada loja.
        </p>
      </div>
    </aside>
  );
}
