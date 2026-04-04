import "./globals.css";
import { Inter } from "next/font/google";
import { Noto_Sans_Tamil } from "next/font/google";

import RootClient from "./RootClient";

export const metadata = {
  title: "QuickServe – Local Services in Tamil Nadu",
  description:
    "A unified bilingual platform connecting service seekers with verified service providers across Tamil Nadu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-inter min-h-screen w-full overflow-x-hidden">
        <RootClient>{children}</RootClient>
      </body>
    </html>
  );
}
