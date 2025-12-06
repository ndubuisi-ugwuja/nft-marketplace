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
    }, [isConnected, address]);

    const loadMarketplace = async () => {
        setLoading(true);
        try {
            // Strategy: Load NFTs from multiple sources
            const allNFTs = [];

            // 1. Load from current user's wallet
            if (address) {
                const userNFTs = await alchemyAPI.getNFTsForOwner(address);
                allNFTs.push(...userNFTs);
            }

            // 2. Load from known NFT collections (add your NFT collection addresses here)
            const knownCollections = [
                "0xabca0c24838520b94ad7b3903b95e2aa17962e0f", // Your Cpunk collection
                // Add more collection addresses here
            ];

            // Get holders of these collections
            for (const collection of knownCollections) {
                try {
                    // Note: This is a simplified approach
                    // In production, you'd use The Graph or event indexing
                    const contractMetadata = await alchemyAPI.getContractMetadata(collection);
                    console.log("Collection metadata:", contractMetadata);

                    // For now, we'll just add NFTs from known addresses
                    // You can add specific wallet addresses you know have NFTs
                    const knownHolders = [
                        address, // Current user
                        "0xF13be5175D1ae0093445bd7b08082BC2F75195b3", // Add your wallet
                        // Add more wallet addresses of users who have listed NFTs
                    ];

                    for (const holder of knownHolders) {
                        if (holder) {
                            const holderNFTs = await alchemyAPI.getNFTsForOwner(holder);
                            const collectionNFTs = holderNFTs.filter(
                                (nft) => nft.contract.address.toLowerCase() === collection.toLowerCase(),
                            );
                            allNFTs.push(...collectionNFTs);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading collection ${collection}:`, error);
                }
            }

            // Remove duplicates based on contract address + tokenId
            const uniqueNFTs = Array.from(
                new Map(
                    allNFTs.map((nft) => {
                        const key = `${nft.contract.address}-${nft.id?.tokenId || nft.tokenId}`;
                        return [key, nft];
                    }),
                ).values(),
            );

            console.log("Total unique NFTs found:", uniqueNFTs.length);

            // Normalize NFT structure
            const normalizedNFTs = uniqueNFTs.map((nft) => {
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

            // Filter valid NFTs
            const validNFTs = normalizedNFTs.filter((nft) => {
                return nft.tokenId !== undefined && nft.tokenId !== null && nft.contract?.address;
            });

            // Format with metadata
            const nftsWithMetadata = validNFTs.map((nft) => ({
                contract: nft.contract,
                tokenId: nft.tokenId,
                name: nft.title || nft.metadata?.name || `NFT #${nft.tokenId}`,
                description: nft.description || nft.metadata?.description || "No description",
                image: nft.media?.[0]?.gateway || nft.metadata?.image,
                attributes: nft.metadata?.attributes || [],
            }));

            console.log("Final NFTs to display:", nftsWithMetadata);
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
                <p className="text-gray-600 text-lg">Loading marketplace...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl mb-2">🏪 Marketplace</h1>
                <p className="text-gray-600">Browse NFTs listed for sale ({nfts.length} total)</p>
            </div>

            {nfts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 text-lg mb-2">No NFTs found</p>
                    <p className="text-sm text-gray-500 mb-6">Listed NFTs from known collections will appear here</p>

                    <a
                        href="/my-nfts"
                        className="inline-block bg-gray-700 text-white px-6 py-3 rounded-lg
                    hover:bg-gray-600 font-semibold"
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
