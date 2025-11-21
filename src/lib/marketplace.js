import { ethers } from "ethers";

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

// Contract ABI - defines all contract functions
export const MARKETPLACE_ABI = [
    "function listItem(address nftAddress, uint256 tokenId, uint256 price)",
    "function buyItem(address nftAddress, uint256 tokenId) payable",
    "function cancelListing(address nftAddress, uint256 tokenId)",
    "function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice)",
    "function withdrawProceeds()",
    "function getListing(address nftAddress, uint256 tokenId) view returns (uint256 price, address seller)",
    "function getProceeds(address seller) view returns (uint256)",
    "event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
    "event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
    "event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId)",
];

export const MARKETPLACE_CONTRACT_ADDRESS = MARKETPLACE_ADDRESS;

// Helper functions for contract interactions (used with Wagmi hooks)
export const formatPrice = (priceInWei) => {
    return ethers.utils.formatEther(priceInWei);
};

export const parsePrice = (priceInEth) => {
    return ethers.utils.parseEther(priceInEth.toString());
};
