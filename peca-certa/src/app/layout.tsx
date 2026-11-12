import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PeçaCerta — melhor preço de peças de PC",
  description:
    "Compare promoções em tempo real na KaBuM!, Terabyte e Zoom, com PIX, parcelamento e cupons de desconto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
