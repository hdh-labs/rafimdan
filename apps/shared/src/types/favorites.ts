export type FavoriteAddInput = {
  listing_id: string;
};

export type FavoritesResponse = {
  listings: import("./listing").ListingListItem[];
};
