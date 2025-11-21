"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKETPLACE_CONTRACT_ADDRESS } from "../lib/marketplace";

const ERC721_ABI = [
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "tokenId", type: "uint256" }],
        name: "getApproved",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "operator", type: "address" },
            { name: "approved", type: "bool" },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "owner", type: "address" },
            { name: "operator", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
];

export function useNFTApproval(contractAddress, tokenId, ownerAddress) {
    // Validate inputs
    const isValid = contractAddress && tokenId !== undefined && tokenId !== null && ownerAddress;

    // Check single token approval
    const { data: approvedAddress, refetch } = useReadContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: "getApproved",
        args: isValid ? [BigInt(tokenId)] : undefined,
        enabled: isValid,
    });

    // Check if operator is approved for all
    const { data: isApprovedForAll } = useReadContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: "isApprovedForAll",
        args: isValid ? [ownerAddress, MARKETPLACE_CONTRACT_ADDRESS] : undefined,
        enabled: isValid,
    });

    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = () => {
        if (!isValid) {
            console.error("Invalid approval parameters:", { contractAddress, tokenId, ownerAddress });
            return;
        }

        console.log("Approving NFT:", {
            contract: contractAddress,
            tokenId: tokenId,
            marketplace: MARKETPLACE_CONTRACT_ADDRESS,
        });

        try {
            writeContract({
                address: contractAddress,
                abi: ERC721_ABI,
                functionName: "approve",
                args: [MARKETPLACE_CONTRACT_ADDRESS, BigInt(tokenId)],
            });
        } catch (err) {
            console.error("Error calling approve:", err);
        }
    };

    const approveAll = () => {
        if (!isValid) return;

        writeContract({
            address: contractAddress,
            abi: ERC721_ABI,
            functionName: "setApprovalForAll",
            args: [MARKETPLACE_CONTRACT_ADDRESS, true],
        });
    };

    const isApproved =
        approvedAddress?.toLowerCase() === MARKETPLACE_CONTRACT_ADDRESS?.toLowerCase() || isApprovedForAll === true;

    console.log("Approval check:", {
        approvedAddress,
        marketplaceAddress: MARKETPLACE_CONTRACT_ADDRESS,
        isApprovedForAll,
        finalIsApproved: isApproved,
    });

    return {
        isApproved,
        approve,
        approveAll,
        isPending,
        isConfirming,
        isSuccess,
        error,
        refetch,
    };
}
