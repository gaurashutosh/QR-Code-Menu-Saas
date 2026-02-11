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
  planDescription?: string;
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
      className="hidden"
      style={{ 
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: '#ffffff',
        padding: '48px',
        width: '800px',
        color: '#111827'
      }}
    >
      {/* Receipt Header */}
      <div 
        className="flex justify-between items-start mb-12"
        style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '32px' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 flex items-center justify-center"
              style={{ background: 'linear-gradient(to right, #f97316, #ef4444)', borderRadius: '16px' }}
            >
              <Crown className="w-7 h-7" style={{ color: '#ffffff' }} />
            </div>
            <span 
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(to right, #f97316, #ef4444)',
                WebkitBackgroundClip: 'text'
              }}
            >
              QR Menu Premium
            </span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2 uppercase tracking-tight" style={{ color: '#111827' }}>Receipt</h1>
          <p className="font-medium tracking-wide" style={{ color: '#6b7280' }}>Invoice #{data.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg mb-1" style={{ color: '#111827' }}>{data.restaurantName}</div>
          {data.restaurantAddress && <p className="text-sm" style={{ color: '#6b7280', margin: 0 }}>{data.restaurantAddress}</p>}
          {data.restaurantPhone && <p className="text-sm" style={{ color: '#6b7280', margin: 0 }}>{data.restaurantPhone}</p>}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Billed To</h3>
          <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px' }}>
            <p className="font-bold text-lg mb-1" style={{ color: '#111827', margin: 0 }}>{data.userName}</p>
            <p className="flex items-center gap-2" style={{ color: '#4b5563', margin: 0 }}>
              <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} /> {data.userEmail}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Payment Details</h3>
          <div className="space-y-3" style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px' }}>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 font-medium" style={{ color: '#6b7280' }}>
                <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} /> Date
              </span>
              <span className="font-bold" style={{ color: '#111827' }}>{new Date(data.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 font-medium" style={{ color: '#6b7280' }}>
                <CreditCard className="w-4 h-4" style={{ color: '#9ca3af' }} /> Method
              </span>
              <span className="font-bold" style={{ color: '#111827' }}>Credit Card (via Stripe)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Details Table */}
      <div className="mb-12 overflow-hidden" style={{ borderRadius: '16px', border: '1px solid #f3f4f6' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Plan Description</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: '#9ca3af' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-8">
                <div className="font-bold text-lg mb-1" style={{ color: '#111827' }}>{data.planName}</div>
                <p className="text-sm max-w-[350px]" style={{ color: '#6b7280', margin: 0 }}>
                  {data.planDescription || 'Includes unlimited menu items, premium templates, advanced analytics, and priority support.'}
                </p>
              </td>
              <td className="px-6 py-8 text-right">
                <span className="text-2xl font-bold" style={{ color: '#111827' }}>
                  {data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Area */}
      <div className="flex justify-end mb-16">
        <div 
          className="w-[300px] p-8" 
          style={{ 
            backgroundColor: '#111827', 
            borderRadius: '24px',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #1f2937' }}>
            <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Subtotal</span>
            <span className="font-bold">{data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold" style={{ color: '#9ca3af' }}>Total Paid</span>
            <span className="text-3xl font-black">
              {data.currency.toUpperCase()} {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8" style={{ borderTop: '1px solid #f3f4f6' }}>
        <p className="text-sm mb-2 font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>Thank you for Choosing QR Menu Premium!</p>
        <p className="text-xs" style={{ color: '#9ca3af' }}>This is a computer generated receipt. For any billing queries, please contact support@qrmenu.com</p>
      </div>
    </div>
  );
};
