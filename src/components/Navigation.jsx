"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "MARKETPLACE" },
        { href: "/my-nfts", label: "MY NFTs" },
        { href: "/my-listings", label: "MY LISTINGS" },
        { href: "/sell", label: "SELL NFT" },
    ];

    return (
        <div className="border-b-2 border-gray-400">
            <div className="container mx-auto px-4">
                <nav className="flex space-x-1">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-6 py-4 transition font-semibold text-sm ${
                                pathname === link.href
                                    ? " text-black border-b-4 border-gray-600"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-500"
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
