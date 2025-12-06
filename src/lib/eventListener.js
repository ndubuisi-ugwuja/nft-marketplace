import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { MARKETPLACE_CONTRACT_ADDRESS } from "./marketplace";

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

/**
 * Fetch events in chunks to work with Alchemy free tier (10 block range limit)
 */
const fetchEventsInChunks = async (eventAbi, fromBlock, toBlock, chunkSize = 10000n) => {
    const allEvents = [];
    let currentBlock = fromBlock;

    console.log(`Fetching events from block ${fromBlock} to ${toBlock}...`);

    while (currentBlock <= toBlock) {
        const endBlock = currentBlock + chunkSize > toBlock ? toBlock : currentBlock + chunkSize;

        try {
            console.log(`Fetching chunk: ${currentBlock} to ${endBlock}`);
            const events = await publicClient.getLogs({
                address: MARKETPLACE_CONTRACT_ADDRESS,
                event: eventAbi,
                fromBlock: currentBlock,
                toBlock: endBlock,
            });

            allEvents.push(...events);
            console.log(`Found ${events.length} events in this chunk`);
        } catch (error) {
            console.error(`Error fetching chunk ${currentBlock}-${endBlock}:`, error);
            // If chunk is still too large, reduce chunk size and retry
            if (error.message?.includes("block range") && chunkSize > 10n) {
                console.log("Reducing chunk size and retrying...");
                const smallerChunkSize = chunkSize / 10n;
                const smallerChunkEvents = await fetchEventsInChunks(
                    eventAbi,
                    currentBlock,
                    endBlock,
                    smallerChunkSize,
                );
                allEvents.push(...smallerChunkEvents);
            }
        }

        currentBlock = endBlock + 1n;
    }

    return allEvents;
};

/**
 * Get all active listings from blockchain events
 * This reads ItemListed, ItemBought, and ItemCanceled events
 */
export const getActiveListings = async () => {
    try {
        console.log("🔍 Fetching marketplace events...");
        console.log("Marketplace Address:", MARKETPLACE_CONTRACT_ADDRESS);

        // Get the current block number
        const latestBlock = await publicClient.getBlockNumber();
        console.log("Latest block:", latestBlock);

        // For MVP, let's just scan the last 100,000 blocks (adjust as needed)
        // In production, you'd store the last scanned block and only fetch new ones
        const blocksToScan = 9n;
        const fromBlock = latestBlock > blocksToScan ? latestBlock - blocksToScan : 0n;
        const toBlock = latestBlock;

        console.log(`Scanning from block ${fromBlock} to ${toBlock}`);

        // Define event ABIs
        const itemListedEvent = parseAbiItem(
            "event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
        );
        const itemCanceledEvent = parseAbiItem(
            "event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId)",
        );
        const itemBoughtEvent = parseAbiItem(
            "event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
        );

        // Fetch ItemListed events in chunks
        console.log("📋 Fetching ItemListed events...");
        const listedEvents = await fetchEventsInChunks(itemListedEvent, fromBlock, toBlock);
        console.log(`✅ Found ${listedEvents.length} ItemListed events`);

        // Fetch ItemCanceled events in chunks
        console.log("❌ Fetching ItemCanceled events...");
        const canceledEvents = await fetchEventsInChunks(itemCanceledEvent, fromBlock, toBlock);
        console.log(`✅ Found ${canceledEvents.length} ItemCanceled events`);

        // Fetch ItemBought events in chunks
        console.log("💰 Fetching ItemBought events...");
        const boughtEvents = await fetchEventsInChunks(itemBoughtEvent, fromBlock, toBlock);
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

    return unwatch; // Call this function to stop watching
};
