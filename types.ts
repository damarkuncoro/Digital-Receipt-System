
export interface OrderItem {
  id: string;
  qty: number;
  name: string;
  price: number;
  total: number;
}

export interface ReceiptConfig {
  restaurantName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  footer1: string;
  footer2: string;
  cashierName: string;
  tableNumber: string;
  showTableNumber?: boolean;
  showCashierName?: boolean;
  taxPercentage?: number;
  servicePercentage?: number;
}

export interface ReceiptData {
  config: ReceiptConfig;
  date: string; // ISO string
  items: OrderItem[];
  paymentAmount: number;
}

export interface AIParseResult {
  config?: Partial<ReceiptConfig>;
  date?: string;
  paymentAmount?: number;
  items: {
    qty: number;
    name: string;
    price: number;
  }[];
}
