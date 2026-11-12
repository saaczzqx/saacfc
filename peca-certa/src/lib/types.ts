export type StoreId = "kabum" | "terabyte" | "zoom";

export type PaymentMethod = "pix" | "card" | "installments" | "coupon";

export type PartCategory =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooler"
  | "other";

export interface CouponInfo {
  code: string;
  label: string;
  estimatedDiscountPercent?: number;
  note?: string;
}

export interface PaymentOption {
  method: PaymentMethod;
  label: string;
  amount: number;
  details?: string;
  couponCode?: string;
  isBest?: boolean;
}

export interface Offer {
  id: string;
  store: StoreId;
  storeName: string;
  title: string;
  url: string;
  image?: string;
  available: boolean;
  seller?: string;
  listPrice?: number;
  pixPrice: number;
  cardPrice: number;
  discountPercent: number;
  installments?: {
    count: number;
    amount: number;
    total: number;
    interestFree: boolean;
  };
  coupon?: CouponInfo;
  paymentOptions: PaymentOption[];
  bestPrice: number;
  bestMethod: PaymentMethod;
  scrapedAt: string;
  campaign?: string;
}

export interface SearchResponse {
  query: string;
  paymentPreference: PaymentMethod;
  offers: Offer[];
  bestOffer: Offer | null;
  storesQueried: StoreId[];
  storesFailed: { store: StoreId; error: string }[];
  tookMs: number;
  disclaimer: string;
}

export interface BuildPart {
  id: string;
  category: PartCategory;
  query: string;
  selectedOfferId?: string;
  selectedOffer?: Offer;
}

export const CATEGORY_LABELS: Record<PartCategory, string> = {
  cpu: "Processador",
  motherboard: "Placa-mãe",
  gpu: "Placa de vídeo",
  ram: "Memória RAM",
  storage: "Armazenamento",
  psu: "Fonte",
  case: "Gabinete",
  cooler: "Cooler",
  other: "Outro",
};

export const STORE_NAMES: Record<StoreId, string> = {
  kabum: "KaBuM!",
  terabyte: "Terabyte",
  zoom: "Zoom",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX / à vista",
  card: "Cartão à vista",
  installments: "Parcelado",
  coupon: "Com cupom",
};
