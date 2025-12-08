const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Only run on testnet/mainnet
const developmentChains = ["hardhat", "localhost"];

developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketplace Staging Tests", function () {
          let marketplace, nft, deployer, seller, buyer;
          let marketplaceAddress, nftAddress;
          const PRICE = ethers.parseEther("0.01"); // Small amount for testnet
          const TOKEN_ID = 1;

          before(async function () {
              console.log("Setting up staging tests on network:", network.name);

              // Get signers
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              seller = accounts[0] || deployer; // Use deployer if only one account
              buyer = accounts[1];

              console.log("Deployer address:", deployer.address);
              console.log("Seller address:", seller.address);
              console.log("Buyer address:", buyer.address);

              // Check if contracts are already deployed
              const deployedMarketplaceAddress = process.env.MARKETPLACE_ADDRESS;
              const deployedNftAddress = process.env.NFT_ADDRESS;

              // Handle Marketplace
              if (deployedMarketplaceAddress) {
                  console.log("Using existing Marketplace at:", deployedMarketplaceAddress);
                  marketplaceAddress = deployedMarketplaceAddress;
                  marketplace = await ethers.getContractAt("NftMarketplace", marketplaceAddress);
              } else {
                  console.log("Deploying new Marketplace...");
                  const NftMarketplace = await ethers.getContractFactory("NftMarketplace");
                  marketplace = await NftMarketplace.deploy();
                  await marketplace.waitForDeployment();
                  marketplaceAddress = await marketplace.getAddress();
                  console.log("NftMarketplace deployed to:", marketplaceAddress);
              }

              // Handle NFT - Always deploy if not provided
              if (deployedNftAddress) {
                  console.log("Using existing NFT at:", deployedNftAddress);
                  nftAddress = deployedNftAddress;
                  nft = await ethers.getContractAt("MockERC721", nftAddress);
              } else {
                  console.log("Deploying new MockNFT for testing...");
                  const MockNFT = await ethers.getContractFactory("MockERC721");
                  nft = await MockNFT.deploy();
                  await nft.waitForDeployment();
                  nftAddress = await nft.getAddress();
                  console.log("MockNFT deployed to:", nftAddress);
                  console.log("⚠️  Add this to your .env file: NFT_ADDRESS=" + nftAddress);
              }

              // Ensure NFTs exist for testing
              try {
                  console.log("Checking/Minting test NFTs...");
                  for (let i = 1; i <= 5; i++) {
                      try {
                          // Check if NFT already exists
                          const owner = await nft.ownerOf(i);
                          console.log(`✓ NFT #${i} already exists, owned by ${owner}`);
                      } catch (error) {
                          // NFT doesn't exist, mint it
                          const mintTx = await nft.connect(deployer).mint(seller.address, i);
                          await mintTx.wait(1);
                          console.log(`✓ Minted NFT #${i} to seller`);
                      }
                  }
              } catch (error) {
                  console.log("⚠️  Error with NFTs:", error.message);
              }

              console.log("Setup complete!");
              console.log("-----------------------------------");
          });

          describe("Full Marketplace Flow", function () {
              it("Should complete a full listing, buying, and withdrawal cycle", async function () {
                  console.log("\n--- Starting Full Marketplace Flow Test ---");

                  // Step 1: Verify NFT ownership
                  console.log("\nStep 1: Verifying NFT ownership...");
                  let owner = await nft.ownerOf(TOKEN_ID);
                  console.log("NFT owner:", owner);
                  console.log("Seller address:", seller.address);

                  // If buyer owns it from previous test, skip or transfer back
                  if (owner === buyer.address) {
                      console.log("⚠️  Buyer owns NFT from previous test, transferring back to seller...");
                      const transferTx = await nft.connect(buyer).transferFrom(buyer.address, seller.address, TOKEN_ID);
                      await transferTx.wait(1);
                      owner = await nft.ownerOf(TOKEN_ID);
                      console.log("✓ NFT transferred back to seller");
                  }

                  expect(owner).to.equal(seller.address);
                  console.log("✓ NFT ownership verified");

                  // Check if already listed and cancel if needed
                  const existingListing = await marketplace.getListing(nftAddress, TOKEN_ID);
                  if (existingListing.price > 0) {
                      console.log("⚠️  NFT already listed, cancelling old listing...");
                      const cancelTx = await marketplace.connect(seller).cancelListing(nftAddress, TOKEN_ID);
                      await cancelTx.wait(1);
                      console.log("✓ Old listing cancelled");
                  }

                  // Step 2: Approve marketplace
                  console.log("\nStep 2: Approving marketplace...");
                  const approveTx = await nft.connect(seller).approve(marketplaceAddress, TOKEN_ID);
                  await approveTx.wait(1);
                  console.log("✓ Marketplace approved for NFT");

                  // Step 3: List item
                  console.log("\nStep 3: Listing item...");
                  const listTx = await marketplace.connect(seller).listItem(nftAddress, TOKEN_ID, PRICE);
                  const listReceipt = await listTx.wait(1);
                  console.log("✓ Item listed successfully");
                  console.log("Gas used for listing:", listReceipt.gasUsed.toString());

                  // Verify listing
                  const listing = await marketplace.getListing(nftAddress, TOKEN_ID);
                  expect(listing.price).to.equal(PRICE);
                  expect(listing.seller).to.equal(seller.address);
                  console.log("✓ Listing verified on-chain");
                  console.log("  Price:", ethers.formatEther(listing.price), "ETH");
                  console.log("  Seller:", listing.seller);

                  // Step 4: Buy item
                  console.log("\nStep 4: Buying item...");
                  const buyerInitialBalance = await ethers.provider.getBalance(buyer.address);
                  console.log("Buyer initial balance:", ethers.formatEther(buyerInitialBalance), "ETH");

                  const buyTx = await marketplace.connect(buyer).buyItem(nftAddress, TOKEN_ID, { value: PRICE });
                  const buyReceipt = await buyTx.wait(1);
                  console.log("✓ Item purchased successfully");
                  console.log("Gas used for buying:", buyReceipt.gasUsed.toString());

                  // Verify NFT transfer
                  const newOwner = await nft.ownerOf(TOKEN_ID);
                  expect(newOwner).to.equal(buyer.address);
                  console.log("✓ NFT transferred to buyer:", newOwner);

                  // Verify listing deleted
                  const deletedListing = await marketplace.getListing(nftAddress, TOKEN_ID);
                  expect(deletedListing.price).to.equal(0);
                  console.log("✓ Listing removed from marketplace");

                  // Verify proceeds
                  const proceeds = await marketplace.getProceeds(seller.address);
                  expect(proceeds).to.equal(PRICE);
                  console.log("✓ Proceeds recorded:", ethers.formatEther(proceeds), "ETH");

                  // Step 5: Withdraw proceeds
                  console.log("\nStep 5: Withdrawing proceeds...");
                  const sellerInitialBalance = await ethers.provider.getBalance(seller.address);
                  console.log("Seller initial balance:", ethers.formatEther(sellerInitialBalance), "ETH");

                  const withdrawTx = await marketplace.connect(seller).withdrawProceeds();
                  const withdrawReceipt = await withdrawTx.wait(1);
                  console.log("✓ Proceeds withdrawn successfully");
                  console.log("Gas used for withdrawal:", withdrawReceipt.gasUsed.toString());

                  // Verify balance change
                  const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
                  const gasUsed = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;
                  const expectedBalance = sellerInitialBalance + PRICE - gasUsed;

                  console.log("Seller final balance:", ethers.formatEther(sellerFinalBalance), "ETH");
                  console.log("Gas cost:", ethers.formatEther(gasUsed), "ETH");
                  expect(sellerFinalBalance).to.equal(expectedBalance);
                  console.log("✓ Seller balance updated correctly");

                  // Verify proceeds cleared
                  const finalProceeds = await marketplace.getProceeds(seller.address);
                  expect(finalProceeds).to.equal(0);
                  console.log("✓ Proceeds cleared from marketplace");

                  console.log("\n--- Full Marketplace Flow Test Complete ---\n");
              });
          });

          describe("Listing and Cancellation Flow", function () {
              const TOKEN_ID_2 = 4; // Use token 4 instead of 2

              it("Should list and cancel an item", async function () {
                  console.log("\n--- Starting List and Cancel Flow Test ---");

                  // Check if NFT exists and is owned by seller
                  let owner;
                  try {
                      owner = await nft.ownerOf(TOKEN_ID_2);
                      if (owner !== seller.address) {
                          console.log(`⚠️  NFT #${TOKEN_ID_2} owned by ${owner}, transferring to seller...`);
                          // If owned by someone else in test, we might need to skip or handle differently
                          console.log("⚠️  Skipping this test - NFT not owned by seller");
                          this.skip();
                          return;
                      }
                  } catch (error) {
                      console.log(`⚠️  NFT #${TOKEN_ID_2} doesn't exist, minting...`);
                      const mintTx = await nft.connect(deployer).mint(seller.address, TOKEN_ID_2);
                      await mintTx.wait(1);
                      console.log(`✓ Minted NFT #${TOKEN_ID_2}`);
                  }

                  // Check if already listed and cancel if needed
                  const existingListing = await marketplace.getListing(nftAddress, TOKEN_ID_2);
                  if (existingListing.price > 0) {
                      console.log("⚠️  NFT already listed, cancelling first...");
                      const cancelTx = await marketplace.connect(seller).cancelListing(nftAddress, TOKEN_ID_2);
                      await cancelTx.wait(1);
                  }

                  // Approve and list
                  console.log("\nApproving and listing NFT...");
                  const approveTx = await nft.connect(seller).approve(marketplaceAddress, TOKEN_ID_2);
                  await approveTx.wait(1);

                  const listTx = await marketplace.connect(seller).listItem(nftAddress, TOKEN_ID_2, PRICE);
                  await listTx.wait(1);
                  console.log("✓ NFT listed");

                  // Verify listing
                  let listing = await marketplace.getListing(nftAddress, TOKEN_ID_2);
                  expect(listing.price).to.equal(PRICE);
                  console.log("✓ Listing verified");

                  // Cancel listing
                  console.log("\nCancelling listing...");
                  const cancelTx = await marketplace.connect(seller).cancelListing(nftAddress, TOKEN_ID_2);
                  const cancelReceipt = await cancelTx.wait(1);
                  console.log("✓ Listing cancelled");
                  console.log("Gas used for cancellation:", cancelReceipt.gasUsed.toString());

                  // Verify cancellation
                  listing = await marketplace.getListing(nftAddress, TOKEN_ID_2);
                  expect(listing.price).to.equal(0);
                  console.log("✓ Listing removed from marketplace");

                  // Verify seller still owns NFT
                  owner = await nft.ownerOf(TOKEN_ID_2);
                  expect(owner).to.equal(seller.address);
                  console.log("✓ Seller still owns NFT");

                  console.log("\n--- List and Cancel Flow Test Complete ---\n");
              });
          });

          describe("Update Listing Flow", function () {
              const TOKEN_ID_3 = 5; // Use token 5 instead of 3
              const NEW_PRICE = ethers.parseEther("0.02");

              it("Should list and update the price of an item", async function () {
                  console.log("\n--- Starting Update Listing Flow Test ---");

                  // Check if NFT exists and is owned by seller
                  let owner;
                  try {
                      owner = await nft.ownerOf(TOKEN_ID_3);
                      if (owner !== seller.address) {
                          console.log(`⚠️  NFT #${TOKEN_ID_3} owned by ${owner}, transferring to seller...`);
                          console.log("⚠️  Skipping this test - NFT not owned by seller");
                          this.skip();
                          return;
                      }
                  } catch (error) {
                      console.log(`⚠️  NFT #${TOKEN_ID_3} doesn't exist, minting...`);
                      const mintTx = await nft.connect(deployer).mint(seller.address, TOKEN_ID_3);
                      await mintTx.wait(1);
                      console.log(`✓ Minted NFT #${TOKEN_ID_3}`);
                  }

                  // Check if already listed and cancel if needed
                  const existingListing = await marketplace.getListing(nftAddress, TOKEN_ID_3);
                  if (existingListing.price > 0) {
                      console.log("⚠️  NFT already listed, cancelling first...");
                      const cancelTx = await marketplace.connect(seller).cancelListing(nftAddress, TOKEN_ID_3);
                      await cancelTx.wait(1);
                  }

                  // Approve and list
                  console.log("\nApproving and listing NFT...");
                  const approveTx = await nft.connect(seller).approve(marketplaceAddress, TOKEN_ID_3);
                  await approveTx.wait(1);

                  const listTx = await marketplace.connect(seller).listItem(nftAddress, TOKEN_ID_3, PRICE);
                  await listTx.wait(1);
                  console.log("✓ NFT listed at", ethers.formatEther(PRICE), "ETH");

                  // Verify initial listing
                  let listing = await marketplace.getListing(nftAddress, TOKEN_ID_3);
                  expect(listing.price).to.equal(PRICE);
                  console.log("✓ Initial listing verified");

                  // Update price
                  console.log("\nUpdating listing price...");
                  const updateTx = await marketplace.connect(seller).updateListing(nftAddress, TOKEN_ID_3, NEW_PRICE);
                  const updateReceipt = await updateTx.wait(1);
                  console.log("✓ Price updated to", ethers.formatEther(NEW_PRICE), "ETH");
                  console.log("Gas used for update:", updateReceipt.gasUsed.toString());

                  // Verify updated listing
                  listing = await marketplace.getListing(nftAddress, TOKEN_ID_3);
                  expect(listing.price).to.equal(NEW_PRICE);
                  expect(listing.seller).to.equal(seller.address);
                  console.log("✓ Updated listing verified");

                  // Clean up - cancel listing
                  const cancelTx = await marketplace.connect(seller).cancelListing(nftAddress, TOKEN_ID_3);
                  await cancelTx.wait(1);
                  console.log("✓ Listing cancelled for cleanup");

                  console.log("\n--- Update Listing Flow Test Complete ---\n");
              });
          });

          describe("Error Cases", function () {
              it("Should fail to buy unlisted item", async function () {
                  const UNLISTED_TOKEN_ID = 999;

                  await expect(
                      marketplace.connect(buyer).buyItem(nftAddress, UNLISTED_TOKEN_ID, { value: PRICE }),
                  ).to.be.revertedWithCustomError(marketplace, "NotListed");

                  console.log("✓ Correctly reverted when buying unlisted item");
              });

              it("Should fail to withdraw with no proceeds", async function () {
                  // Check if buyer has any proceeds (should be 0 since they haven't sold anything)
                  const buyerProceeds = await marketplace.getProceeds(buyer.address);
                  console.log("Buyer proceeds:", ethers.formatEther(buyerProceeds), "ETH");

                  if (buyerProceeds === 0n) {
                      await expect(marketplace.connect(buyer).withdrawProceeds()).to.be.revertedWithCustomError(
                          marketplace,
                          "NoProceeds",
                      );
                      console.log("✓ Correctly reverted when withdrawing with no proceeds");
                  } else {
                      console.log("⚠️  Buyer has proceeds, skipping this test");
                      this.skip();
                  }
              });
          });

          after(async function () {
              console.log("\n===========================================");
              console.log("Staging Tests Complete!");
              console.log("Network:", network.name);
              console.log("Marketplace Address:", marketplaceAddress);
              console.log("NFT Address:", nftAddress);
              console.log("===========================================\n");
          });
      });
