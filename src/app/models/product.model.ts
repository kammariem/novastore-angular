export type ProductType =
  | 'T-Shirt'
  | 'Chemise'
  | 'Pantalon'
  | 'Robe'
  | 'Veste'
  | 'Pull'
  | 'Sac'
  | 'Chaussures';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: 'TND';
  categoryId: string;
  categoryName: string;
  type: ProductType;
  image: string;
  imagesUri?: string;
  stock: number;
  available: boolean;
  promotion: boolean;
  createdAt?: Date | string;
}
