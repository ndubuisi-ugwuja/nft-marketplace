const { ethers } = require("hardhat");

async function interact() {
    try {
        if (!process.env.MARKETPLACE_ADDRESS || !process.env.NFT_ADDRESS) {
            throw new Error("Missing required environment variables: MARKETPLACE_ADDRESS and NFT_ADDRESS");
        }

        const accounts = await ethers.getSigners();
        const owner = accounts[0];
        const buyer = accounts[1];

        const nftMarkeplaceAddress = process.env.MARKETPLACE_ADDRESS;
        const nftMarketplace = await ethers.getContractAt("NftMarketplace", nftMarkeplaceAddress);
        const nftAddress = process.env.NFT_ADDRESS;
        const nft = await ethers.getContractAt("MockERC721", nftAddress);

        async function getAvailableTokenId(nft, startId = 1) {
            let tokenId = startId;
            let exists = true;

            while (exists) {
                try {
                    await nft.ownerOf(tokenId);
                    // If we get here, token exists, try next one
                    tokenId++;
                } catch (error) {
                    // Token doesn't exist, we can use this ID
                    exists = false;
                }
            }

            return tokenId;
        }

        const tokenId = await getAvailableTokenId(nft);
        console.log("Available tokenId:", tokenId);

        const nftPrice = ethers.parseEther("0.01");

        console.log("Minting NFT...");
        const mintTx = await nft.mint(owner.address, tokenId);
        await mintTx.wait(1);
        console.log("Minted!");

        console.log("Approving NFT...");
        const approvalTx = await nft.approve(nftMarkeplaceAddress, tokenId);
        await approvalTx.wait(1);
        console.log("Approved!");

        console.log("Listing NFT...");
        const listTx = await nftMarketplace.listItem(nftAddress, tokenId, nftPrice);
        await listTx.wait(1);
        console.log("Listed");

        console.log("Buying NFT...");
        const buyTx = await nftMarketplace.connect(buyer).buyItem(nftAddress, tokenId, { value: nftPrice });
        await buyTx.wait(1);
        console.log("Item bought!");

        console.log("Withdrawing proceeds...");
        const withdrawTx = await nftMarketplace.withdrawProceeds();
        await withdrawTx.wait(1);
        console.log("Proceeds withdrawn");

        console.log("________________________");
        console.log("All transactions completed successfully");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

interact();
