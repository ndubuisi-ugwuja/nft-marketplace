"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "../lib/wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navigation from "../components/Navigation";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function RootLayout({ children }) {
    const queryClient = new QueryClient();

    return (
        <html lang="en">
            <body className="bg-gray-50">
                <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider
                            showRecentTransactions={true}
                            theme={darkTheme({
                                accentColor: "#6B7280",
                                accentColorForeground: "white",
                                borderRadius: "medium",
                            })}
                        >
                            {/* Header */}
                            <nav className="bg-gray-900 text-white p-4 shadow-xl">
                                <div className="container mx-auto flex justify-between items-center">
                                    <Link href="/" className="flex items-center space-x-2">
                                        <img src="/nft-logo.png" width={60} alt="Nft-logo" />
                                        <h1 className="text-xl">NFT Marketplace</h1>
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
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </body>
        </html>
    );
}
