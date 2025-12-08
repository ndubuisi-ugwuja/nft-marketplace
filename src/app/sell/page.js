"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { useNFTApproval } from "../../hooks/useNFTApproval";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../../lib/marketplace";
import { resolveIPFS } from "../../lib/alchemy";
import toast from "react-hot-toast";

// Separate the component that uses useSearchParams
function SellPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { address } = useAccount();
    const [price, setPrice] = useState("");
    const [currentStep, setCurrentStep] = useState(1);

    const contract = searchParams.get("contract");
    const tokenId = searchParams.get("tokenId");
    const name = searchParams.get("name");
    const image = searchParams.get("image");

    const {
        isApproved,
        approve,
        isPending: isApprovePending,
        isConfirming: isApproveConfirming,
        isSuccess: isApproveSuccess,
        error: approveError,
        refetch: refetchApproval,
    } = useNFTApproval(contract, tokenId, address);

    const { data: listHash, writeContract: listNFT, isPending: isListPending, error: listError } = useWriteContract();
    const { isLoading: isListConfirming, isSuccess: isListSuccess } = useWaitForTransactionReceipt({
        hash: listHash,
    });

    // Console logging for debugging
    console.log("=== SELL PAGE STATE ===");
    console.log("Current Step:", currentStep);
    console.log("Price:", price);
    console.log("Is Approved:", isApproved);
    console.log("Marketplace Address:", MARKETPLACE_CONTRACT_ADDRESS);
    console.log("Contract:", contract);
    console.log("Token ID:", tokenId);

    // Handle approval success
    useEffect(() => {
        if (isApproveSuccess) {
            console.log("✅ Approval successful!");
            toast.success("NFT approved! Now you can list it.");
            refetchApproval();
            setCurrentStep(3);
        }
    }, [isApproveSuccess, refetchApproval]);

    // Handle approval error
    useEffect(() => {
        if (approveError) {
            console.error("❌ Approval error:", approveError);
            toast.error("Approval failed: " + approveError.message);
        }
    }, [approveError]);

    // Handle listing error
    useEffect(() => {
        if (listError) {
            console.error("❌ Listing error:", listError);
            toast.error("Listing failed: " + (listError.message || "Unknown error"));
        }
    }, [listError]);

    // Handle listing success
    useEffect(() => {
        if (isListSuccess) {
            console.log("✅ NFT listed successfully!");
            toast.success("NFT listed successfully!");
            setTimeout(() => {
                router.push("/my-listings");
            }, 2000);
        }
    }, [isListSuccess, router]);

    const handleApprove = () => {
        console.log("🔵 handleApprove called");

        if (!price || parseFloat(price) <= 0) {
            toast.error("Please enter a valid price first");
            return;
        }

        console.log("Starting approval process...");
        setCurrentStep(2);
        approve();
    };

    const handleList = async () => {
        console.log("🟢 handleList called");
        console.log("Price value:", price);
        console.log("Is Approved:", isApproved);
        console.log("Contract:", contract);
        console.log("Token ID:", tokenId);
        console.log("Marketplace:", MARKETPLACE_CONTRACT_ADDRESS);

        if (!price || parseFloat(price) <= 0) {
            console.error("❌ Invalid price");
            toast.error("Please enter a valid price");
            return;
        }

        if (!isApproved) {
            console.error("❌ NFT not approved");
            toast.error("Please approve the NFT first");
            return;
        }

        if (!contract || !tokenId) {
            console.error("❌ Missing contract or tokenId");
            toast.error("NFT information is missing");
            return;
        }

        if (!MARKETPLACE_CONTRACT_ADDRESS) {
            console.error("❌ Marketplace address not configured");
            toast.error("Marketplace address not configured");
            return;
        }

        console.log("✅ All validations passed");

        try {
            const priceInWei = parseEther(price);
            const tokenIdBigInt = BigInt(tokenId);

            console.log("Calling listNFT with:", {
                marketplace: MARKETPLACE_CONTRACT_ADDRESS,
                nftContract: contract,
                tokenId: tokenIdBigInt.toString(),
                price: priceInWei.toString(),
            });

            await listNFT({
                address: MARKETPLACE_CONTRACT_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "listItem",
                args: [contract, tokenIdBigInt, priceInWei],
            });

            console.log("✅ listNFT function called successfully");
        } catch (error) {
            console.error("❌ Error in handleList:", error);
            toast.error("Failed to list NFT: " + (error.message || "Unknown error"));
        }
    };

    const handleEditPrice = () => {
        console.log("📝 Edit price clicked, returning to step 1");
        setCurrentStep(1);
    };

    if (!contract || !tokenId) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-4">No NFT Selected</h2>
                <p className="text-gray-600 mb-6">Please select an NFT from "My NFTs" to list</p>
                <a
                    href="/my-nfts"
                    className="inline-block bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                >
                    Go to My NFTs
                </a>
            </div>
        );
    }

    const imageUrl = resolveIPFS(image);
    const showListButton = isApproved && currentStep === 3;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl mb-8">Sell NFT</h1>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div
                        className={`flex items-center space-x-2 ${currentStep >= 1 ? "text-gray-700" : "text-gray-400"}`}
                    >
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? "bg-gray-700 text-white" : "bg-gray-300"}`}
                        >
                            1
                        </div>
                        <span className="font-medium">Set Price</span>
                    </div>
                    <div className="flex-1 h-1 mx-4 bg-gray-300">
                        <div className={`h-full ${currentStep >= 2 ? "bg-gray-700" : ""} transition-all`}></div>
                    </div>
                    <div
                        className={`flex items-center space-x-2 ${currentStep >= 2 ? "text-gray-700" : "text-gray-400"}`}
                    >
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? "bg-gray-700 text-white" : "bg-gray-300"}`}
                        >
                            2
                        </div>
                        <span className="font-medium">Approve</span>
                    </div>
                    <div className="flex-1 h-1 mx-4 bg-gray-300">
                        <div className={`h-full ${currentStep >= 3 ? "bg-gray-700" : ""} transition-all`}></div>
                    </div>
                    <div
                        className={`flex items-center space-x-2 ${currentStep >= 3 ? "text-gray-700" : "text-gray-400"}`}
                    >
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? "bg-gray-700 text-white" : "bg-gray-300"}`}
                        >
                            3
                        </div>
                        <span className="font-medium">List</span>
                    </div>
                </div>
            </div>

            {/* NFT Preview Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="grid md:grid-cols-2">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-80 object-cover"
                        onError={(e) => {
                            e.target.src = "/placeholder.png";
                        }}
                    />
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">{name || `NFT #${tokenId}`}</h2>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">Contract</p>
                            <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{contract}</p>
                        </div>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">Token ID</p>
                            <p className="font-mono font-bold">{tokenId}</p>
                        </div>
                        {/* Price Input/Display */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Listing Price (ETH) <span className="text-red-500">*</span>
                            </label>
                            {currentStep === 1 ? (
                                <>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.1"
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-gray-700 outline-none"
                                    />
                                </>
                            ) : (
                                <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                                    <span className="text-2xl font-bold text-gray-700">{price} ETH</span>
                                    {currentStep < 3 && (
                                        <button
                                            onClick={handleEditPrice}
                                            className="text-sm text-gray-700 hover:underline font-medium"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Action Buttons */}
                        {currentStep === 1 && (
                            <button
                                onClick={() => {
                                    if (!price || parseFloat(price) <= 0) {
                                        toast.error("Please enter a valid price first");
                                        return;
                                    }
                                    // If already approved, skip to step 3, otherwise go to step 2
                                    setCurrentStep(isApproved ? 3 : 2);
                                    if (!isApproved) {
                                        approve();
                                    }
                                }}
                                disabled={!price || parseFloat(price) <= 0}
                                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                            >
                                {isApproved ? "Continue to List" : "Approve NFT"}
                            </button>
                        )}
                        {currentStep === 2 && !isApproved && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2 font-semibold">
                                    {isApprovePending || isApproveConfirming ? "Approving NFT..." : "Approval Required"}
                                </p>
                                <p className="text-xs text-gray-700">
                                    {isApprovePending || isApproveConfirming
                                        ? "Please confirm the transaction in your wallet..."
                                        : "You need to approve the marketplace contract to transfer your NFT when it's sold."}
                                </p>
                            </div>
                        )}
                        {showListButton && (
                            <>
                                <button
                                    onClick={() => {
                                        console.log("🔴 LIST BUTTON CLICKED!");
                                        handleList();
                                    }}
                                    disabled={!price || parseFloat(price) <= 0 || isListPending || isListConfirming}
                                    className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                                >
                                    {isListPending || isListConfirming ? "Listing NFT..." : "List for Sale"}
                                </button>
                                <p className="text-sm text-green-600 mt-3 flex items-center">
                                    <span className="mr-2">✅</span>
                                    NFT is approved - ready to list!
                                </p>
                                <button
                                    onClick={handleEditPrice}
                                    className="w-full mt-2 text-sm text-gray-700 hover:underline"
                                >
                                    Edit Price
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-800 mb-2">ℹ️ How it works</h3>
                <ol className="text-sm text-yellow-700 space-y-2">
                    <li>
                        <strong>1. Set Price:</strong> Enter the price you want to sell your NFT for
                    </li>
                    <li>
                        <strong>2. Approve:</strong> Allow the marketplace contract to transfer your NFT
                    </li>
                    <li>
                        <strong>3. List:</strong> Your NFT will be listed on the marketplace for others to buy
                    </li>
                </ol>
            </div>
        </div>
    );
}

// Main component with Suspense wrapper
export default function SellPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-2xl mx-auto text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            }
        >
            <SellPageContent />
        </Suspense>
    );
}
