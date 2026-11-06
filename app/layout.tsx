import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile-tabs.css";
import { Header } from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";

export const metadata: Metadata = {
  title: "FreeTour — Travel Like a Local",
  description: "Discover local guides and create travel experiences around the world.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FreeTour" }
};
export const viewport: Viewport = { themeColor: "#102b4e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
        <footer className="footer">© {new Date().getFullYear()} FreeTour · Travel Like a Local.</footer>
        <BottomTabs />
      </body>
    </html>
  );
}
