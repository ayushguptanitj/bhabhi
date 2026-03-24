import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import ATSScorePanel from '../../components/ATSScorePanel';
import { FileText, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MyPapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/papers/my');
      setPapers(data.papers);
    } catch {
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPapers(); }, []);

  return (
    <div className="page-content animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Papers</h1>
          <p className="text-apple-gray-400 text-sm mt-1">{papers.length} submission{papers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPapers} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <RefreshCw size={14} />
          </button>
          <Link to="/submit" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Submission
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">{[...Array(2)].map((_, i) => <div key={i} className="apple-card h-64 shimmer" />)}</div>
      ) : papers.length === 0 ? (
        <div className="apple-card text-center py-20">
          <FileText size={44} className="text-apple-gray-600 mx-auto mb-4" />
          <p className="text-apple-gray-300 font-semibold text-lg">No papers yet</p>
          <p className="text-apple-gray-500 text-sm mt-1">Submit your first research paper</p>
          <Link to="/submit" className="btn-primary inline-flex items-center gap-2 mt-5 text-sm">
            <Plus size={16} /> Submit Paper
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {papers.map((paper) => (
            <div key={paper._id} className="apple-card space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base leading-snug">{paper.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <StatusBadge status={paper.status} />
                    <span className="text-apple-gray-500 text-xs">{paper.conferenceTrack}</span>
                    <span className="text-apple-gray-500 text-xs">·</span>
                    <span className="text-apple-gray-500 text-xs">{new Date(paper.createdAt).toLocaleDateString()}</span>
                  </div>
                  {paper.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {paper.keywords.slice(0, 4).map((kw) => (
                        <span key={kw} className="text-xs glass px-2 py-0.5 rounded-full text-apple-gray-400">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ATS Score Panel — always displayed with auto-poll */}
              <ATSScorePanel
                paperId={paper._id}
                initialScore={paper.aiScore}
                initialStatus={paper.aiAnalysisStatus}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPapers;
