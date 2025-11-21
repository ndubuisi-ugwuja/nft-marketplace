import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const BASE_URL = `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`;

export const alchemyAPI = {
    // Get all NFTs owned by a wallet address
    async getNFTsForOwner(ownerAddress) {
        try {
            const url = `${BASE_URL}/getNFTs/?owner=${ownerAddress}`;
            console.log("Fetching NFTs from:", url);
            const response = await axios.get(url);
            console.log("NFTs received:", response.data.ownedNfts?.length);
            return response.data.ownedNfts || [];
        } catch (error) {
            console.error("Error fetching NFTs:", error.response?.data || error.message);
            return [];
        }
    },

    // Get metadata for a specific NFT
    async getNFTMetadata(contractAddress, tokenId) {
        try {
            // Validate inputs
            if (!contractAddress || tokenId === undefined || tokenId === null) {
                console.error("Invalid parameters for getNFTMetadata:", { contractAddress, tokenId });
                return null;
            }

            const url = `${BASE_URL}/getNFTMetadata`;

            // Convert tokenId to string, handle hex format
            let tokenIdString = tokenId;
            if (typeof tokenId === "number") {
                tokenIdString = tokenId.toString();
            } else if (typeof tokenId === "object" && tokenId.hex) {
                // Handle BigNumber/hex format
                tokenIdString = parseInt(tokenId.hex, 16).toString();
            }

            console.log("Fetching metadata for:", { contractAddress, tokenId: tokenIdString });

            const response = await axios.get(url, {
                params: {
                    contractAddress,
                    tokenId: tokenIdString,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching metadata:", error.response?.data || error.message);
            return null;
        }
    },

    // Get contract information
    async getContractMetadata(contractAddress) {
        try {
            const url = `${BASE_URL}/getContractMetadata`;
            const response = await axios.get(url, {
                params: { contractAddress },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching contract metadata:", error.response?.data || error.message);
            return null;
        }
    },

    // Get transfer history for an NFT
    async getAssetTransfers(params) {
        try {
            const response = await axios.post(BASE_URL, {
                jsonrpc: "2.0",
                id: 1,
                method: "alchemy_getAssetTransfers",
                params: [params],
            });
            return response.data.result;
        } catch (error) {
            console.error("Error fetching transfers:", error.response?.data || error.message);
            return [];
        }
    },
};

// Helper to resolve IPFS URLs to HTTP gateway URLs
export const resolveIPFS = (url) => {
    if (!url) return "/placeholder.png";
    if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    return url;
};
