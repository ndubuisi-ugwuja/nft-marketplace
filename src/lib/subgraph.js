const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

export const getActiveListings = async () => {
    const query = `
        {
            listings(where: { active: true }, orderBy: timestamp, orderDirection: desc) {
                id
                nftContract
                tokenId
                price
                seller
                timestamp
                blockNumber
            }
        }
    `;

    try {
        const response = await fetch(SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const { data } = await response.json();
        return data?.listings || [];
    } catch (error) {
        console.error("Error fetching from subgraph:", error);
        return [];
    }
};

export const getListingsByUser = async (userAddress) => {
    const query = `
        {
            listings(where: { seller: "${userAddress.toLowerCase()}", active: true }) {
                id
                nftContract
                tokenId
                price
                seller
                timestamp
            }
        }
    `;

    const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    return data?.listings || [];
};
