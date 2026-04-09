import "./globals.css";
import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RUWE Bid OS",
  description: "Vertriebssteuerung neu denken"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <div className="brand">
            RUWE <span>Bid OS</span>
          </div>
          <Nav />
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
