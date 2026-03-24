import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, Mail, Building2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewersPage = () => {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/users/reviewers');
        setReviewers(data.reviewers);
      } catch {
        toast.error('Failed to load reviewers');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reviewers</h1>
        <p className="text-apple-gray-400 text-sm mt-1">{reviewers.length} registered reviewers</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="apple-card h-40 shimmer" />)}
        </div>
      ) : reviewers.length === 0 ? (
        <div className="apple-card text-center py-20">
          <Users size={44} className="text-apple-gray-600 mx-auto mb-4" />
          <p className="text-apple-gray-300 font-semibold">No reviewers found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviewers.map((r) => (
            <div key={r._id} className="apple-card hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{r.name}</p>
                  <p className="text-apple-gray-500 text-xs flex items-center gap-1">
                    <Mail size={10} /> {r.email}
                  </p>
                </div>
              </div>
              {r.affiliation && (
                <p className="text-apple-gray-400 text-xs flex items-center gap-1.5 mb-2">
                  <Building2 size={11} /> {r.affiliation}
                </p>
              )}
              {r.expertise?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.expertise.slice(0, 4).map((ex) => (
                    <span key={ex} className="text-xs glass px-2 py-0.5 rounded-full text-apple-gray-400">
                      {ex}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-apple-gray-600 text-xs mt-3">
                Joined {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewersPage;
