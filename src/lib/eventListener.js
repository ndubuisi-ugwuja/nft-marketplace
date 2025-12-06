import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { MARKETPLACE_CONTRACT_ADDRESS } from "./marketplace";

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

/**
 * Get all active listings from blockchain events
 * This reads ItemListed, ItemBought, and ItemCanceled events
 */
export const getActiveListings = async () => {
    try {
        console.log("🔍 Fetching marketplace events...");
        console.log("Marketplace Address:", MARKETPLACE_CONTRACT_ADDRESS);

        // Define the block range (you can adjust this)
        // For production, you'd store the last checked block and only fetch new events
        const fromBlock = 0n; // Start from contract deployment block
        const toBlock = "latest";

        // Fetch ItemListed events
        console.log("📋 Fetching ItemListed events...");
        const listedEvents = await publicClient.getLogs({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            event: parseAbiItem(
                "event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
            ),
            fromBlock,
            toBlock,
        });
        console.log(`✅ Found ${listedEvents.length} ItemListed events`);

        // Fetch ItemCanceled events
        console.log("❌ Fetching ItemCanceled events...");
        const canceledEvents = await publicClient.getLogs({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            event: parseAbiItem(
                "event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId)",
            ),
            fromBlock,
            toBlock,
        });
        console.log(`✅ Found ${canceledEvents.length} ItemCanceled events`);

        // Fetch ItemBought events
        console.log("💰 Fetching ItemBought events...");
        const boughtEvents = await publicClient.getLogs({
            address: MARKETPLACE_CONTRACT_ADDRESS,
            event: parseAbiItem(
                "event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
            ),
            fromBlock,
            toBlock,
        });
        console.log(`✅ Found ${boughtEvents.length} ItemBought events`);

        // Build a map of active listings
        const listingsMap = new Map();

        // Step 1: Add all listed items
        listedEvents.forEach((event) => {
            const key = `${event.args.nftAddress}-${event.args.tokenId}`;
            listingsMap.set(key, {
                nftContract: event.args.nftAddress,
                tokenId: event.args.tokenId.toString(),
                price: event.args.price,
                seller: event.args.seller,
                blockNumber: event.blockNumber,
            });
            console.log(`➕ Added listing: ${key}`);
        });

        // Step 2: Remove canceled items
        canceledEvents.forEach((event) => {
            const key = `${event.args.nftAddress}-${event.args.tokenId}`;
            if (listingsMap.has(key)) {
                listingsMap.delete(key);
                console.log(`🗑️ Removed canceled listing: ${key}`);
            }
        });

        // Step 3: Remove bought items
        boughtEvents.forEach((event) => {
            const key = `${event.args.nftAddress}-${event.args.tokenId}`;
            if (listingsMap.has(key)) {
                listingsMap.delete(key);
                console.log(`💸 Removed sold listing: ${key}`);
            }
        });

        const activeListings = Array.from(listingsMap.values());
        console.log(`✅ Total active listings: ${activeListings.length}`);
        console.log("Active listings:", activeListings);

        return activeListings;
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        return [];
    }
};

/**
 * Watch for new listing events in real-time (optional - for live updates)
 */
export const watchListingEvents = (callback) => {
    const unwatch = publicClient.watchEvent({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        event: parseAbiItem(
            "event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
        ),
        onLogs: (logs) => {
            console.log("🆕 New listing event detected:", logs);
            callback(logs);
        },
    });

    return unwatch;
};
