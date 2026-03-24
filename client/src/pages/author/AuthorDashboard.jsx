import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import ATSScorePanel from '../../components/ATSScorePanel';
import { FileText, Plus, Clock, CheckCircle2, XCircle, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="apple-card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-apple-xs flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-apple-gray-400 text-xs font-medium">{label}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
    </div>
  </div>
);

const AuthorDashboard = () => {
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

  const stats = {
    total: papers.length,
    pending: papers.filter((p) => ['pending', 'under_review'].includes(p.status)).length,
    accepted: papers.filter((p) => p.status === 'accepted').length,
    avgScore: papers.length
      ? Math.round(papers.reduce((s, p) => s + (p.aiScore?.overallScore || 0), 0) / papers.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="apple-card h-24 shimmer" />)}
        </div>
        <div className="space-y-6">{[...Array(2)].map((_, i) => <div key={i} className="apple-card h-64 shimmer" />)}</div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="text-apple-gray-400 text-sm mt-1">Track your submissions and ATS scores</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPapers} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <RefreshCw size={14} />
          </button>
          <Link to="/submit" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            Submit Paper
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={FileText} label="Total Submissions" value={stats.total} color="bg-apple-blue" />
        <StatCard icon={Clock} label="In Progress" value={stats.pending} color="bg-yellow-500/80" />
        <StatCard icon={CheckCircle2} label="Accepted" value={stats.accepted} color="bg-green-500/80" />
        <StatCard icon={TrendingUp} label="Avg ATS Score" value={stats.avgScore || '—'} color="bg-purple-500/80" />
      </div>

      {/* Paper list */}
      <div className="space-y-6">
        <h2 className="text-white font-semibold text-lg">Submissions</h2>

        {papers.length === 0 ? (
          <div className="apple-card text-center py-20">
            <FileText size={44} className="text-apple-gray-600 mx-auto mb-4" />
            <p className="text-apple-gray-300 font-semibold text-lg">No papers submitted yet</p>
            <p className="text-apple-gray-500 text-sm mt-1">Submit your first research paper to get an AI readiness score</p>
            <Link to="/submit" className="btn-primary inline-flex items-center gap-2 mt-5 text-sm">
              <Plus size={16} /> Submit Paper
            </Link>
          </div>
        ) : (
          papers.map((paper) => <PaperCard key={paper._id} paper={paper} />)
        )}
      </div>
    </div>
  );
};

const PaperCard = ({ paper }) => {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="apple-card space-y-5">
      {/* Paper header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg leading-snug">{paper.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={paper.status} />
            <span className="text-apple-gray-500 text-xs">
              {paper.conferenceTrack} · {new Date(paper.createdAt).toLocaleDateString()}
            </span>
            {paper.keywords?.slice(0, 3).map((kw) => (
              <span key={kw} className="text-xs text-apple-gray-500 glass px-2 py-0.5 rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ATS Score — always visible, auto-polls until ready */}
      <ATSScorePanel
        paperId={paper._id}
        initialScore={paper.aiScore}
        initialStatus={paper.aiAnalysisStatus}
        compact={false}
      />

      {/* Review feedback */}
      {paper.reviews?.length > 0 && (
        <div>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex items-center gap-2 text-sm text-apple-gray-400 hover:text-white transition-colors"
          >
            <span className="font-medium">{paper.reviews.length} Reviewer Feedback{paper.reviews.length > 1 ? 's' : ''}</span>
            <span className="text-apple-gray-600">{showReviews ? '▲' : '▼'}</span>
          </button>

          {showReviews && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {paper.reviews.map((review) => (
                <div key={review._id} className="glass rounded-apple-sm p-4 border-l-2 border-apple-blue/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-apple-gray-300 text-sm font-medium">{review.reviewer?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{review.overallScore}/10</span>
                      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                        review.recommendation?.includes('accept') ? 'bg-green-500/20 text-green-400' :
                        review.recommendation?.includes('reject') ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {review.recommendation?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-apple-gray-400 text-sm leading-relaxed">{review.comments}</p>
                  {review.strengthsComments && (
                    <p className="text-green-400/70 text-xs mt-2 leading-relaxed">💪 {review.strengthsComments}</p>
                  )}
                  {review.weaknessComments && (
                    <p className="text-yellow-400/70 text-xs mt-1 leading-relaxed">⚠ {review.weaknessComments}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chair Decision */}
      {paper.chairDecision?.decision && (
        <div className={`rounded-apple-sm p-4 border ${
          paper.chairDecision.decision === 'accept'
            ? 'border-green-500/30 bg-green-500/10'
            : paper.chairDecision.decision === 'reject'
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-yellow-500/30 bg-yellow-500/10'
        }`}>
          <p className="text-white text-sm font-semibold mb-1">
            🎓 Chairperson Decision:{' '}
            <span className={`capitalize ${
              paper.chairDecision.decision === 'accept' ? 'text-green-400' :
              paper.chairDecision.decision === 'reject' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {paper.chairDecision.decision}
            </span>
          </p>
          {paper.chairDecision.comments && (
            <p className="text-apple-gray-400 text-xs leading-relaxed">{paper.chairDecision.comments}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthorDashboard;
