import type {
  ListingDetail,
  ListingListItem,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  ListingsQueryParams,
  PaginatedResponse,
} from "@rafimdan/shared";
import type { Env } from "../types/env";
import { listingRepository } from "../repositories/listing.repository";
import { categoryRepository } from "../repositories/category.repository";
import { userRepository } from "../repositories/user.repository";
import { generateSlug, findUniqueSlug } from "../lib/slug";
import {
  ListingNotFoundError,
  ForbiddenError,
  CategoryNotFoundError,
  FileTooLargeError,
  InvalidFileTypeError,
  TooManyPhotosError,
} from "../errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function validateImageMagicBytes(file: File): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WebP: RIFF????WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;
  return false;
}

export const listingService = {
  async create(
    db: D1Database,
    userId: string,
    input: CreateListingInput,
  ): Promise<ListingDetail> {
    const category = await categoryRepository.findById(db, input.category_id);
    if (!category) throw new CategoryNotFoundError();

    const slug = await findUniqueSlug(db, "listings", generateSlug(input.title));

    return listingRepository.create(db, {
      id: crypto.randomUUID(),
      user_id: userId,
      slug,
      ...input,
    });
  },

  async getAll(
    db: D1Database,
    params: ListingsQueryParams,
  ): Promise<PaginatedResponse<ListingListItem>> {
    return listingRepository.findAll(db, params);
  },

  async getBySlug(db: D1Database, slug: string): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    await listingRepository.incrementViewCount(db, listing.id);
    return { ...listing, view_count: listing.view_count + 1 };
  },

  async update(
    db: D1Database,
    userId: string,
    slug: string,
    input: UpdateListingInput,
  ): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    if (input.category_id) {
      const category = await categoryRepository.findById(db, input.category_id);
      if (!category) throw new CategoryNotFoundError();
    }

    const updated = await listingRepository.update(db, listing.id, input);
    return updated!;
  },

  async updateStatus(
    db: D1Database,
    userId: string,
    slug: string,
    status: ListingStatus,
  ): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    const updated = await listingRepository.updateStatus(db, listing.id, status);
    return updated!;
  },

  async delete(db: D1Database, env: Env, userId: string, slug: string): Promise<void> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    await Promise.allSettled(
      listing.photos.map((url) => {
        const key = url.replace(/^.*\/api\/storage\//, "");
        return env.STORAGE.delete(key);
      }),
    );

    await listingRepository.delete(db, listing.id);
  },

  async getStatsByUserId(db: D1Database, userId: string) {
    return listingRepository.getStatsByUserId(db, userId);
  },

  async uploadPhoto(
    db: D1Database,
    env: Env,
    userId: string,
    slug: string,
    file: File,
  ): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    if (listing.photos.length >= listingRepository.MAX_PHOTOS) throw new TooManyPhotosError();
    if (file.size > MAX_FILE_SIZE) throw new FileTooLargeError();
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) throw new InvalidFileTypeError();
    if (!(await validateImageMagicBytes(file))) throw new InvalidFileTypeError();

    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const key = `listings/${listing.id}/${crypto.randomUUID()}.${ext}`;

    await env.STORAGE.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    const bucketUrl = env.STORAGE_PUBLIC_URL || "/api/storage";
    const photoUrl = `${bucketUrl}/${key}`;
    const photos = [...listing.photos, photoUrl];

    await listingRepository.updatePhotos(db, listing.id, photos);

    return { ...listing, photos };
  },

  async deletePhoto(
    db: D1Database,
    env: Env,
    userId: string,
    slug: string,
    index: number,
  ): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    if (index < 0 || index >= listing.photos.length) {
      throw new ListingNotFoundError();
    }

    const photoUrl = listing.photos[index]!;
    const key = photoUrl.replace(/^.*\/api\/storage\//, "");
    await env.STORAGE.delete(key);

    const photos = listing.photos.filter((_, i) => i !== index);
    await listingRepository.updatePhotos(db, listing.id, photos);
    return { ...listing, photos };
  },

  async getByUser(db: D1Database, slug: string): Promise<ListingListItem[]> {
    const user = await userRepository.findBySlug(db, slug);
    if (!user) return [];
    return listingRepository.findByUserId(db, user.id, "active");
  },
} as const;
