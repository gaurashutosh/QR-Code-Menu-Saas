'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, RefreshCw, Copy, ExternalLink, QrCode } from 'lucide-react';

export default function QRCodePage() {
  const router = useRouter();
  const { restaurant, loading: authLoading } = useAuth();
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !restaurant) {
      router.push('/dashboard');
    }
  }, [authLoading, restaurant, router]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Menu link copied to clipboard');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your QR Code</h1>
              <p className="text-sm text-gray-500">{restaurant?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* QR Code Display */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl mb-6">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="Menu QR Code"
                  className="w-64 h-64 rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Scan to view menu
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Print this QR code and place it on tables, at the entrance, or on
              your marketing materials.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Button onClick={handleDownload} disabled={!qrCode}>
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                loading={regenerating}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>

            {/* Menu Link */}
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direct Menu Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={menuUrl}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200"
                  title="Copy link"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <Link
                  href={menuUrl}
                  target="_blank"
                  className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200"
                  title="Open menu"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Tips for Using Your QR Code
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </span>
              <span>
                Print the QR code on high-quality paper or as a sticker for
                durability.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </span>
              <span>
                Place it at eye level on tables or near the entrance for easy
                scanning.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </span>
              <span>
                Add it to your social media profiles and website for online
                visibility.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                4
              </span>
              <span>
                Include it on business cards, flyers, and promotional materials.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
