"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../lib/marketplace";
import { resolveIPFS } from "../lib/alchemy";
import toast from "react-hot-toast";

export default function ListingCard({ nft, contractAddress, tokenId, onSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newPrice, setNewPrice] = useState("");
    const [listing, setListing] = useState(null);

    // Validate inputs
    const isValid = contractAddress && tokenId !== undefined && tokenId !== null;

    // Read listing from contract
    const { data: listingData, refetch } = useReadContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "getListing",
        args: isValid ? [contractAddress, BigInt(tokenId)] : undefined,
        enabled: isValid,
    });

    useEffect(() => {
        if (listingData && listingData.price > 0n) {
            setListing({
                price: listingData.price,
                seller: listingData.seller,
            });
        }
    }, [listingData]);

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleCancel = () => {
        if (!isValid) return;

        writeContract({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            abi: MARKETPLACE_ABI,
            functionName: "cancelListing",
            args: [contractAddress, BigInt(tokenId)],
        });
    };

    const handleUpdatePrice = () => {
        if (!newPrice || parseFloat(newPrice) <= 0) {
            toast.error("Please enter a valid price");
            return;
        }

        if (!isValid) return;

        writeContract({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            abi: MARKETPLACE_ABI,
            functionName: "updateListing",
            args: [contractAddress, BigInt(tokenId), parseEther(newPrice)],
        });
    };

    useEffect(() => {
        if (isSuccess) {
            toast.success("Listing updated successfully!");
            setIsEditing(false);
            setNewPrice("");
            refetch();
            onSuccess?.();
        }
    }, [isSuccess]);

    if (!isValid || !listing) return null;

    const imageUrl = resolveIPFS(nft?.image || nft?.media?.[0]?.gateway);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

                <div className="border-t pt-3 mt-3">
                    {!isEditing ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500">Current Price</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {formatEther(listing.price)} ETH
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 font-medium"
                                >
                                    ✏️ Update
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isPending || isConfirming}
                                    className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                                >
                                    {isPending || isConfirming ? "⏳" : "❌ Cancel"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="block text-sm font-medium mb-2">New Price (ETH)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder={formatEther(listing.price)}
                                className="w-full border-2 rounded-lg p-3 mb-3 focus:border-blue-500 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleUpdatePrice}
                                    disabled={isPending || isConfirming}
                                    className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                                >
                                    {isPending || isConfirming ? "⏳" : "✅ Save"}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-medium"
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
