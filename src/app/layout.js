import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navigation from "../components/Navigation";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import Providers from "./Providers";

export const metadata = {
    title: "NFT Marketplace - Buy & Sell Digital Art",
    description: "Discover and trade unique NFTs",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="bg-gray-50">
                <Providers>
                    {/* Header */}
                    <nav className="bg-gray-900 text-white p-4 shadow-xl">
                        <div className="container mx-auto flex justify-between items-center">
                            <Link href="/" className="flex items-center space-x-2">
                                <img src="/nft-logo.png" width={60} alt="Nft-logo" />
                                <h1 className="text-xl relative right-[15px]">NFT Marketplace</h1>
                            </Link>
                            <ConnectButton />
                        </div>
                    </nav>

                    {/* Navigation */}
                    <Navigation />

                    {/* Main Content */}
                    <main className="container mx-auto p-6 min-h-screen">{children}</main>

                    {/* Footer */}
                    <footer className=" text-black text-center py-6 mt-12">
                        <p className="text-sm">© 2025 NFT Marketplace. Built with Next.js & Alchemy</p>
                    </footer>

                    <Toaster position="top-center" />
                </Providers>
            </body>
        </html>
    );
}
