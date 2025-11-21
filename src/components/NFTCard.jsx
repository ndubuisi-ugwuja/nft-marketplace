"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../lib/marketplace";
import { resolveIPFS } from "../lib/alchemy";
import toast from "react-hot-toast";

export default function NFTCard({ nft, contractAddress, tokenId, onSuccess }) {
    const { address } = useAccount();
    const [listing, setListing] = useState(null);

    // Validate inputs before making contract call
    const isValid = contractAddress && tokenId !== undefined && tokenId !== null;

    // Read listing from contract - only if we have valid data
    const { data: listingData, refetch } = useReadContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "getListing",
        args: isValid ? [contractAddress, BigInt(tokenId)] : undefined,
        enabled: isValid, // Only run query if data is valid
    });

    useEffect(() => {
        if (listingData && listingData.price > 0n) {
            setListing({
                price: listingData.price,
                seller: listingData.seller,
            });
        } else {
            setListing(null);
        }
    }, [listingData]);

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleBuy = async () => {
        if (!listing || !isValid) return;

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
            refetch();
            onSuccess?.();
        }
    }, [isSuccess]);

    // Don't render if invalid data or not listed
    if (!isValid || !listing) return null;

    const isOwner = address?.toLowerCase() === listing.seller?.toLowerCase();
    const imageUrl = resolveIPFS(nft?.image || nft?.media?.[0]?.gateway);

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
                        <span className="text-xl font-bold text-blue-600">{formatEther(listing.price)} ETH</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>

                    {!isOwner ? (
                        <button
                            onClick={handleBuy}
                            disabled={isPending || isConfirming}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                        >
                            {isPending || isConfirming ? "⏳ Processing..." : "💰 Buy Now"}
                        </button>
                    ) : (
                        <div className="bg-gray-100 text-center py-3 rounded-lg text-sm text-gray-600 font-medium">
                            🏷️ Your Listing
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
