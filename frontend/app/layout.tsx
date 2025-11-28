import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNS-Shatak | 社宅管理システム",
  description: "Apartment Management System for Staffing Companies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
