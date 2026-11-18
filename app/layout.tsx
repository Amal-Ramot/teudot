import type { Metadata, Viewport } from "next";
import "@fontsource/rubik/400.css";
import "@fontsource/rubik/500.css";
import "@fontsource/rubik/600.css";
import "@fontsource/rubik/700.css";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/700.css";
import "@fontsource/assistant/400.css";
import "@fontsource/assistant/700.css";
import "@fontsource/alef/400.css";
import "@fontsource/alef/700.css";
import "@fontsource/frank-ruhl-libre/400.css";
import "@fontsource/frank-ruhl-libre/700.css";
import "@fontsource/david-libre/400.css";
import "@fontsource/david-libre/700.css";
import "@fontsource/secular-one/400.css";
import "@fontsource/suez-one/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "מחולל תעודות",
  description: "הפקת תעודות סיום מקובץ אקסל – התאמת עמודות, עריכת מיקומים וייצוא ל־PDF",
};

export const viewport: Viewport = { themeColor: "#2545eb" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="mesh min-h-screen font-sans">{children}</body>
    </html>
  );
}
