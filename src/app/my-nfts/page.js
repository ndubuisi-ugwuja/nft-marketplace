"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { alchemyAPI } from "../../lib/alchemy";
import MyNFTCard from "../../components/MyNFTCard";

export default function MyNFTsPage() {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (isConnected && address) {
            loadNFTs();
        }
    }, [address, isConnected]);

    const loadNFTs = async () => {
        setLoading(true);
        try {
            console.log("=== STARTING NFT LOAD ===");
            console.log("Wallet address:", address);

            const userNFTs = await alchemyAPI.getNFTsForOwner(address);
            console.log("Total NFTs returned from Alchemy:", userNFTs.length);

            // Transform NFT data to normalize the structure
            const normalizedNFTs = userNFTs.map((nft) => {
                // Handle tokenId - it can be in different formats
                let tokenId;
                if (nft.tokenId) {
                    tokenId = nft.tokenId;
                } else if (nft.id?.tokenId) {
                    // Convert hex to decimal string
                    tokenId = parseInt(nft.id.tokenId, 16).toString();
                }

                return {
                    contract: {
                        address: nft.contract.address,
                    },
                    tokenId: tokenId,
                    title: nft.title,
                    description: nft.description,
                    media: nft.media,
                    metadata: nft.metadata,
                    tokenUri: nft.tokenUri,
                };
            });

            console.log("Normalized NFTs:", normalizedNFTs);

            // Filter valid NFTs
            const validUserNFTs = normalizedNFTs.filter((nft) => {
                const hasValidTokenId = nft.tokenId !== undefined && nft.tokenId !== null && nft.tokenId !== "";
                const hasValidContract = nft.contract?.address;

                if (!hasValidTokenId || !hasValidContract) {
                    console.warn("Skipping invalid NFT:", nft);
                    return false;
                }
                return true;
            });

            console.log(`Valid NFTs after filtering: ${validUserNFTs.length}`);

            // Map to final format with all data
            const nftsWithMetadata = validUserNFTs.map((nft) => {
                return {
                    contract: nft.contract,
                    tokenId: nft.tokenId,
                    name: nft.title || nft.metadata?.name || `NFT #${nft.tokenId}`,
                    description: nft.description || nft.metadata?.description || "No description available",
                    image: nft.media?.[0]?.gateway || nft.metadata?.image,
                    attributes: nft.metadata?.attributes || [],
                };
            });

            console.log("Final NFTs with metadata:", nftsWithMetadata);
            setNfts(nftsWithMetadata);
        } catch (error) {
            console.error("Error loading NFTs:", error);
        }
        setLoading(false);
    };

    if (!isConnected) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🔌</div>
                <h2 className="text-2xl font-bold mb-4">Connect your wallet</h2>
                <p className="text-gray-600">Connect your wallet to view your NFTs</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-700 mb-4"></div>
                <p className="text-gray-600">Loading your NFTs...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl mb-2">My NFTs</h1>
                <p className="text-gray-600">
                    Showing {nfts.length} NFT{nfts.length !== 1 ? "s" : ""} from your wallet. Click "Sell" to list them
                    on the marketplace.
                </p>
            </div>

            {nfts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <p className="text-gray-600 text-lg mb-2">No NFTs found in your wallet</p>
                    <p className="text-sm text-gray-500">NFTs you own will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {nfts.map((nft) => (
                        <MyNFTCard key={`${nft.contract.address}-${nft.tokenId}`} nft={nft} />
                    ))}
                </div>
            )}
        </div>
    );
}
