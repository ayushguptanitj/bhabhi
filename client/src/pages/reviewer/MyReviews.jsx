import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Star, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/reviews/my');
        setReviews(data.reviews);
      } catch {
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const recommendationColor = (r) => ({
    strong_accept: 'text-green-400', accept: 'text-teal-400', revision: 'text-yellow-400',
    reject: 'text-red-400', strong_reject: 'text-red-500'
  })[r] || 'text-apple-gray-400';

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Reviews</h1>
        <p className="text-apple-gray-400 text-sm mt-1">{reviews.length} reviews submitted</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="apple-card h-28 shimmer" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="apple-card text-center py-20">
          <Star size={44} className="text-apple-gray-600 mx-auto mb-4" />
          <p className="text-apple-gray-300 font-semibold">No reviews submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="apple-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold leading-snug line-clamp-1">
                    {review.paper?.title || 'Paper'}
                  </h3>
                  <p className="text-apple-gray-500 text-xs mt-0.5">
                    Submitted {new Date(review.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-white font-bold text-xl">{review.overallScore}/10</div>
                  <div className={`text-xs font-semibold capitalize ${recommendationColor(review.recommendation)}`}>
                    {review.recommendation.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-apple-gray-400 text-sm line-clamp-2">{review.comments}</p>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-apple-gray-600">
                {review.technicalScore && <span>Technical: {review.technicalScore}/10</span>}
                {review.originalityScore && <span>Originality: {review.originalityScore}/10</span>}
                {review.presentationScore && <span>Presentation: {review.presentationScore}/10</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;
