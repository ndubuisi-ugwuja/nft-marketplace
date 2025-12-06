import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ItemListed, ItemBought, ItemCanceled } from "../generated/NftMarketplace/NftMarketplace";
import { Listing, ItemListedEvent, ItemBoughtEvent, ItemCanceledEvent } from "../generated/schema";

export function handleItemListed(event: ItemListed): void {
    // Create unique ID from contract address and token ID
    let id = event.params.nftAddress.toHexString() + "-" + event.params.tokenId.toString();

    // Create or update listing
    let listing = Listing.load(id);
    if (!listing) {
        listing = new Listing(id);
    }

    listing.nftContract = event.params.nftAddress;
    listing.tokenId = event.params.tokenId;
    listing.price = event.params.price;
    listing.seller = event.params.seller;
    listing.active = true;
    listing.timestamp = event.block.timestamp;
    listing.blockNumber = event.block.number;
    listing.save();

    // Create event entity
    let eventEntity = new ItemListedEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    eventEntity.seller = event.params.seller;
    eventEntity.nftAddress = event.params.nftAddress;
    eventEntity.tokenId = event.params.tokenId;
    eventEntity.price = event.params.price;
    eventEntity.timestamp = event.block.timestamp;
    eventEntity.blockNumber = event.block.number;
    eventEntity.save();
}

export function handleItemBought(event: ItemBought): void {
    let id = event.params.nftAddress.toHexString() + "-" + event.params.tokenId.toString();

    let listing = Listing.load(id);
    if (listing) {
        listing.active = false;
        listing.buyer = event.params.buyer;
        listing.save();
    }

    // Create event entity
    let eventEntity = new ItemBoughtEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    eventEntity.buyer = event.params.buyer;
    eventEntity.nftAddress = event.params.nftAddress;
    eventEntity.tokenId = event.params.tokenId;
    eventEntity.price = event.params.price;
    eventEntity.timestamp = event.block.timestamp;
    eventEntity.blockNumber = event.block.number;
    eventEntity.save();
}

export function handleItemCanceled(event: ItemCanceled): void {
    let id = event.params.nftAddress.toHexString() + "-" + event.params.tokenId.toString();

    let listing = Listing.load(id);
    if (listing) {
        listing.active = false;
        listing.save();
    }

    // Create event entity
    let eventEntity = new ItemCanceledEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    eventEntity.seller = event.params.seller;
    eventEntity.nftAddress = event.params.nftAddress;
    eventEntity.tokenId = event.params.tokenId;
    eventEntity.timestamp = event.block.timestamp;
    eventEntity.blockNumber = event.block.number;
    eventEntity.save();
}
