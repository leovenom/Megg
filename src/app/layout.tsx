import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Megg",
  description: "Megg — meu ovo no ponto perfeito. Timer de ovo cozido por peso, temperatura e ponto da gema.",
};

export const viewport: Viewport = {
  themeColor: "#F6F1EA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
