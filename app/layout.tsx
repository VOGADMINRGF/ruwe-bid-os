import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "RUWE Bid OS",
  description: "Strategisches Steuerungssystem für Ausschreibungen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="container">
              <div className="brand">RUWE <span>Bid OS</span></div>
              <div style={{ marginTop: 12 }}>
                <Nav />
              </div>
            </div>
          </header>
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
