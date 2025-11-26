import React, { useState } from 'react';
import { DEFAULT_RECEIPT } from './constants';
import { ReceiptData } from './types';
import { ReceiptPreview } from './components/ReceiptPreview';
import { ReceiptEditor } from './components/ReceiptEditor';
import { LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData>(DEFAULT_RECEIPT);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar - Hidden on Print */}
      <nav className="bg-slate-900 text-white p-4 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
             <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Roso Joyo POS</h1>
            <p className="text-xs text-slate-400">Digital Receipt System</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Editor Section - Hidden on Print */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Edit Details</h2>
            <ReceiptEditor 
              data={receiptData} 
              onChange={setReceiptData}
              onPrint={handlePrint}
            />
          </section>

          {/* Preview Section - Takes full width on Print */}
          <section className="flex flex-col items-center">
            <div className="mb-4 text-slate-500 font-medium flex items-center gap-2 print:hidden">
              Live Preview
            </div>
            
            {/* The actual receipt container */}
            <div className="print:absolute print:top-0 print:left-0 print:w-full">
              <ReceiptPreview data={receiptData} />
            </div>

            <p className="mt-6 text-sm text-slate-400 text-center max-w-sm print:hidden">
              Note: When printing, make sure to disable "Headers and footers" in your browser's print settings for the best thermal paper look.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;