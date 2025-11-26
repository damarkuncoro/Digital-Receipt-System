
import React, { useMemo } from 'react';
import { ReceiptData } from '../types';

interface ReceiptPreviewProps {
  data: ReceiptData;
}

const MIN_ROWS = 10;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\./g, "."); // Ensure dots are used as separators per request style
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ data }) => {
  const { config, items, paymentAmount, date } = data;

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const change = Math.max(0, paymentAmount - totalAmount);
  
  // Calculate how many empty rows are needed to reach the minimum
  const emptyRows = Math.max(0, MIN_ROWS - items.length);

  return (
    <div className="w-fit mx-auto">
      {/* Wrapper to hold shadow, separated from capture target for clean PDF */}
      <div className="shadow-xl print:shadow-none">
        <div 
          id="receipt-preview-target"
          className="w-[380px] bg-white p-6 font-['Courier_Prime'] text-sm leading-tight text-black print:w-full"
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="font-bold text-lg uppercase mb-1">{config.restaurantName}</h1>
            <p>{config.addressLine1}</p>
            <p>{config.addressLine2}</p>
            <p>Telp : {config.phone}</p>
          </div>

          {/* Date, Table & Cashier */}
          <div className="mb-2">
            <div className="flex justify-between">
              <p>Tgl  : {formatDate(date)}</p>
              {(config.showTableNumber ?? true) && <p>Meja : {config.tableNumber}</p>}
            </div>
            {(config.showCashierName ?? true) && config.cashierName && <p>Kasir: {config.cashierName}</p>}
          </div>

          {/* Divider */}
          <div className="border-b border-dashed border-black my-2"></div>

          {/* Columns Header */}
          <div className="flex justify-between mb-1 font-bold">
            <span className="w-10">QTY</span>
            <span className="flex-1">MENU</span>
            <span className="w-20 text-right">@HARGA</span>
            <span className="w-24 text-right">TOTAL</span>
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Items */}
          <div className="space-y-2 mb-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <span className="w-10 flex-shrink-0">{item.qty}</span>
                <span className="flex-1 break-words pr-2">{item.name}</span>
                <span className="w-20 text-right flex-shrink-0">{formatCurrency(item.price)}</span>
                <span className="w-24 text-right flex-shrink-0">{formatCurrency(item.total)}</span>
              </div>
            ))}
            {/* Empty Rows for Padding to ensure min-height */}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <div key={`empty-${index}`} className="flex justify-between items-start" aria-hidden="true">
                <span className="w-10 flex-shrink-0">&nbsp;</span>
                <span className="flex-1 break-words pr-2">&nbsp;</span>
                <span className="w-20 text-right flex-shrink-0">&nbsp;</span>
                <span className="w-24 text-right flex-shrink-0">&nbsp;</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Totals */}
          <div className="space-y-1 font-bold">
            <div className="flex justify-between">
              <span>TOTAL</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>BAYAR</span>
              <span>{formatCurrency(paymentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>KEMBALI</span>
              <span>{formatCurrency(change)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Footer */}
          <div className="text-center mt-4 space-y-1">
            <p>{config.footer1}</p>
            <p>{config.footer2}</p>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>
        </div>
      </div>
    </div>
  );
};