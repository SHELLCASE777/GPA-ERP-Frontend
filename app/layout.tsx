import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const roboto = Roboto({
  subsets:  ["latin"],
  weight:   ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display:  "swap",
});

const robotoMono = Roboto_Mono({
  subsets:  ["latin"],
  weight:   ["400", "500", "700"],
  variable: "--font-roboto-mono",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       { default: "GPA Cost Control", template: "%s · GPA ERP" },
  description: "Construction Cost Control ERP — Multi-project expense management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body className="font-sans bg-canvas antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
