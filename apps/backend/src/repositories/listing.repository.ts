import type {
  ListingRow,
  ListingListItem,
  ListingDetail,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  ListingsQueryParams,
} from "@rafimdan/shared";
import type { PaginatedResponse } from "@rafimdan/shared";

const MAX_PHOTOS = 6;
const PAGE_LIMIT_MAX = 50;

type ListingRowJoined = ListingRow & {
  category_name: string;
  category_slug: string;
  seller_id: string;
  seller_name: string;
  seller_display_name: string | null;
  seller_slug: string | null;
  seller_avatar_url: string | null;
  seller_whatsapp: string | null;
  seller_city: string | null;
  seller_created_at: string;
  favorites_count: number;
};

function parsePhotos(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function toListItem(row: ListingRowJoined): ListingListItem {
  const photos = parsePhotos(row.photos);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    price_type: row.price_type,
    condition: row.condition,
    status: row.status,
    direction: row.direction,
    rejection_reason: row.rejection_reason ?? null,
    cover_photo: photos[0] ?? null,
    city: row.city,
    district: row.district,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      display_name: row.seller_display_name,
      slug: row.seller_slug,
      avatar_url: row.seller_avatar_url,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
    view_count: row.view_count,
    favorites_count: row.favorites_count,
  };
}

function toDetail(row: ListingRowJoined): ListingDetail {
  const photos = parsePhotos(row.photos);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    price_type: row.price_type,
    condition: row.condition,
    status: row.status,
    direction: row.direction,
    rejection_reason: row.rejection_reason ?? null,
    city: row.city,
    district: row.district,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    description: row.description,
    photos,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      display_name: row.seller_display_name,
      slug: row.seller_slug,
      avatar_url: row.seller_avatar_url,
      whatsapp: row.seller_whatsapp,
      city: row.seller_city,
      created_at: row.seller_created_at,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
    view_count: row.view_count,
    favorites_count: row.favorites_count,
  };
}

const JOIN_SQL = `
  SELECT
    l.*,
    c.name  AS category_name,
    c.slug  AS category_slug,
    u.id    AS seller_id,
    u.name  AS seller_name,
    u.display_name AS seller_display_name,
    u.slug  AS seller_slug,
    u.avatar_url   AS seller_avatar_url,
    u.whatsapp     AS seller_whatsapp,
    u.city         AS seller_city,
    u.created_at   AS seller_created_at,
    (SELECT COUNT(*) FROM favorites f WHERE f.listing_id = l.id) AS favorites_count
  FROM listings l
  JOIN categories c ON c.id = l.category_id
  JOIN users u ON u.id = l.user_id
`;

