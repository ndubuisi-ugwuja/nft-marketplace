"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { formatEther } from "viem";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../lib/marketplace";
import { resolveIPFS } from "../lib/alchemy";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NFTCard({ nft, contractAddress, tokenId }) {
    const { address } = useAccount();
    const router = useRouter();

    // Use listing data from props if available (from event listener)
    const [listing, setListing] = useState(nft.price && nft.seller ? { price: nft.price, seller: nft.seller } : null);

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleBuy = async () => {
        if (!listing) return;

        try {
            writeContract({
                address: MARKETPLACE_CONTRACT_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "buyItem",
                args: [contractAddress, BigInt(tokenId)],
                value: listing.price,
            });
        } catch (error) {
            toast.error("Transaction failed");
            console.error(error);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            toast.success("NFT purchased successfully!");
            setTimeout(() => {
                router.push("/my-nfts");
            }, 2000);
        }
    }, [isSuccess, router]);

    // Don't render if no listing
    if (!listing) return null;

    const isOwner = address?.toLowerCase() === listing.seller?.toLowerCase();
    const imageUrl = resolveIPFS(nft?.image);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <img
                src={imageUrl}
                alt={nft?.name || `NFT #${tokenId}`}
                className="w-full h-64 object-cover"
                onError={(e) => {
                    e.target.src = "/placeholder.png";
                }}
            />
            <div className="p-4">
                <h3 className="font-bold text-lg mb-2 truncate">{nft?.name || `NFT #${tokenId}`}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nft?.description || "No description"}</p>

                {nft?.attributes && nft.attributes.length > 0 && (
                    <div className="mb-3 space-y-1">
                        {nft.attributes.slice(0, 2).map((attr, idx) => (
                            <div key={idx} className="text-xs bg-gray-100 rounded px-2 py-1 inline-block mr-2">
                                <span className="font-semibold">{attr.trait_type}:</span> {attr.value}
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">Price</span>
                        <span className="text-xl font-bold text-gray-700">{formatEther(listing.price)} ETH</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>

                    {!isOwner ? (
                        <button
                            onClick={handleBuy}
                            disabled={isPending || isConfirming}
                            className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                        >
                            {isPending || isConfirming ? "Processing..." : "Buy Now"}
                        </button>
                    ) : (
                        <div className="bg-gray-100 text-center py-3 rounded-lg text-sm text-gray-600 font-medium">
                            You own this NFT
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
