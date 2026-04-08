import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Vertriebssteuerung neu denken",
};

const nav = [
  { name: "Dashboard", path: "/" },
  { name: "Tenders", path: "/tenders" },
  { name: "Pipeline", path: "/pipeline" },
  { name: "Agents", path: "/agents" },
  { name: "Zones", path: "/zones" },
  { name: "Buyers", path: "/buyers" },
  { name: "References", path: "/references" },
  { name: "Config", path: "/config" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <nav className="bg-black text-white px-6 py-4 flex gap-6 items-center">
          <span className="font-bold text-lg">
            RUWE <span className="text-orange-500">Bid OS</span>
          </span>
          <div className="flex gap-4 text-sm">
            {nav.map((n) => (
              <Link key={n.name} href={n.path} className="hover:text-orange-500">
                {n.name}
              </Link>
            ))}
          </div>
        </nav>
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
