# Decentralized NFT Marketplace

A fully functional NFT marketplace built on Ethereum where users can mint, buy, sell, and trade NFTs in a trustless and decentralized manner.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Smart Contracts](#-smart-contracts)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Subgraph Deployment](#-subgraph-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This NFT marketplace is a decentralized application (dApp) that enables users to:

- List their NFTs for sale with custom pricing
- Browse and purchase NFTs from other users
- Update listing prices dynamically
- Cancel active listings
- Withdraw proceeds from completed sales
- View real-time marketplace statistics

The platform leverages **The Graph Protocol** for efficient blockchain data indexing, ensuring fast queries and real-time updates without the need for a centralized database.

---

## ✨ Features

### Core Functionality

- ✅ **List NFTs**: Users can list their ERC-721 NFTs for sale at custom prices
- ✅ **Buy NFTs**: Purchase listed NFTs instantly with MetaMask
- ✅ **Update Listings**: Dynamically change the price of active listings
- ✅ **Cancel Listings**: Remove NFTs from the marketplace at any time
- ✅ **Withdraw Proceeds**: Sellers can withdraw their earnings securely
- ✅ **Real-time Updates**: Instant marketplace updates powered by The Graph

### User Experience

- 🎨 **Modern UI**: Clean, responsive design built with Tailwind CSS
- 🔐 **Wallet Integration**: Seamless connection with RainbowKit (MetaMask, WalletConnect, etc.)
- 📱 **Mobile Responsive**: Fully optimized for mobile and tablet devices
- 🖼️ **IPFS Integration**: NFT images and metadata hosted on IPFS via Pinata
- 🔔 **Toast Notifications**: Real-time feedback for all transactions
- ⚡ **Fast Loading**: Optimized queries and efficient data fetching

### Technical Features

- 🔗 **Blockchain Events**: Smart contract events indexed by The Graph
- 🔍 **GraphQL API**: Fast and flexible data queries
- 🔄 **Auto-refresh**: Marketplace data updates automatically
- 🛡️ **Security**: Reentrancy protection and secure contract patterns

---

## 🛠️ Tech Stack

### Frontend

- **[Next.js 16.0.7](https://nextjs.org/)** - React framework for production
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[RainbowKit](https://www.rainbowkit.com/)** - Wallet connection UI
- **[Wagmi](https://wagmi.sh/)** - React Hooks for Ethereum
- **[Viem](https://viem.sh/)** - TypeScript Ethereum library
- **[React Hot Toast](https://react-hot-toast.com/)** - Toast notifications

### Blockchain & Web3

- **[Solidity ^0.8.28](https://soliditylang.org/)** - Smart contract language
- **[Hardhat](https://hardhat.org/)** - Ethereum development environment
- **[OpenZeppelin](https://www.openzeppelin.com/)** - Secure smart contract library
- **[Ethers.js](https://docs.ethers.org/v5/)** - Ethereum library
- **[Sepolia Testnet](https://sepolia.etherscan.io/)** - Ethereum test network

### Blockchain Indexing

- **[The Graph Protocol](https://thegraph.com/)** - Decentralized indexing protocol
- **[GraphQL](https://graphql.org/)** - Query language for APIs
- **[AssemblyScript](https://www.assemblyscript.org/)** - TypeScript-like language for subgraphs

### Data & APIs

- **[Alchemy](https://www.alchemy.com/)** - Blockchain API and node provider
- **[IPFS](https://ipfs.tech/)** - Decentralized file storage
- **[Pinata](https://www.pinata.cloud/)** - IPFS gateway and pinning service
- **[Axios](https://axios-http.com/)** - HTTP client

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Git](https://git-scm.com/)** - Version control

---

### Data Flow

1. **User Lists NFT**: Frontend → Smart Contract → Emits `ItemListed` event
2. **Event Indexing**: The Graph listens to events → Indexes to subgraph
3. **Display Marketplace**: Frontend queries subgraph → Fetches NFT metadata from Alchemy → Displays on UI
4. **User Buys NFT**: Frontend → Smart Contract → Emits `ItemBought` event
5. **Real-time Update**: The Graph indexes event → UI refreshes automatically

---

## 📜 Smart Contracts

### NftMarketplace.sol

**Contract Address (Sepolia)**: `0x9b1de83D8fd209573e48544D8e2E393c974003Ee`

#### Key Functions

```solidity
function listItem(address nftAddress, uint256 tokenId, uint256 price) external
function buyItem(address nftAddress, uint256 tokenId) external payable
function cancelListing(address nftAddress, uint256 tokenId) external
function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external
function withdrawProceeds() external
function getListing(address nftAddress, uint256 tokenId) external view returns (uint256, address)
function getProceeds(address seller) external view returns (uint256)
```

#### Events

```solidity
event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)
event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price)
event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId)
event ProceedsWithdrawn(address indexed seller, uint256 amount)
```

#### Security Features

- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Pull over Push**: Sellers withdraw proceeds (not automatic transfers)
- ✅ **Access Control**: Only NFT owners can list/cancel their NFTs
- ✅ **Price Validation**: Prevents zero-price listings
- ✅ **Approval Check**: Ensures marketplace can transfer NFTs

---

### Smart Contract Deployment

If you want to deploy your own marketplace contract:

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

Update `NEXT_PUBLIC_MARKETPLACE_ADDRESS` with your deployed contract address.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **MetaMask** browser extension
- **Sepolia ETH** (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- **Alchemy Account** (for API key)
- **WalletConnect Project ID** (from [WalletConnect Cloud](https://cloud.walletconnect.com/))

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ndubuisi-ugwuja/nft-marketplace.git cd nft-marketplace
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Alchemy
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Smart Contract
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x9b1de83D8fd209573e48544D8e2E393c974003Ee

# Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# The Graph
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/xxxxx/nft-marketplace/v0.0.1
```

### 4. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Alchemy Setup

1. Create account at [Alchemy](https://www.alchemy.com/)
2. Create new app on Sepolia network
3. Copy API key to `.env.local`

### WalletConnect Setup

1. Create account at [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create new project
3. Copy Project ID to `.env.local`

---

## 🎮 Usage

### For NFT Sellers

1. **Connect Wallet**: Click "Connect Wallet" and select MetaMask
2. **View Your NFTs**: Navigate to "My NFTs" page
3. **List NFT**: Click "Sell This NFT" on any NFT you own
4. **Set Price**: Enter price in ETH and approve the transaction
5. **List for Sale**: Confirm listing transaction
6. **Manage Listings**: Go to "My Listings" to update or cancel

### For NFT Buyers

1. **Connect Wallet**: Click "Connect Wallet"
2. **Browse Marketplace**: View all listed NFTs on homepage
3. **Buy NFT**: Click "Buy Now" on any listing
4. **Confirm Transaction**: Approve the purchase in MetaMask
5. **View Purchase**: Check "My NFTs" for your new NFT

### Withdraw Proceeds

1. Navigate to "My Listings"
2. If you have sales proceeds, you'll see a "Withdraw" card
3. Click "Withdraw Now"
4. Confirm transaction in MetaMask

---

## 📊 Subgraph Deployment

### Initial Setup

```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Create subgraph directory
cd marketplace-subgraph

# Generate code
graph codegen

# Build subgraph
graph build
```

### Deploy to The Graph Studio

```bash
# Authenticate
graph auth YOUR_DEPLOY_KEY

# Deploy
graph deploy nft-marketplace
```

### Query Examples

Get All Active Listings:

```graphql
{
    listings(where: { active: true }, orderBy: timestamp, orderDirection: desc) {
        id
        nftContract
        tokenId
        price
        seller
        timestamp
    }
}
```

Get User's Listings:

```graphql
{
    listings(where: { seller: "0x...", active: true }) {
        id
        nftContract
        tokenId
        price
        timestamp
    }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [OpenZeppelin](https://www.openzeppelin.com/) - Secure smart contract library
- [The Graph](https://thegraph.com/) - Blockchain indexing protocol
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection UI
- [Alchemy](https://www.alchemy.com/) - Blockchain infrastructure
- [Thirdweb](https://thirdweb.com/) - NFT deployment tools

---

## Author

Ndubuisi Ugwuja

---

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

## 📈 Roadmap

- [ ] Add support for ERC-1155 tokens
- [ ] Implement auction functionality
- [ ] Add collection pages
- [ ] Integrate ENS names
- [ ] Add activity feed
- [ ] Implement offer system
- [ ] Add multiple blockchain support
- [ ] Create mobile app

---
