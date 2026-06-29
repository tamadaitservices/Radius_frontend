'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Props {
  reservationId: string;
  shopName: string;
  onDone?: () => void;
}

export default function ReviewForm({ reservationId, shopName, onDone }: Props) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const { data: canReview, isLoading } = useQuery({
    queryKey: ['can-review', reservationId],
    queryFn: async () => {
      const r = await api.get(`/api/reviews/can-review/${reservationId}`);
      return r.data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/api/reviews', { reservationId, rating, comment });
    },
    onSuccess: () => {
      toast.success('Review submitted! Thank you.');
      qc.invalidateQueries({ queryKey: ['can-review', reservationId] });
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
      onDone?.();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to submit review.'),
  });

  if (isLoading) return null;
  if (!canReview?.canReview) {
    if (canReview?.alreadyReviewed) {
      return <p className="text-xs text-green-600 font-medium mt-2">✓ You reviewed this shop</p>;
    }
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
      <p className="text-sm font-semibold text-gray-800 mb-2">Rate your visit to {shopName}</p>

      {/* Star rating */}
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={n <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={2}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-yellow-400 focus:outline-none resize-none mb-2"
        maxLength={500}
      />

      <button
        onClick={() => submit.mutate()}
        disabled={rating === 0 || submit.isPending}
        className="w-full py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50"
        style={{ backgroundColor: '#f59e0b' }}
      >
        {submit.isPending ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
