'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { X, Clock, CheckCircle, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice, getTimeLeft } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface Props {
  shopId: string;
  product: { id: string; name: string; price: number; image: string | null };
  onClose: () => void;
}

type Step = 'confirm' | 'no-mobile' | 'success';

export default function ReservationModal({ shopId, product, onClose }: Props) {
  const [step, setStep] = useState<Step>('confirm');
  const [agreedPrice, setAgreedPrice] = useState<string>(product.price.toString());
  const [reservation, setReservation] = useState<{ id: string; expiresAt: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/reservations', {
        shopId,
        productId: product.id,
        agreedPrice: agreedPrice ? Number(agreedPrice) : undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setReservation(data.reservation);
      setStep('success');
      toast.success('Reserved! The shop has been notified.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Reservation failed.');
    },
  });

  useEffect(() => {
    if (!reservation) return;
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(reservation.expiresAt));
    }, 1000);
    setTimeLeft(getTimeLeft(reservation.expiresAt));
    return () => clearInterval(timer);
  }, [reservation]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{step === 'confirm' ? 'Reserve Item' : 'Reserved!'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {step === 'confirm' && (
          <div className="p-4 space-y-4">
            {/* Product */}
            <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">Listed at {formatPrice(product.price)}</p>
              </div>
            </div>

            {/* Agreed price after bargain */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Agreed price (after discussing on call)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
                  min={1}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Optional — helps the vendor prepare your bill</p>
            </div>

            {/* 45-min notice */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl">
              <Clock size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                The shop will hold this item for <strong>45 minutes</strong>. Walk in within time to complete your purchase.
              </p>
            </div>

            <button
              onClick={() => {
                if (!(user as any)?.phone) { setStep('no-mobile'); return; }
                mutate();
              }}
              disabled={isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--ry-orange)' }}
            >
              {isPending ? 'Reserving...' : 'Confirm Reservation'}
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
                The vendor needs your mobile number to confirm the reservation. Please add it to your profile first.
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

        {step === 'success' && reservation && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">Item Reserved!</h3>
              <p className="text-gray-500 text-sm mt-1">The shop has been notified and is holding your item.</p>
            </div>

            {/* Countdown */}
            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Time remaining</p>
              <p className="text-4xl font-black text-orange-600 mt-1 pulse-green font-mono">{timeLeft}</p>
              <p className="text-xs text-orange-600 mt-1">Walk in before this expires</p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              Get Directions
            </a>

            <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
