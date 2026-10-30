import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OctoTV — أفلام وقنوات مباشرة",
  description: "منصة بث حديثة للمحتوى المرخّص والقنوات العامة المباشرة.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
