import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:       { default: "FinansApp", template: "%s — FinansApp" },
  description: "Kişisel finans yönetim uygulaması",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const s = JSON.parse(localStorage.getItem('finansapp-ui') || '{}');
            if (s.state?.darkMode) document.documentElement.classList.add('dark');
          } catch (_) {}
        `}} />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
