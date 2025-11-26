
import React, { useState } from 'react';
import { ReceiptData, OrderItem } from '../types';
import { parseOrderText } from '../services/geminiService';
import { Loader2, Wand2, Plus, Trash2, Printer, RotateCcw, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReceiptEditorProps {
  data: ReceiptData;
  onChange: (newData: ReceiptData) => void;
  onPrint: () => void;
}

export const ReceiptEditor: React.FC<ReceiptEditorProps> = ({ data, onChange, onPrint }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleConfigChange = (key: string, value: string | boolean) => {
    onChange({
      ...data,
      config: { ...data.config, [key]: value },
    });
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    const updatedItems = data.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'price') {
          updatedItem.total = updatedItem.qty * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    });
    onChange({ ...data, items: updatedItems });
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      qty: 1,
      name: "New Item",
      price: 0,
      total: 0,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter((i) => i.id !== id) });
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all items and details?")) {
      onChange({
        ...data,
        items: [],
        paymentAmount: 0,
        config: {
          ...data.config,
          restaurantName: "RESTAURANT NAME",
          addressLine1: "Address Line 1",
          addressLine2: "City - Region",
          phone: "(000) 000000",
          tableNumber: "-",
          showTableNumber: true,
        }
      });
    }
  };

  const handleAIParse = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await parseOrderText(prompt);
      
      // Merge items
      const newItems: OrderItem[] = result.items.map(i => ({
        id: Math.random().toString(36).substr(2, 9),
        qty: i.qty,
        name: i.name,
        price: i.price,
        total: i.qty * i.price
      }));

      // Prepare updates
      const updates: Partial<ReceiptData> = {};
      
      if (newItems.length > 0) {
        // If we found new items, append them.
        updates.items = [...data.items, ...newItems];
      }

      // Update config if present
      if (result.config) {
        updates.config = {
          ...data.config,
          ...result.config
        };
      }

      // Update date if present
      if (result.date) {
        updates.date = result.date;
      }

      // Update payment if present
      if (result.paymentAmount !== undefined) {
        updates.paymentAmount = result.paymentAmount;
      }

      onChange({ ...data, ...updates });
      setPrompt('');
    } catch (error) {
      alert("Failed to parse order with AI. Please check your API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-preview-target');
    if (!element) return;

    try {
      setIsDownloading(true);
      
      // Use html2canvas to take a screenshot of the receipt
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution for better clarity
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions to match the receipt aspect ratio
      // Standard thermal paper width is approx 80mm
      const pdfWidth = 80; 
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight] // Custom format to fit the receipt content exactly
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Receipt-${data.config.restaurantName.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. You can try printing to PDF instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  const totalCalculated = data.items.reduce((acc, curr) => acc + curr.total, 0);

  // Helper to convert stored UTC date to local string for input[type="datetime-local"]
  const toLocalISOString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const offsetMs = date.getTimezoneOffset() * 60 * 1000;
      const localDate = new Date(date.getTime() - offsetMs);
      return localDate.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Quick Add */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-2 text-indigo-900 font-semibold">
          <Wand2 className="w-5 h-5" />
          <h3>AI Smart Import</h3>
        </div>
        <p className="text-xs text-indigo-700 mb-3">
          Paste a full receipt or simple order text to auto-fill details.
        </p>
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste receipt text here..."
            className="flex-1 p-3 text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-24 resize-none"
          />
          <button
            onClick={handleAIParse}
            disabled={isGenerating || !prompt}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Import"}
          </button>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-800">Header Details</h3>
          <button 
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset Form
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Restaurant Name</label>
            <input
              type="text"
              value={data.config.restaurantName}
              onChange={(e) => handleConfigChange('restaurantName', e.target.value)}
              className="p-2 border rounded text-sm w-full"
              placeholder="Restaurant Name"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={toLocalISOString(data.date)}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  onChange({ ...data, date: date.toISOString() });
                }
              }}
              className="p-2 border rounded text-sm w-full font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Phone</label>
            <input
              type="text"
              value={data.config.phone}
              onChange={(e) => handleConfigChange('phone', e.target.value)}
              className="p-2 border rounded text-sm w-full"
              placeholder="Phone"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500 block">Table Number</label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={data.config.showTableNumber ?? true}
                  onChange={(e) => handleConfigChange('showTableNumber', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                />
                <span className="text-[10px] text-gray-600">Show</span>
              </label>
            </div>
            <input
              type="text"
              value={data.config.tableNumber}
              onChange={(e) => handleConfigChange('tableNumber', e.target.value)}
              className="p-2 border rounded text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
              placeholder="Table No."
              disabled={!(data.config.showTableNumber ?? true)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Address Line 1</label>
            <input
              type="text"
              value={data.config.addressLine1}
              onChange={(e) => handleConfigChange('addressLine1', e.target.value)}
              className="p-2 border rounded text-sm w-full"
              placeholder="Address Line 1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Address Line 2</label>
            <input
              type="text"
              value={data.config.addressLine2}
              onChange={(e) => handleConfigChange('addressLine2', e.target.value)}
              className="p-2 border rounded text-sm w-full"
              placeholder="Address Line 2"
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
          <button onClick={addItem} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {data.items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 border rounded shadow-sm">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block">Qty</label>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div className="col-span-5">
                <label className="text-xs text-gray-500 block">Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div className="col-span-4">
                <label className="text-xs text-gray-500 block">@Price</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div className="col-span-1 flex items-end justify-center pt-4">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {data.items.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm italic">
              No items yet. Add manually or use AI Import.
            </p>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Payment Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total Bill:</span>
            <span className="font-bold text-lg">Rp {totalCalculated.toLocaleString('id-ID')}</span>
          </div>
          <div>
             <label className="text-sm text-gray-600 block mb-1">Payment Amount (Bayar)</label>
             <input
              type="number"
              value={data.paymentAmount}
              onChange={(e) => onChange({ ...data, paymentAmount: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border rounded text-lg font-mono"
            />
          </div>
        </div>
      </div>

       {/* Action Buttons */}
       <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onPrint}
          className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-transform active:scale-[0.98]"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Download PDF
        </button>
       </div>
    </div>
  );
};
