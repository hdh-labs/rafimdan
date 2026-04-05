export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryTree = Category & {
  children: Category[];
};
