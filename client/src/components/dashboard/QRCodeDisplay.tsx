'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Download, RefreshCw, Copy, ExternalLink, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function QRCodeDisplay() {
  const { restaurant } = useAuth();
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchQRCode();
    }
  }, [restaurant]);

  const fetchQRCode = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const response = await restaurantAPI.getQR(restaurant._id);
      setQrCode(response.data.data.qrCode);
    } catch (error) {
      toast.error('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!restaurant) return;
    setRegenerating(true);
    try {
      const response = await restaurantAPI.regenerateQR(restaurant._id);
      setQrCode(response.data.data.qrCode);
      toast.success('QR code regenerated');
    } catch (error) {
      toast.error('Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${restaurant?.slug || 'menu'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/menu/${restaurant?.slug}`;

  const handleCopyLink = async () => {
    if (!restaurant?.slug) {
      toast.error('Restaurant slug missing');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success('Menu link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">QR Code</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and share your digital menu QR code.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* QR Display Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-zinc-800 dark:to-zinc-900 p-6 rounded-2xl mb-6 shadow-inner">
            {qrCode ? (
              <img
                src={qrCode}
                alt="Menu QR Code"
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl shadow-sm mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-2"
              />
            ) : (
              <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-xl">
                <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-600" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Scan to view menu
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto text-sm">
            Place this QR code on tables or at the entrance for easy access.
          </p>

          <div className="flex flex-wrap gap-3 justify-center w-full">
            <Button onClick={handleDownload} disabled={!qrCode} className="flex-1 max-w-[160px] min-h-[44px]">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerate}
              loading={regenerating}
              className="flex-1 max-w-[160px] min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Tips & Link Card */}
        <div className="space-y-6 text-left">
           {/* Menu Link */}
           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Direct Menu Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    readOnly
                    value={menuUrl}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-3 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <Link
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors"
                  title="Open menu"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>
           </div>

          {/* Tips */}
          <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 p-6">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-400 mb-4 flex items-center gap-2">
              <span className="text-xl">💡</span> Pro Tips
            </h3>
            <ul className="space-y-4 text-orange-800/80 dark:text-orange-300/80 text-sm">
               <li className="flex gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                <span>Print high-quality stickers for table corners (2x2 inches works best).</span>
               </li>
               <li className="flex gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                <span>Laminate table tents to protect them from spills.</span>
               </li>
               <li className="flex gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                <span>Share the direct link on your Instagram bio and Google Maps listing.</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
