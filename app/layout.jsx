import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "Private Space",
  description: "A secure, private chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
