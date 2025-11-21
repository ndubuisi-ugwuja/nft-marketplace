"use client";
import { useRouter } from "next/navigation";
import { resolveIPFS } from "@/lib/alchemy";

export default function MyNFTCard({ nft }) {
    const router = useRouter();

    // Validate NFT data
    if (!nft?.contract?.address || !nft?.tokenId) {
        console.error("Invalid NFT data:", nft);
        return null;
    }

    const imageUrl = resolveIPFS(nft.image || nft.media?.[0]?.gateway);

    const handleSell = () => {
        const params = new URLSearchParams({
            contract: nft.contract.address,
            tokenId: nft.tokenId.toString(), // Convert to string for URL
            name: nft.name || `NFT #${nft.tokenId}`,
            image: nft.image || "",
        });
        router.push(`/sell?${params.toString()}`);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <img
                src={imageUrl}
                alt={nft.name || `NFT #${nft.tokenId}`}
                className="w-full h-64 object-cover"
                onError={(e) => {
                    e.target.src = "/placeholder.png";
                }}
            />
            <div className="p-4">
                <h3 className="font-bold text-lg mb-2 truncate">{nft.name || `NFT #${nft.tokenId}`}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {nft.description || "No description available"}
                </p>

                {nft.attributes && nft.attributes.length > 0 && (
                    <div className="mb-3 space-y-1">
                        {nft.attributes.slice(0, 2).map((attr, idx) => (
                            <div key={idx} className="text-xs bg-gray-100 rounded px-2 py-1 inline-block mr-2">
                                <span className="font-semibold">{attr.trait_type}:</span> {attr.value}
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-xs text-gray-500 mb-3">Token ID: {nft.tokenId}</div>

                <button
                    onClick={handleSell}
                    className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold transition"
                >
                    Sell This NFT
                </button>
            </div>
        </div>
    );
}
