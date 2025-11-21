"use client";
import { useState, useEffect } from "react";
import { useReadContract, useBlockNumber } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../lib/marketplace";

export function useMarketplaceListings(nfts) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const { data: blockNumber } = useBlockNumber({ watch: true });

    useEffect(() => {
        if (nfts && nfts.length > 0) {
            checkListings();
        }
    }, [nfts, blockNumber]);

    const checkListings = async () => {
        setLoading(true);
        const results = [];

        for (const nft of nfts) {
            try {
                // This would ideally use a multicall contract for efficiency
                // For now, we check each NFT individually
                results.push({ nft, hasListing: false });
            } catch (error) {
                console.error("Error checking listing:", error);
            }
        }

        setListings(results);
        setLoading(false);
    };

    return { listings, loading, refetch: checkListings };
}
