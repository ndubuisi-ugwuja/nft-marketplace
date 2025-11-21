"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Marketplace" },
        { href: "/my-nfts", label: "My NFTs" },
        { href: "/my-listings", label: "My Listings" },
        { href: "/sell", label: "Sell NFT" },
    ];

    return (
        <div className="bg-gray-700 border-b border-gray-700">
            <div className="container mx-auto px-4">
                <nav className="flex space-x-1">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-6 py-4 transition font-medium ${
                                pathname === link.href
                                    ? " text-white border-b-2 border-blue-500"
                                    : "text-gray-300 hover:bg-gray-600 hover:text-white"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
