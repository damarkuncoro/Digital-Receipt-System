
import { ReceiptData } from './types';

export const DEFAULT_RECEIPT: ReceiptData = {
  config: {
    restaurantName: "R.M ROSO JOYO 2",
    addressLine1: "Jln. Irian, Nglorog",
    addressLine2: "Sragen - Jawa Tengah",
    phone: "(0271) 8821037",
    footer1: "Terima Kasih",
    footer2: "Selamat Menikmati",
    cashierName: "Admin",
    tableNumber: "-",
    showTableNumber: true,
  },
  // Date from input: 04/09/2025 12:30
  date: "2025-09-04T12:30:00.000Z", 
  items: [
    {
      id: "1",
      qty: 100,
      name: "Paket 1",
      price: 44000,
      total: 4400000
    }
  ],
  paymentAmount: 4400000
};

export const MODEL_NAME = "gemini-2.5-flash";
