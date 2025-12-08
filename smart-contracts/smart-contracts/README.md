# NFT Marketplace

This marketplace allows users to list, buy, sell, and manage NFT listings with secure payment handling.

## Features

- ✅ List NFTs for sale with custom pricing
- ✅ Buy listed NFTs with ETH
- ✅ Update listing prices
- ✅ Cancel listings
- ✅ Withdraw sales proceeds
- ✅ Reentrancy protection
- ✅ Comprehensive test coverage (Unit + Staging)

## Smart Contract Architecture

### NftMarketplace.sol

The main marketplace contract with the following functions:

- `listItem()` - List an NFT for sale
- `buyItem()` - Purchase a listed NFT
- `updateListing()` - Update the price of a listing
- `cancelListing()` - Remove a listing from the marketplace
- `withdrawProceeds()` - Withdraw accumulated sales proceeds
- `getListing()` - View listing details
- `getProceeds()` - View seller's accumulated proceeds

### Key Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks on critical functions
- **Pull Payment Pattern**: Sellers withdraw their own proceeds rather than automatic transfers
- **Ownership Validation**: Only NFT owners can list/update/cancel their listings
- **Approval Check**: Ensures marketplace has permission to transfer NFTs

## Project Structure

hardhat-marketplace/
├── contracts/
│   ├── NftMarketplace.sol
│   └── test/
│       └── MockERC721.sol
├── ignition/
│   └── modules/
│       └── NftMarketplaceModule.js
├── test/
│   ├── unit/
│   │   └── nftMarketUnitTest.js
│   └── staging/
│       └── nftMarketStagingTest.js
├── hardhat.config.js
├── package.json
└── README.md

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- Ethereum wallet with testnet ETH (for Sepolia deployment)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ndubuisi-ugwuja/nft-marketplace-contract.git
cd nft-marketplace-contract
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env` file in the root directory:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
PRIVATE_KEY_BUYER=second_account_private_key (optional, for testing)
ETHERSCAN_API_KEY=your_etherscan_api_key
MARKETPLACE_ADDRESS=deployed_marketplace_address (after deployment)
NFT_ADDRESS=deployed_nft_address (after deployment)
```

## Usage

### Compile Contracts

```bash
yarn hardhat compile
```

### Deploy to localhost

```bash
yarn hardhat ignition deploy ./ignition/modules/NftMarketplaceModule.js
```

### Deploy to Sepolia

```bash
yarn hardhat ignition deploy ./ignition/modules/NftMarketplaceModule.js --network sepolia
```

### Verify Contracts on Etherscan

```bash
yarn hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Run Tests

**Unit Tests (Local):**

```bash
yarn hardhat test
```

**Staging Tests (Sepolia):**

```bash
yarn hardhat test --network sepolia
```

**Test Coverage:**

```bash
yarn hardhat coverage
```

## Contract Interaction Examples

### List an NFT

```javascript
// Approve marketplace
await nft.approve(marketplaceAddress, tokenId);

// List NFT
await marketplace.listItem(nftAddress, tokenId, priceInWei);
```

### Buy an NFT

```javascript
await marketplace.buyItem(nftAddress, tokenId, { value: priceInWei });
```

### Update Listing Price

```javascript
await marketplace.updateListing(nftAddress, tokenId, newPriceInWei);
```

### Cancel Listing

```javascript
await marketplace.cancelListing(nftAddress, tokenId);
```

### Withdraw Proceeds

```javascript
await marketplace.withdrawProceeds();
```

## Testing

The project includes comprehensive test suites:

### Unit Tests

Located in `test/unit/NftMarketplace.test.js`

- ✅ Deployment tests
- ✅ List item functionality (all edge cases)
- ✅ Buy item functionality (all edge cases)
- ✅ Update listing functionality
- ✅ Cancel listing functionality
- ✅ Withdraw proceeds functionality
- ✅ View functions
- ✅ Error handling

### Staging Tests

Located in `test/staging/nftMarketStagingTest.js`

- ✅ Full marketplace flow (list → buy → withdraw)
- ✅ Listing and cancellation flow
- ✅ Update listing flow
- ✅ Error cases on live network
- ✅ Gas usage tracking
- ✅ Idempotent (can run multiple times)

## Gas Optimization

The contract implements several gas optimizations:

- Uses `delete` instead of setting to 0
- Minimal storage updates
- Efficient modifier usage
- Pull payment pattern to reduce gas costs

## Security Considerations

- ✅ **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- ✅ **Access Control**: Validates NFT ownership before actions
- ✅ **Price Validation**: Ensures prices are greater than zero
- ✅ **Approval Checks**: Verifies marketplace approval before listing
- ✅ **Pull Over Push**: Sellers withdraw their own funds
- ⚠️ **Note**: Sellers can unapprove the marketplace after listing, causing buy to fail

## Common Issues & Solutions

### Issue: "NotApprovedForMarketplace" Error

**Solution**: Approve the marketplace before listing:

```javascript
await nft.approve(marketplaceAddress, tokenId);
```

### Issue: "AlreadyListed" Error

**Solution**: Cancel the existing listing first:

```javascript
await marketplace.cancelListing(nftAddress, tokenId);
```

### Issue: "PriceNotMet" Error

**Solution**: Send the exact listing price when buying:

```javascript
await marketplace.buyItem(nftAddress, tokenId, { value: exactPrice });
```

### Issue: Staging Tests Fail

**Solution**: Ensure you have:

- Testnet ETH in your accounts
- Correct contract addresses in `.env`
- NFTs minted to the seller account

## Deployment Addresses

### Sepolia Testnet

- **Marketplace**: `0x9b1de83D8fd209573e48544D8e2E393c974003Ee`
- **MockNFT**: `0x6F38f080e0CE95D277e24b1FCd23Dd6788B7aA62`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED License.

## Tech Stack

- **Solidity** ^0.8.28
- **Hardhat** - Development environment
- **OpenZeppelin** - Smart contract libraries
- **Ethers.js** v6 - Ethereum library
- **Chai** - Testing framework
- **Hardhat Ignition** - Deployment system

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

## Author

Ndubuisi Ugwuja

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat team for excellent development tools
- Ethereum community for continuous innovation

---
