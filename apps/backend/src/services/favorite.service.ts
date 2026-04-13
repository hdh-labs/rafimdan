import type { ListingListItem } from "@rafimdan/shared";
import { favoriteRepository } from "../repositories/favorite.repository";
import { listingRepository } from "../repositories/listing.repository";
import { ListingNotFoundError, FavoriteAlreadyExistsError } from "../errors";

export const favoriteService = {
  async add(db: D1Database, userId: string, listingId: string): Promise<void> {
    const listing = await listingRepository.findById(db, listingId);
    if (!listing || listing.status !== "active") throw new ListingNotFoundError();

    const exists = await favoriteRepository.exists(db, userId, listingId);
    if (exists) throw new FavoriteAlreadyExistsError();

    await favoriteRepository.add(db, userId, listingId);
  },

  async remove(db: D1Database, userId: string, listingId: string): Promise<void> {
    await favoriteRepository.remove(db, userId, listingId);
  },

  async getListings(db: D1Database, userId: string): Promise<ListingListItem[]> {
    const ids = await favoriteRepository.findListingIdsByUserId(db, userId);
    return listingRepository.findByIds(db, ids);
  },
} as const;
