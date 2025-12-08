const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("NftMarketplaceModule", (m) => {
    // Deploy the NFT Marketplace
    const nftMarketplace = m.contract("NftMarketplace");

    // Deploy the Mock NFT contract for testing
    const mockNFT = m.contract("MockERC721");

    return { nftMarketplace, mockNFT };
});
