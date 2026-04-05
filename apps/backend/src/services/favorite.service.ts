import { favoriteRepository } from "../repositories/favorite.repository";
import { listingRepository } from "../repositories/listing.repository";
import { ListingNotFoundError, FavoriteAlreadyExistsError } from "../errors";

export const favoriteService = {
  async add(db: D1Database, userId: string, listingId: string): Promise<void> {
    const listing = await listingRepository.findById(db, listingId);
    if (!listing) throw new ListingNotFoundError();

    const exists = await favoriteRepository.exists(db, userId, listingId);
    if (exists) throw new FavoriteAlreadyExistsError();

    await favoriteRepository.add(db, userId, listingId);
  },

  async remove(db: D1Database, userId: string, listingId: string): Promise<void> {
    await favoriteRepository.remove(db, userId, listingId);
  },

  async getListingIds(db: D1Database, userId: string): Promise<string[]> {
    return favoriteRepository.findListingIdsByUserId(db, userId);
  },
} as const;
