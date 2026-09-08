'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { X, Phone, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface Props {
  listing: { id: string; title: string; price: number; images: string[] };
  onClose: () => void;
}

type Step = 'confirm' | 'no-mobile' | 'pending';

export default function ContactRequestModal({ listing, onClose }: Props) {
  const [step, setStep] = useState<Step>('confirm');
  const [askingPrice, setAskingPrice] = useState<string>(listing.price.toString());
  const { user, accessToken, refreshToken, setAuth } = useAuthStore();
  const router = useRouter();

  // The locally-persisted user can be stale (e.g. phone added in another tab,
  // or an older session snapshot never refreshed) — re-check with the server
  // once instead of trusting the cached value, so a genuinely-added number
  // isn't reported as missing.
  const [phone, setPhone] = useState<string | null>((user as any)?.phone || null);
  useEffect(() => {
    if (phone) return;
    api.get('/api/users/me').then((res) => {
      if (res.data?.phone) {
        setPhone(res.data.phone);
        setAuth({ ...(user as any), ...res.data }, accessToken || '', refreshToken || '');
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/listings/${listing.id}/contact-request`, {
        askingPrice: Number(askingPrice),
      });
      return res.data;
    },
    onSuccess: () => {
      setStep('pending');
      toast.success('Request sent! The seller has been notified.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send request.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{step === 'confirm' ? 'Request Contact' : step === 'pending' ? 'Request Sent' : 'Mobile number required'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {step === 'confirm' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {listing.images?.[0] ? (
                  <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{listing.title}</p>
                <p className="text-sm text-gray-500">Listed at {formatPrice(listing.price)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Your asking price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  min={1}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Sent to the seller with your request</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl">
              <Phone size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                If the seller approves your offer, you'll see their mobile number here. If they decline, no contact details are shared.
              </p>
            </div>

            <button
              onClick={() => {
                if (!phone) { setStep('no-mobile'); return; }
                if (!askingPrice || Number(askingPrice) <= 0) { toast.error('Enter a valid asking price.'); return; }
                mutate();
              }}
              disabled={isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--ry-orange)' }}
            >
              {isPending ? 'Sending...' : 'Request Contact'}
            </button>
          </div>
        )}

        {step === 'no-mobile' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Mobile number required</h3>
              <p className="text-gray-500 text-sm mt-1">
                Add your mobile number to your profile so the seller can identify who's asking.
              </p>
            </div>
            <button
              onClick={() => { onClose(); router.push('/profile'); }}
              className="w-full py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: 'var(--ry-orange)' }}
            >
              Go to Profile →
            </button>
            <button onClick={() => setStep('confirm')} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">
              Go back
            </button>
          </div>
        )}

        {step === 'pending' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <Clock size={32} className="text-orange-600" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">Request Sent!</h3>
              <p className="text-gray-500 text-sm mt-1">
                The seller has been notified of your offer of {formatPrice(Number(askingPrice))}. Check{' '}
                <a href="/sell/my-requests" className="font-semibold" style={{ color: 'var(--ry-orange)' }}>My Requests</a>{' '}
                to see if they approve.
              </p>
            </div>

            <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
