"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { alchemyAPI } from "../../lib/alchemy";
import ListingCard from "../../components/ListingCard";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../../lib/marketplace";
import toast from "react-hot-toast";

export default function MyListingsPage() {
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const { address, isConnected } = useAccount();

    // Get user's proceeds
    const { data: proceeds, refetch: refetchProceeds } = useReadContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "getProceeds",
        args: address ? [address] : undefined,
    });

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConnected && address) {
            loadMyListings();
        }
    }, [address, isConnected]);

    useEffect(() => {
        if (isSuccess) {
            toast.success("Proceeds withdrawn successfully!");
            refetchProceeds();
        }
    }, [isSuccess]);

    const loadMyListings = async () => {
        setLoading(true);
        try {
            const userNFTs = await alchemyAPI.getNFTsForOwner(address);
            console.log("Raw NFTs from Alchemy:", userNFTs);

            // ✅ NORMALIZE NFT DATA FIRST (same as my-nfts page)
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
                const isValid = nft.tokenId !== undefined && nft.tokenId !== null && nft.contract?.address;

                if (!isValid) {
                    console.warn("Filtering out invalid NFT:", nft);
                }
                return isValid;
            });

            console.log("Valid NFTs to process:", validUserNFTs.length);

            // Map to final format with all data
            const nftsWithMetadata = validUserNFTs.map((nft) => {
                return {
                    contract: nft.contract,
                    tokenId: nft.tokenId,
                    name: nft.title || nft.metadata?.name || `NFT #${nft.tokenId}`,
                    description: nft.description || nft.metadata?.description || "No description",
                    image: nft.media?.[0]?.gateway || nft.metadata?.image,
                    attributes: nft.metadata?.attributes || [],
                };
            });

            console.log("NFTs with metadata:", nftsWithMetadata);
            setMyListings(nftsWithMetadata);
        } catch (error) {
            console.error("Error loading listings:", error);
            setMyListings([]);
        }
        setLoading(false);
    };

    const handleWithdraw = () => {
        writeContract({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            abi: MARKETPLACE_ABI,
            functionName: "withdrawProceeds",
        });
    };

    if (!isConnected) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🔌</div>
                <h2 className="text-2xl font-bold mb-4">Connect your wallet</h2>
                <p className="text-gray-600">Connect to view your listings</p>
            </div>
        );
    }

    const hasProceeds = proceeds && proceeds > 0n;

    return (
        <div>
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl mb-2">My Listings</h1>
                        <p className="text-gray-600">Manage your active NFT listings ({myListings.length} total)</p>
                    </div>

                    {hasProceeds && (
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg min-w-[280px]">
                            <p className="text-sm opacity-90 mb-2">💰 Available to withdraw</p>
                            <p className="text-3xl font-bold mb-4">{formatEther(proceeds)} ETH</p>
                            <button
                                onClick={handleWithdraw}
                                disabled={isPending || isConfirming}
                                className="w-full bg-white text-green-600 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-semibold transition"
                            >
                                {isPending || isConfirming ? "⏳ Withdrawing..." : "💸 Withdraw Now"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-700 mb-4"></div>
                    <p className="text-gray-600">Loading your listings...</p>
                </div>
            ) : myListings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-600 text-lg mb-2">You have no NFTs to list</p>
                    <p className="text-sm text-gray-500 mb-6">Listed NFTs will appear here</p>
                    href="/my-nfts" className="inline-block bg-gray-700 text-white px-6 py-3 rounded-lg
                    hover:bg-gray-600 font-semibold"
                    <a>View My NFTs</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {myListings.map((nft) => (
                        <ListingCard
                            key={`${nft.contract.address}-${nft.tokenId}`}
                            nft={nft}
                            contractAddress={nft.contract.address}
                            tokenId={nft.tokenId}
                            onSuccess={loadMyListings}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
