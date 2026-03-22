'use client';

import React from 'react';
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

// GST Rate: 18% (split into CGST 9% + SGST 9%)
const GST_RATE = 0.18;

/**
 * Calculate tax breakdown from a GST-inclusive total.
 * Base price + 18% GST = total  →  base = total / 1.18
 */
function getTaxBreakdown(total: number) {
  const basePrice = total / (1 + GST_RATE);
  const cgst = basePrice * 0.09;
  const sgst = basePrice * 0.09;
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    totalTax: Math.round((cgst + sgst) * 100) / 100,
    total,
  };
}

function formatCurrency(amount: number) {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  const element = document.getElementById(`receipt-${data.invoiceNumber}`);
  if (!element) return;

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
  const tax = getTaxBreakdown(data.amount);
  const { time, date } = formatDate(data.date);

  return (
    <div
      id={`receipt-${data.invoiceNumber}`}
      className="hidden"
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        backgroundColor: '#ffffff',
        width: '500px',
        color: '#1a1a1a',
        padding: '0',
      }}
    >
      {/* ── Status Banner ───────────────────────────── */}
      <div style={{
        background: '#ffffff',
        padding: '32px 32px 24px',
        textAlign: 'center',
        borderBottom: '2px dashed #e5e7eb',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 4px',
          letterSpacing: '-0.02em',
        }}>
          Payment Successful
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0,
        }}>
          Transaction completed securely via Cashfree
        </p>
      </div>

      {/* ── Payment Details ──────────────────────────── */}
      <div style={{ padding: '24px 32px' }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 16px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Payment Details
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Invoice No.</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', letterSpacing: '0.04em' }}>{data.invoiceNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Payment Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {time} &nbsp;&nbsp; {date}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Payment Method</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Cashfree</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Payment Status</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>Successful</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Customer</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{data.userName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Restaurant</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{data.restaurantName}</span>
          </div>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────── */}
      <div style={{ borderBottom: '2px dashed #e5e7eb', margin: '0 32px' }} />

      {/* ── Plan & Tax Breakdown ─────────────────────── */}
      <div style={{ padding: '24px 32px' }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 16px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Billing Details
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Plan line item */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{data.planName}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{formatCurrency(tax.basePrice)}</span>
          </div>
          {/* CGST */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>CGST (9%)</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{formatCurrency(tax.cgst)}</span>
          </div>
          {/* SGST */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>SGST (9%)</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{formatCurrency(tax.sgst)}</span>
          </div>

          {/* Separator */}
          <div style={{ borderBottom: '1px solid #e5e7eb', margin: '4px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{formatCurrency(tax.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div style={{
        background: '#f9fafb',
        padding: '20px 32px',
        textAlign: 'center',
        borderTop: '2px dashed #e5e7eb',
      }}>
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          margin: '0 0 4px',
          fontWeight: 500,
        }}>
          Thank you for choosing QR Menu Premium!
        </p>
        <p style={{
          fontSize: '10px',
          color: '#d1d5db',
          margin: 0,
        }}>
          This is a computer-generated receipt and does not require a signature.
        </p>
        <p style={{
          fontSize: '10px',
          color: '#d1d5db',
          margin: '4px 0 0',
        }}>
          For billing queries, contact support@qrmenu.com
        </p>
      </div>
    </div>
  );
};
