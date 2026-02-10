'use client';

import React from 'react';
import { Crown, Mail, CreditCard, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  userName: string;
  userEmail: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  const element = document.getElementById(`receipt-${data.invoiceNumber}`);
  if (!element) return;

  // Temporarily show the receipt if it's hidden
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;
  
  element.style.display = 'block';
  element.style.position = 'fixed';
  element.style.left = '-9999px';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Receipt-${data.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
  }
};

export const ReceiptTemplate = ({ data }: { data: ReceiptData }) => {
  return (
    <div
      id={`receipt-${data.invoiceNumber}`}
      className="bg-white p-12 w-[800px] hidden"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Receipt Header */}
      <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              QR Menu Pro
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Receipt</h1>
          <p className="text-gray-500 font-medium tracking-wide">Invoice #{data.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <div className="text-gray-900 font-bold text-lg mb-1">{data.restaurantName}</div>
          {data.restaurantAddress && <p className="text-gray-500 text-sm">{data.restaurantAddress}</p>}
          {data.restaurantPhone && <p className="text-gray-500 text-sm">{data.restaurantPhone}</p>}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Billed To</h3>
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-900 font-bold text-lg mb-1">{data.userName}</p>
            <p className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> {data.userEmail}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Details</h3>
          <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-gray-400" /> Date
              </span>
              <span className="text-gray-900 font-bold">{new Date(data.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-2 font-medium">
                <CreditCard className="w-4 h-4 text-gray-400" /> Method
              </span>
              <span className="text-gray-900 font-bold">Credit Card (via Stripe)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Details Table */}
      <div className="mb-12 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Plan Description</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-8">
                <div className="text-gray-900 font-bold text-lg mb-1">{data.planName}</div>
                <p className="text-gray-500 text-sm max-w-[350px]">Includes unlimited menu items, premium templates, advanced analytics, and priority support.</p>
              </td>
              <td className="px-6 py-8 text-right">
                <span className="text-2xl font-bold text-gray-900">
                  {data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Area */}
      <div className="flex justify-end mb-16">
        <div className="w-[300px] bg-gray-900 text-white rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
            <span className="text-gray-400 text-sm font-medium">Subtotal</span>
            <span className="font-bold">{data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-lg font-bold">Total Paid</span>
            <span className="text-3xl font-black">
              {data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-gray-100">
        <p className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wider">Thank you for Choosing QR Menu Pro!</p>
        <p className="text-xs text-gray-400">This is a computer generated receipt. For any billing queries, please contact support@qrmenu.com</p>
      </div>
    </div>
  );
};
