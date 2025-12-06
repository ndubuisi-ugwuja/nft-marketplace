"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { alchemyAPI } from "../lib/alchemy";
import NFTCard from "../components/NFTCard";

export default function MarketplacePage() {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isConnected } = useAccount();

    useEffect(() => {
        if (isConnected) {
            loadMarketplace();
        }
    }, [isConnected]);

    const loadMarketplace = async () => {
        setLoading(true);
        try {
            console.log("🏪 Loading marketplace...");

            // Get all active listings from blockchain events
            const listings = await getActiveListings();
            console.log(`📋 Found ${listings.length} active listings`);

            if (listings.length === 0) {
                setNfts([]);
                setLoading(false);
                return;
            }

            // Fetch metadata for each listing from Alchemy
            console.log("📦 Fetching NFT metadata...");
            const nftsWithMetadata = await Promise.all(
                listings.map(async (listing) => {
                    try {
                        console.log(`Fetching metadata for ${listing.nftContract} #${listing.tokenId}`);

                        const metadata = await alchemyAPI.getNFTMetadata(listing.nftContract, listing.tokenId);

                        return {
                            contract: { address: listing.nftContract },
                            tokenId: listing.tokenId,
                            name: metadata?.title || metadata?.name || `NFT #${listing.tokenId}`,
                            description: metadata?.description || "No description",
                            image: metadata?.media?.[0]?.gateway || metadata?.image,
                            attributes: metadata?.metadata?.attributes || metadata?.attributes || [],
                            price: listing.price,
                            seller: listing.seller,
                        };
                    } catch (error) {
                        console.error(`Error fetching metadata for ${listing.nftContract} #${listing.tokenId}:`, error);
                        // Return listing without full metadata
                        return {
                            contract: { address: listing.nftContract },
                            tokenId: listing.tokenId,
                            name: `NFT #${listing.tokenId}`,
                            description: "Metadata unavailable",
                            image: null,
                            attributes: [],
                            price: listing.price,
                            seller: listing.seller,
                        };
                    }
                }),
            );

            // Filter out null results
            const validNfts = nftsWithMetadata.filter((nft) => nft !== null);
            console.log(`✅ Successfully loaded ${validNfts.length} NFTs`);

            setNfts(validNfts);
        } catch (error) {
            console.error("❌ Error loading marketplace:", error);
        }
        setLoading(false);
    };

    if (!isConnected) {
        return (
            <div className="text-center py-20">
                <div className="mb-6 flex items-center justify-center">
                    <img src="/eth-logo.png" width={75} alt="eth-logo" />
                </div>
                <h2 className="text-2xl mb-4">Welcome to NFT Marketplace</h2>
                <p className="text-gray-600 mb-6">Connect your wallet to start browsing and trading NFTs</p>
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                        <span>✅ Buy NFTs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>💰 Sell NFTs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>🔒 Trade Safely</span>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-700 mb-4"></div>
                <p className="text-gray-600 text-lg">Scanning blockchain for listings...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl mb-2">🏪 Marketplace</h1>
                <p className="text-gray-600">
                    {nfts.length > 0
                        ? `Showing ${nfts.length} NFT${nfts.length !== 1 ? "s" : ""} listed for sale`
                        : "Browse NFTs listed for sale"}
                </p>
            </div>

            {nfts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 text-lg mb-2">No NFTs listed for sale yet</p>
                    <p className="text-sm text-gray-500 mb-6">Be the first to list an NFT on the marketplace!</p>

                    <a
                        href="/my-nfts"
                        className="inline-block bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                    >
                        List Your NFT
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {nfts.map((nft) => (
                        <NFTCard
                            key={`${nft.contract.address}-${nft.tokenId}`}
                            nft={nft}
                            contractAddress={nft.contract.address}
                            tokenId={nft.tokenId}
                            onSuccess={loadMarketplace}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
