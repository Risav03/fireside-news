import type { Metadata } from "next";
import { Barlow_Condensed, Bebas_Neue, JetBrains_Mono, Roboto_Serif } from "next/font/google";
import "./globals.css";

const fontDisplay = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const fontSans = Barlow_Condensed({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
});
const fontSerif = Roboto_Serif({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});
const fontMono = JetBrains_Mono({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fireside News Radio",
  description: "A simulated live AI news radio channel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} min-h-full bg-[var(--bg)] text-[var(--ink)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
