import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
