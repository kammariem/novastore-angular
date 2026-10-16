export type OrderStatus =
  | 'En attente'
  | 'Confirmée'
  | 'En préparation'
  | 'Livrée'
  | 'Annulée';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  image?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  currency: 'TND';
  createdAt: Date | string;
}
