"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { alchemyAPI } from "../lib/alchemy";
import NFTCard from "../components/NFTCard";

export default function MarketplacePage() {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (isConnected) {
            loadMarketplace();
        }
    }, [isConnected]);

    const loadMarketplace = async () => {
        setLoading(true);
        try {
            const userNFTs = await alchemyAPI.getNFTsForOwner(address);

            // Normalize NFT structure
            const normalizedNFTs = userNFTs.map((nft) => {
                let tokenId;
                if (nft.tokenId) {
                    tokenId = nft.tokenId;
                } else if (nft.id?.tokenId) {
                    tokenId = parseInt(nft.id.tokenId, 16).toString();
                }

                return {
                    contract: { address: nft.contract.address },
                    tokenId: tokenId,
                    title: nft.title,
                    description: nft.description,
                    media: nft.media,
                    metadata: nft.metadata,
                };
            });

            // Filter and format
            const validNFTs = normalizedNFTs.filter((nft) => {
                return nft.tokenId !== undefined && nft.tokenId !== null && nft.contract?.address;
            });

            const nftsWithMetadata = validNFTs.map((nft) => ({
                contract: nft.contract,
                tokenId: nft.tokenId,
                name: nft.title || nft.metadata?.name || `NFT #${nft.tokenId}`,
                description: nft.description || nft.metadata?.description || "No description",
                image: nft.media?.[0]?.gateway || nft.metadata?.image,
                attributes: nft.metadata?.attributes || [],
            }));

            setNfts(nftsWithMetadata);
        } catch (error) {
            console.error("Error loading marketplace:", error);
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
                <p className="text-gray-600 mb-6">Please connect your wallet to start browsing and trading NFTs</p>
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                        <span>Buy NFTs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>Sell NFTs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>Trade Safely</span>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-700 mb-4"></div>
                <p className="text-gray-600 text-lg">Loading marketplace...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl mb-2">Marketplace</h1>
                <p className="text-gray-600">Browse and buy NFTs listed for sale</p>
            </div>

            {nfts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 text-lg mb-2">No NFTs listed for sale yet</p>
                    <p className="text-sm text-gray-500">Be the first to list an NFT!</p>
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
