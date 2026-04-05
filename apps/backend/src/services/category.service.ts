import type { CategoryTree } from "@rafimdan/shared";
import { categoryRepository } from "../repositories/category.repository";

export const categoryService = {
  async getAll(db: D1Database): Promise<CategoryTree[]> {
    const rows = await categoryRepository.findAll(db);
    return categoryRepository.toTree(rows);
  },
} as const;
