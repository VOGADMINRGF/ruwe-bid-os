import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Strategisches Bid Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Nav />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
