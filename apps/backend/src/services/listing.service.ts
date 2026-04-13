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
import { extractStorageKey } from "../lib/storage";
import { validateImageMagicBytes, getImageExtension } from "../lib/image-validation";
import {
  ListingNotFoundError,
  ForbiddenError,
  CategoryNotFoundError,
  FileTooLargeError,
  InvalidFileTypeError,
  TooManyPhotosError,
  NoWhatsappError,
} from "../errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const listingService = {
  async create(
    db: D1Database,
    env: Env,
    userId: string,
    input: CreateListingInput,
    tempPhotoKeys?: string[],
  ): Promise<ListingDetail> {
    const user = await userRepository.findById(db, userId);
    if (!user?.whatsapp) throw new NoWhatsappError();

    const category = await categoryRepository.findById(db, input.category_id);
    if (!category) throw new CategoryNotFoundError();

    const slug = await findUniqueSlug(db, "listings", generateSlug(input.title));
    const id = crypto.randomUUID();

    const listing = await listingRepository.create(db, {
      id,
      user_id: userId,
      slug,
      ...input,
    });

    if (!tempPhotoKeys?.length) return listing;

    const bucketUrl = env.STORAGE_PUBLIC_URL || "/api/storage";
    const photoResults = await Promise.allSettled(
      tempPhotoKeys.map(async (key) => {
        if (!key.startsWith(`temp/${userId}/`)) return null;
        const obj = await env.STORAGE.get(key);
        if (!obj) return null;
        const ext = key.split(".").pop() ?? "jpg";
        const newKey = `listings/${id}/${crypto.randomUUID()}.${ext}`;
        await env.STORAGE.put(newKey, obj.body, {
          httpMetadata: { contentType: obj.httpMetadata?.contentType ?? "image/jpeg" },
        });
        await env.STORAGE.delete(key);
        return `${bucketUrl}/${newKey}`;
      }),
    );

    const photos = photoResults
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
      .map(r => r.value)
      .filter((v): v is string => v !== null);

    if (photos.length > 0) {
      await listingRepository.updatePhotos(db, id, photos);
      return { ...listing, photos };
    }

    return listing;
  },

  async getAll(
    db: D1Database,
    params: ListingsQueryParams,
  ): Promise<PaginatedResponse<ListingListItem>> {
    return listingRepository.findAll(db, params);
  },

  async getBySlug(db: D1Database, slug: string, viewerId?: string): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    const isOwner = viewerId !== undefined && listing.seller.id === viewerId;
    if (!isOwner && (listing.status === "pending" || listing.status === "rejected")) {
      throw new ListingNotFoundError();
    }
    if (!isOwner && listing.status === "active") {
      await listingRepository.incrementViewCount(db, listing.id);
      return { ...listing, view_count: listing.view_count + 1 };
    }
    return listing;
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

    const wasRejected = listing.status === "rejected";
    const updated = await listingRepository.update(db, listing.id, input);
    if (wasRejected) {
      return (await listingRepository.moderate(db, listing.id, "pending", null))!;
    }
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

    const ALLOWED_TRANSITIONS: Partial<Record<ListingStatus, ListingStatus[]>> = {
      active: ["sold"],
      sold:   ["active"],
    };
    if (!ALLOWED_TRANSITIONS[listing.status]?.includes(status)) {
      throw new ForbiddenError("Bu durum geçişine izin verilmiyor");
    }

    const updated = await listingRepository.updateStatus(db, listing.id, status);
    return updated!;
  },

  async delete(db: D1Database, env: Env, userId: string, slug: string): Promise<void> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    const bucketBaseUrl = env.STORAGE_PUBLIC_URL || "/api/storage";
    await Promise.allSettled(
      listing.photos.map((url) => {
        const key = extractStorageKey(url, bucketBaseUrl);
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

    const ext = getImageExtension(file.type);
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
    const key = extractStorageKey(photoUrl, env.STORAGE_PUBLIC_URL || "/api/storage");
    await env.STORAGE.delete(key);

    const photos = listing.photos.filter((_, i) => i !== index);
    await listingRepository.updatePhotos(db, listing.id, photos);
    return { ...listing, photos };
  },

  async getMine(db: D1Database, userId: string): Promise<ListingListItem[]> {
    return listingRepository.findByUserId(db, userId);
  },

  async refresh(db: D1Database, userId: string, slug: string): Promise<void> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");
    if (listing.status !== "active") throw new ForbiddenError("Sadece aktif ilanlar yenilenebilir");

    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const lastRefresh = new Date(listing.updated_at).getTime();
    if (Date.now() - lastRefresh < COOLDOWN_MS) {
      throw new ForbiddenError("İlan 24 saat içinde bir kez yenilenebilir");
    }

    await listingRepository.touch(db, listing.id);
  },

  async getByUser(db: D1Database, slug: string): Promise<ListingListItem[]> {
    const user = await userRepository.findBySlug(db, slug);
    if (!user) return [];
    return listingRepository.findByUserId(db, user.id, "active");
  },

  async reorderPhotos(
    db: D1Database,
    userId: string,
    slug: string,
    photos: string[],
  ): Promise<ListingDetail> {
    const listing = await listingRepository.findBySlug(db, slug);
    if (!listing) throw new ListingNotFoundError();
    if (listing.seller.id !== userId) throw new ForbiddenError("Bu ilan size ait değil");

    if (photos.length !== listing.photos.length) throw new ForbiddenError("Geçersiz fotoğraf listesi");
    if (new Set(photos).size !== photos.length) throw new ForbiddenError("Tekrar eden fotoğraf URL'i");
    const validUrls = new Set(listing.photos);
    if (!photos.every(url => validUrls.has(url))) throw new ForbiddenError("Geçersiz fotoğraf URL'i");

    await listingRepository.updatePhotos(db, listing.id, photos);
    return { ...listing, photos };
  },
} as const;
