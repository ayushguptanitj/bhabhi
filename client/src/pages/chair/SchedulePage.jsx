import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const SchedulePage = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/papers?status=accepted');
        setPapers(data.papers);
      } catch {
        toast.error('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const scheduled = papers.filter((p) => p.scheduledDate);
  const unscheduled = papers.filter((p) => !p.scheduledDate);

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Conference Schedule</h1>
        <p className="text-apple-gray-400 text-sm mt-1">
          {scheduled.length} papers scheduled · {unscheduled.length} pending scheduling
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="apple-card h-28 shimmer" />)}</div>
      ) : (
        <>
          {scheduled.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-green-400" /> Scheduled Papers
              </h2>
              <div className="space-y-3">
                {scheduled.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map((p) => (
                  <div key={p._id} className="apple-card border-l-4 border-green-500/50">
                    <h3 className="text-white font-semibold leading-snug">{p.title}</h3>
                    <p className="text-apple-gray-500 text-xs mt-0.5">by {p.author?.name}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-apple-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {new Date(p.scheduledDate).toLocaleString()}
                      </span>
                      {p.scheduledRoom && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {p.scheduledRoom}
                        </span>
                      )}
                      {p.scheduledSession && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {p.scheduledSession}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unscheduled.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock size={16} className="text-yellow-400" /> Awaiting Schedule
              </h2>
              <div className="space-y-3">
                {unscheduled.map((p) => (
                  <div key={p._id} className="apple-card border-l-4 border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold leading-snug">{p.title}</h3>
                        <p className="text-apple-gray-500 text-xs mt-0.5">by {p.author?.name}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {papers.length === 0 && (
            <div className="apple-card text-center py-20">
              <Calendar size={44} className="text-apple-gray-600 mx-auto mb-4" />
              <p className="text-apple-gray-300 font-semibold">No accepted papers yet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SchedulePage;
