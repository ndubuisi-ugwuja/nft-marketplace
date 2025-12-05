import { ethers } from "ethers";

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

// Contract ABI - PROPER JSON FORMAT
export const MARKETPLACE_ABI = [
    {
        inputs: [
            { name: "nftAddress", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "price", type: "uint256" },
        ],
        name: "listItem",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "nftAddress", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        name: "buyItem",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            { name: "nftAddress", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        name: "cancelListing",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "nftAddress", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "newPrice", type: "uint256" },
        ],
        name: "updateListing",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "withdrawProceeds",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "nftAddress", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        name: "getListing",
        outputs: [
            { name: "price", type: "uint256" },
            { name: "seller", type: "address" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "seller", type: "address" }],
        name: "getProceeds",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "seller", type: "address" },
            { indexed: true, name: "nftAddress", type: "address" },
            { indexed: true, name: "tokenId", type: "uint256" },
            { indexed: false, name: "price", type: "uint256" },
        ],
        name: "ItemListed",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "buyer", type: "address" },
            { indexed: true, name: "nftAddress", type: "address" },
            { indexed: true, name: "tokenId", type: "uint256" },
            { indexed: false, name: "price", type: "uint256" },
        ],
        name: "ItemBought",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "seller", type: "address" },
            { indexed: true, name: "nftAddress", type: "address" },
            { indexed: true, name: "tokenId", type: "uint256" },
        ],
        name: "ItemCanceled",
        type: "event",
    },
];

export const MARKETPLACE_CONTRACT_ADDRESS = MARKETPLACE_ADDRESS;

// Helper functions for contract interactions (used with Wagmi hooks)
export const formatPrice = (priceInWei) => {
    return ethers.utils.formatEther(priceInWei);
};

export const parsePrice = (priceInEth) => {
    return ethers.utils.parseEther(priceInEth.toString());
};
