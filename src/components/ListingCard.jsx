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
    const {
        data: listingData,
        refetch,
        isLoading,
        error,
    } = useReadContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "getListing",
        args: isValid ? [contractAddress, BigInt(tokenId)] : undefined,
        enabled: isValid,
    });

    useEffect(() => {
        if (listingData) {
            console.log("Raw listing data:", listingData);

            // Handle both array format [price, seller] and object format {price, seller}
            let price, seller;

            if (Array.isArray(listingData)) {
                // Array format: [price, seller]
                price = listingData[0];
                seller = listingData[1];
            } else {
                // Object format: {price, seller}
                price = listingData.price;
                seller = listingData.seller;
            }

            console.log("Parsed - Price:", price?.toString(), "Seller:", seller);

            if (price && price > 0n) {
                setListing({
                    price: price,
                    seller: seller,
                });
                console.log("✅ NFT is listed for sale");
            } else {
                setListing(null);
                console.log("❌ NFT is NOT listed (price is 0)");
            }
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

    // Show loading state while checking listing
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
                <div className="animate-pulse">
                    <div className="bg-gray-300 h-64 w-full mb-4 rounded"></div>
                    <div className="bg-gray-300 h-4 w-3/4 mb-2 rounded"></div>
                    <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
                </div>
            </div>
        );
    }

    // Don't render if not valid or not listed
    if (!isValid || !listing) {
        return null;
    }

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
                <p className="text-xs text-gray-500 mb-2">Token ID: {tokenId}</p>

                <div className="border-t pt-3 mt-3">
                    {!isEditing ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500">Current Price</span>
                                <span className="text-xl font-bold text-gray-700">
                                    {formatEther(listing.price)} ETH
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 font-medium transition"
                                >
                                    ✏️ Update
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isPending || isConfirming}
                                    className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition"
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
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder={formatEther(listing.price)}
                                className="w-full border-2 border-gray-300 rounded-lg p-3 mb-3 focus:border-gray-700 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleUpdatePrice}
                                    disabled={isPending || isConfirming}
                                    className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
                                >
                                    {isPending || isConfirming ? "⏳" : "✅ Save"}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-medium transition"
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
