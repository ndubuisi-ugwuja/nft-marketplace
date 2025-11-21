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

            console.log("Raw NFTs from Alchemy:", userNFTs); // Debug log

            // First filter - remove NFTs without tokenId BEFORE processing
            const validUserNFTs = userNFTs.filter((nft) => {
                const hasTokenId = nft.tokenId !== undefined && nft.tokenId !== null && nft.tokenId !== "";
                const hasContract = nft.contract?.address;

                if (!hasTokenId || !hasContract) {
                    console.warn("Filtering out invalid NFT before metadata fetch:", nft);
                    return false;
                }
                return true;
            });

            console.log("Valid NFTs to process:", validUserNFTs.length); // Debug log

            // Get metadata for all valid NFTs
            const nftsWithMetadata = await Promise.all(
                validUserNFTs.map(async (nft) => {
                    try {
                        // ✅ Normalize tokenId before fetching metadata
                        let tokenId;
                        if (nft.tokenId) {
                            tokenId = nft.tokenId;
                        } else if (nft.id?.tokenId) {
                            tokenId = parseInt(nft.id.tokenId, 16).toString();
                        } else {
                            console.warn("NFT has no valid tokenId:", nft);
                            return null;
                        }

                        const metadata = await alchemyAPI.getNFTMetadata(nft.contract.address, tokenId);

                        return {
                            ...nft,
                            tokenId, // <-- also store the normalized tokenId
                            name: metadata?.title || metadata?.name || `NFT #${tokenId}`,
                            description: metadata?.description || "No description",
                            image: metadata?.media?.[0]?.gateway || metadata?.image,
                            attributes: metadata?.metadata?.attributes || [],
                        };
                    } catch (error) {
                        console.error("Error fetching metadata for token:", nft.tokenId, error);
                        return {
                            ...nft,
                            name: `NFT`,
                            description: "No description",
                            image: null,
                            attributes: [],
                        };
                    }
                }),
            );

            console.log("NFTs with metadata:", nftsWithMetadata); // Debug log
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
                        <p className="text-gray-600">Manage your active NFT listings</p>
                    </div>

                    {hasProceeds && (
                        <div className="bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg min-w-[280px]">
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
                    <p className="text-gray-600 text-lg mb-2">You have no active listings</p>
                    <p className="text-sm text-gray-500 mb-6">Go to "My NFTs" to list an NFT for sale</p>
                    <a
                        href="/my-nfts"
                        className="inline-block bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                    >
                        View My NFTs
                    </a>
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
