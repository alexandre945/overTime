import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Horas Extras",
  description: "Sistema para controle e registro de horas extras",

  manifest: "/manifest.json",

  icons: {
    icon: "/horas-extras.png",
    apple: "/horas-extras.png",
  },

  appleWebApp: {
    capable: true,
    title: "Horas Extras",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#071b35",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}