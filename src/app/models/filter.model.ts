export interface ProductFilter {
  search?: string;
  categoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean | null;
  promotion?: boolean | null;
}