export const listingRepository = {
  async create(
    db: D1Database,
    input: CreateListingInput & { id: string; user_id: string; slug: string },
  ): Promise<ListingDetail> {
    await db
      .prepare(
        `INSERT INTO listings
          (id, user_id, title, description, category_id, condition, price_type, price, city, district, slug, direction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.user_id,
        input.title,
        input.description ?? null,
        input.category_id,
        input.condition,
        input.price_type,
        input.price ?? null,
        input.city,
        input.district ?? null,
        input.slug,
        input.direction ?? "offer",
      )
      .run();

    return (await listingRepository.findById(db, input.id))!;
  },

  async findById(db: D1Database, id: string): Promise<ListingDetail | null> {
    const row = await db
      .prepare(`${JOIN_SQL} WHERE l.id = ?`)
      .bind(id)
      .first<ListingRowJoined>();
    return row ? toDetail(row) : null;
  },

  async findBySlug(db: D1Database, slug: string): Promise<ListingDetail | null> {
    const row = await db
      .prepare(`${JOIN_SQL} WHERE l.slug = ?`)
      .bind(slug)
      .first<ListingRowJoined>();
    return row ? toDetail(row) : null;
  },

  async findAll(
    db: D1Database,
    params: ListingsQueryParams,
  ): Promise<PaginatedResponse<ListingListItem>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, PAGE_LIMIT_MAX);
    const offset = (page - 1) * limit;

    const conditions: string[] = ["l.status = 'active'"];
    const bindings: unknown[] = [];

    if (params.city) { conditions.push("l.city = ?"); bindings.push(params.city); }
    if (params.district) { conditions.push("l.district = ?"); bindings.push(params.district); }
    if (params.category) { conditions.push("c.slug = ?"); bindings.push(params.category); }
    if (params.price_type) { conditions.push("l.price_type = ?"); bindings.push(params.price_type); }
    if (params.condition) { conditions.push("l.condition = ?"); bindings.push(params.condition); }
    if (params.direction) {
      if (Array.isArray(params.direction)) {
        const placeholders = params.direction.map(() => "?").join(",");
        conditions.push(`l.direction IN (${placeholders})`);
        bindings.push(...params.direction);
      } else {
        conditions.push("l.direction = ?");
        bindings.push(params.direction);
      }
    }
    if (params.q) {
      conditions.push("(l.title LIKE ? ESCAPE '\\' OR l.description LIKE ? ESCAPE '\\')");
      const escaped = params.q.replace(/[\\%_]/g, "\\$&");
      const pattern = `%${escaped}%`;
      bindings.push(pattern, pattern);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const orderBy = params.sort === "popular" ? "l.view_count DESC" : "l.updated_at DESC";

    const countRow = await db
      .prepare(`SELECT COUNT(*) as total FROM listings l JOIN categories c ON c.id = l.category_id JOIN users u ON u.id = l.user_id ${where}`)
      .bind(...bindings)
      .first<{ total: number }>();

    const rows = await db
      .prepare(`${JOIN_SQL} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .bind(...bindings, limit, offset)
      .all<ListingRowJoined>();

    return {
      items: (rows.results ?? []).map(toListItem),
      total: countRow?.total ?? 0,
      page,
      limit,
    };
  },

  async findByIds(db: D1Database, ids: string[]): Promise<ListingListItem[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    const rows = await db
      .prepare(`${JOIN_SQL} WHERE l.id IN (${placeholders})`)
      .bind(...ids)
      .all<ListingRowJoined>();
    return (rows.results ?? []).map(toListItem);
  },

  async findByUserId(
    db: D1Database,
    userId: string,
    status?: ListingStatus,
  ): Promise<ListingListItem[]> {
    const where = status
      ? "WHERE l.user_id = ? AND l.status = ?"
      : "WHERE l.user_id = ?";
    const bindings = status ? [userId, status] : [userId];

    const rows = await db
      .prepare(`${JOIN_SQL} ${where} ORDER BY l.created_at DESC`)
      .bind(...bindings)
      .all<ListingRowJoined>();

    return (rows.results ?? []).map(toListItem);
  },

  async update(
    db: D1Database,
    id: string,
    input: UpdateListingInput,
  ): Promise<ListingDetail | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title); }
    if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }
    if (input.category_id !== undefined) { fields.push("category_id = ?"); values.push(input.category_id); }
    if (input.condition !== undefined) { fields.push("condition = ?"); values.push(input.condition); }
    if (input.price_type !== undefined) { fields.push("price_type = ?"); values.push(input.price_type); }
    if (input.price !== undefined) { fields.push("price = ?"); values.push(input.price); }
    if (input.city !== undefined) { fields.push("city = ?"); values.push(input.city); }
    if (input.district !== undefined) { fields.push("district = ?"); values.push(input.district); }

    if (fields.length === 0) return listingRepository.findById(db, id);

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db
      .prepare(`UPDATE listings SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return listingRepository.findById(db, id);
  },

  async updateStatus(
    db: D1Database,
    id: string,
    status: ListingStatus,
  ): Promise<ListingDetail | null> {
    await db
      .prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id)
      .run();
    return listingRepository.findById(db, id);
  },

  async moderate(
    db: D1Database,
    id: string,
    status: "active" | "pending" | "rejected",
    rejectionReason: string | null,
  ): Promise<ListingDetail | null> {
    await db
      .prepare(
        "UPDATE listings SET status = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .bind(status, rejectionReason, id)
      .run();
    return listingRepository.findById(db, id);
  },

  async updatePhotos(db: D1Database, id: string, photos: string[]): Promise<void> {
    await db
      .prepare("UPDATE listings SET photos = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(photos), id)
      .run();
  },

  async incrementViewCount(db: D1Database, id: string): Promise<void> {
    await db
      .prepare("UPDATE listings SET view_count = view_count + 1 WHERE id = ?")
      .bind(id)
      .run();
  },

  async touch(db: D1Database, id: string): Promise<void> {
    await db
      .prepare("UPDATE listings SET updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();
  },

  async delete(db: D1Database, id: string): Promise<void> {
    await db.prepare("DELETE FROM listings WHERE id = ?").bind(id).run();
  },

  async getStatsByUserId(
    db: D1Database,
    userId: string,
  ): Promise<{ active_count: number; sold_count: number }> {
    const row = await db
      .prepare(
        `SELECT
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN status = 'sold'   THEN 1 ELSE 0 END) AS sold_count
         FROM listings WHERE user_id = ?`,
      )
      .bind(userId)
      .first<{ active_count: number | null; sold_count: number | null }>();
    return {
      active_count: row?.active_count ?? 0,
      sold_count: row?.sold_count ?? 0,
    };
  },

  async findAllAdmin(
    db: D1Database,
    params: { status?: string; page?: number; limit?: number },
  ): Promise<{ items: ListingDetail[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 30, 100);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindings: unknown[] = [];
    if (params.status) { conditions.push("l.status = ?"); bindings.push(params.status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = await db
      .prepare(`SELECT COUNT(*) as total FROM listings l ${where}`)
      .bind(...bindings)
      .first<{ total: number }>();

    const rows = await db
      .prepare(`${JOIN_SQL} ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`)
      .bind(...bindings, limit, offset)
      .all<ListingRowJoined>();

    return {
      items: (rows.results ?? []).map(toDetail),
      total: countRow?.total ?? 0,
      page,
      limit,
    };
  },

  MAX_PHOTOS,
} as const;
