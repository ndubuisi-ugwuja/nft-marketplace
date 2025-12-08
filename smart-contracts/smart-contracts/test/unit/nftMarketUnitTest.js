const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const developmentChains = ["hardhat", "localhost"];

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketplace", function () {
          async function deployMarketplaceFixture() {
              const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

              // Deploy a mock NFT contract
              const MockNFT = await ethers.getContractFactory("MockERC721");
              const nft = await MockNFT.deploy();

              // Deploy the marketplace
              const NftMarketplace = await ethers.getContractFactory("NftMarketplace");
              const marketplace = await NftMarketplace.deploy();

              // Mint some NFTs to the seller
              await nft.mint(seller.address, 1);
              await nft.mint(seller.address, 2);
              await nft.mint(seller.address, 3);

              const PRICE = ethers.parseEther("1");
              const TOKEN_ID = 1;

              return { marketplace, nft, owner, seller, buyer, otherAccount, PRICE, TOKEN_ID };
          }

          describe("Deployment", function () {
              it("Should deploy successfully", async function () {
                  const { marketplace } = await loadFixture(deployMarketplaceFixture);
                  expect(await marketplace.getAddress()).to.be.properAddress;
              });
          });

          describe("listItem", function () {
              it("Should revert if price is zero", async function () {
                  const { marketplace, nft, seller, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);

                  await expect(
                      marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, 0),
                  ).to.be.revertedWithCustomError(marketplace, "PriceMustBeAboveZero");
              });

              it("Should revert if not approved for marketplace", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await expect(
                      marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE),
                  ).to.be.revertedWithCustomError(marketplace, "NotApprovedForMarketplace");
              });

              it("Should revert if caller is not owner", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);

                  await expect(
                      marketplace.connect(buyer).listItem(await nft.getAddress(), TOKEN_ID, PRICE),
                  ).to.be.revertedWithCustomError(marketplace, "NotOwner");
              });

              it("Should revert if item is already listed", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE),
                  ).to.be.revertedWithCustomError(marketplace, "AlreadyListed");
              });

              it("Should list item successfully", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);

                  await expect(marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE))
                      .to.emit(marketplace, "ItemListed")
                      .withArgs(seller.address, await nft.getAddress(), TOKEN_ID, PRICE);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(PRICE);
                  expect(listing.seller).to.equal(seller.address);
              });
          });

          describe("buyItem", function () {
              it("Should revert if item is not listed", async function () {
                  const { marketplace, nft, buyer, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await expect(
                      marketplace.connect(buyer).buyItem(await nft.getAddress(), TOKEN_ID, { value: PRICE }),
                  ).to.be.revertedWithCustomError(marketplace, "NotListed");
              });

              it("Should revert if price is not met", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace
                          .connect(buyer)
                          .buyItem(await nft.getAddress(), TOKEN_ID, { value: ethers.parseEther("0.5") }),
                  ).to.be.revertedWithCustomError(marketplace, "PriceNotMet");
              });

              it("Should revert if buyer is the seller", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace.connect(seller).buyItem(await nft.getAddress(), TOKEN_ID, { value: PRICE }),
                  ).to.be.revertedWithCustomError(marketplace, "CannotBuyOwnItem");
              });

              it("Should buy item successfully", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(marketplace.connect(buyer).buyItem(await nft.getAddress(), TOKEN_ID, { value: PRICE }))
                      .to.emit(marketplace, "ItemBought")
                      .withArgs(buyer.address, await nft.getAddress(), TOKEN_ID, PRICE);

                  expect(await nft.ownerOf(TOKEN_ID)).to.equal(buyer.address);
                  expect(await marketplace.getProceeds(seller.address)).to.equal(PRICE);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(0);
              });
          });

          describe("updateListing", function () {
              it("Should revert if item is not listed", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await expect(
                      marketplace.connect(seller).updateListing(await nft.getAddress(), TOKEN_ID, PRICE),
                  ).to.be.revertedWithCustomError(marketplace, "NotListed");
              });

              it("Should revert if caller is not owner", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace
                          .connect(buyer)
                          .updateListing(await nft.getAddress(), TOKEN_ID, ethers.parseEther("2")),
                  ).to.be.revertedWithCustomError(marketplace, "NotOwner");
              });

              it("Should revert if new price is zero", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace.connect(seller).updateListing(await nft.getAddress(), TOKEN_ID, 0),
                  ).to.be.revertedWithCustomError(marketplace, "PriceMustBeAboveZero");
              });

              it("Should update listing successfully", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  const newPrice = ethers.parseEther("2");
                  await expect(marketplace.connect(seller).updateListing(await nft.getAddress(), TOKEN_ID, newPrice))
                      .to.emit(marketplace, "ItemListed")
                      .withArgs(seller.address, await nft.getAddress(), TOKEN_ID, newPrice);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(newPrice);
              });
          });

          describe("cancelListing", function () {
              it("Should revert if item is not listed", async function () {
                  const { marketplace, nft, seller, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await expect(
                      marketplace.connect(seller).cancelListing(await nft.getAddress(), TOKEN_ID),
                  ).to.be.revertedWithCustomError(marketplace, "NotListed");
              });

              it("Should revert if caller is not owner", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(
                      marketplace.connect(buyer).cancelListing(await nft.getAddress(), TOKEN_ID),
                  ).to.be.revertedWithCustomError(marketplace, "NotOwner");
              });

              it("Should cancel listing successfully", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  await expect(marketplace.connect(seller).cancelListing(await nft.getAddress(), TOKEN_ID))
                      .to.emit(marketplace, "ItemCanceled")
                      .withArgs(seller.address, await nft.getAddress(), TOKEN_ID);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(0);
              });
          });

          describe("withdrawProceeds", function () {
              it("Should revert if no proceeds", async function () {
                  const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

                  await expect(marketplace.connect(seller).withdrawProceeds()).to.be.revertedWithCustomError(
                      marketplace,
                      "NoProceeds",
                  );
              });

              it("Should withdraw proceeds successfully", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);
                  await marketplace.connect(buyer).buyItem(await nft.getAddress(), TOKEN_ID, { value: PRICE });

                  const initialBalance = await ethers.provider.getBalance(seller.address);

                  const tx = await marketplace.connect(seller).withdrawProceeds();
                  const receipt = await tx.wait();
                  const gasUsed = receipt.gasUsed * receipt.gasPrice;

                  await expect(tx).to.emit(marketplace, "ProceedsWithdrawn").withArgs(seller.address, PRICE);

                  const finalBalance = await ethers.provider.getBalance(seller.address);
                  expect(finalBalance).to.equal(initialBalance + PRICE - gasUsed);
                  expect(await marketplace.getProceeds(seller.address)).to.equal(0);
              });

              it("Should handle multiple sales and withdraw all proceeds", async function () {
                  const { marketplace, nft, seller, buyer, PRICE } = await loadFixture(deployMarketplaceFixture);

                  // List and sell multiple items
                  await nft.connect(seller).approve(await marketplace.getAddress(), 1);
                  await nft.connect(seller).approve(await marketplace.getAddress(), 2);

                  await marketplace.connect(seller).listItem(await nft.getAddress(), 1, PRICE);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), 2, PRICE);

                  await marketplace.connect(buyer).buyItem(await nft.getAddress(), 1, { value: PRICE });
                  await marketplace.connect(buyer).buyItem(await nft.getAddress(), 2, { value: PRICE });

                  const totalProceeds = PRICE * 2n;
                  expect(await marketplace.getProceeds(seller.address)).to.equal(totalProceeds);

                  await marketplace.connect(seller).withdrawProceeds();
                  expect(await marketplace.getProceeds(seller.address)).to.equal(0);
              });
          });

          describe("View Functions", function () {
              it("Should return correct listing", async function () {
                  const { marketplace, nft, seller, PRICE, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(PRICE);
                  expect(listing.seller).to.equal(seller.address);
              });

              it("Should return zero for unlisted item", async function () {
                  const { marketplace, nft, TOKEN_ID } = await loadFixture(deployMarketplaceFixture);

                  const listing = await marketplace.getListing(await nft.getAddress(), TOKEN_ID);
                  expect(listing.price).to.equal(0);
                  expect(listing.seller).to.equal(ethers.ZeroAddress);
              });

              it("Should return correct proceeds", async function () {
                  const { marketplace, nft, seller, buyer, PRICE, TOKEN_ID } =
                      await loadFixture(deployMarketplaceFixture);

                  expect(await marketplace.getProceeds(seller.address)).to.equal(0);

                  await nft.connect(seller).approve(await marketplace.getAddress(), TOKEN_ID);
                  await marketplace.connect(seller).listItem(await nft.getAddress(), TOKEN_ID, PRICE);
                  await marketplace.connect(buyer).buyItem(await nft.getAddress(), TOKEN_ID, { value: PRICE });

                  expect(await marketplace.getProceeds(seller.address)).to.equal(PRICE);
              });
          });
      });
