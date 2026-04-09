import "./globals.css";
import MainNav from "@/components/MainNav";
import type { ReactNode } from "react";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Steuerzentrale für Ausschreibungen nach Region, Gewerk, Radius und Quelle."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <MainNav />
        <main className="page">
          <div className="shell">{children}</div>
        </main>
      </body>
    </html>
  );
}
