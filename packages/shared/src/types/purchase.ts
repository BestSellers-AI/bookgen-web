import { PurchaseStatus } from '../enums';

export interface PurchaseItemDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  creditsAmount: number | null;
}

export interface PurchaseItem {
  id: string;
  status: PurchaseStatus;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  gateway: string;
  paidAt: string | null;
  items: PurchaseItemDetail[];
  createdAt: string;
}
