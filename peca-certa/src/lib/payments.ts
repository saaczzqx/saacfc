import { roundMoney } from "./money";
import type { CouponInfo, Offer, PaymentMethod, PaymentOption } from "./types";

export function buildPaymentOptions(input: {
  pixPrice: number;
  cardPrice: number;
  listPrice?: number;
  installments?: Offer["installments"];
  coupon?: CouponInfo;
  couponPrice?: number;
}): PaymentOption[] {
  const options: PaymentOption[] = [];

  if (input.pixPrice > 0) {
    options.push({
      method: "pix",
      label: "PIX / à vista",
      amount: roundMoney(input.pixPrice),
      details:
        input.listPrice && input.listPrice > input.pixPrice
          ? `${Math.round(((input.listPrice - input.pixPrice) / input.listPrice) * 100)}% vs. preço de tabela`
          : "Preço à vista na loja",
    });
  }

  if (input.cardPrice > 0) {
    options.push({
      method: "card",
      label: "Cartão à vista",
      amount: roundMoney(input.cardPrice),
      details:
        input.cardPrice > input.pixPrice
          ? `+${formatDiff(input.cardPrice - input.pixPrice)} vs. PIX`
          : "Mesmo valor do PIX",
    });
  }

  if (input.installments && input.installments.count > 1) {
    options.push({
      method: "installments",
      label: `${input.installments.count}x no cartão`,
      amount: roundMoney(input.installments.total),
      details: `${input.installments.count}x de ${money(input.installments.amount)}${
        input.installments.interestFree ? " sem juros" : " com juros"
      }`,
    });
  }

  if (input.coupon && input.couponPrice && input.couponPrice > 0) {
    options.push({
      method: "coupon",
      label: `Cupom ${input.coupon.code}`,
      amount: roundMoney(input.couponPrice),
      couponCode: input.coupon.code,
      details: input.coupon.note || "Aplicar o cupom no checkout",
    });
  }

  const best = Math.min(...options.map((o) => o.amount));
  return options.map((o) => ({ ...o, isBest: o.amount === best }));
}

export function pickBest(
  options: PaymentOption[],
  preference: PaymentMethod = "pix",
): { bestPrice: number; bestMethod: PaymentMethod } {
  if (options.length === 0) {
    return { bestPrice: 0, bestMethod: preference };
  }

  const preferred = options.find((o) => o.method === preference);
  if (preferred) {
    return { bestPrice: preferred.amount, bestMethod: preferred.method };
  }

  const best = options.reduce((a, b) => (a.amount <= b.amount ? a : b));
  return { bestPrice: best.amount, bestMethod: best.method };
}

function money(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDiff(value: number): string {
  return money(value);
}
