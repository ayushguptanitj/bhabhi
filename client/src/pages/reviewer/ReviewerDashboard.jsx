import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import ATSScorePanel from '../../components/ATSScorePanel';
import { Microscope, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewerDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await api.get('/papers/assigned/me');
        setPapers(data.papers);
      } catch {
        toast.error('Failed to load assigned papers');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const reviewed = papers.filter((p) => p.myReview);
  const pending = papers.filter((p) => !p.myReview);

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reviewer Dashboard</h1>
        <p className="text-apple-gray-400 text-sm mt-1">Review assigned papers — ATS analysis is pre-computed for each</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Microscope, label: 'Assigned Papers', value: papers.length, color: 'bg-apple-blue' },
          { icon: Clock, label: 'Pending Review', value: pending.length, color: 'bg-yellow-500/80' },
          { icon: CheckCircle2, label: 'Reviews Done', value: reviewed.length, color: 'bg-green-500/80' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="apple-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-apple-xs flex items-center justify-center ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-apple-gray-400 text-xs">{label}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="apple-card h-32 shimmer" />)}</div>
      ) : papers.length === 0 ? (
        <div className="apple-card text-center py-20">
          <Microscope size={44} className="text-apple-gray-600 mx-auto mb-4" />
          <p className="text-apple-gray-300 font-semibold text-lg">No papers assigned yet</p>
          <p className="text-apple-gray-500 text-sm mt-1">The chairperson will assign papers to you</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pending reviews section */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Clock size={15} className="text-yellow-400" /> Awaiting Your Review
              </h2>
              {pending.map((paper) => (
                <PaperAssignmentCard
                  key={paper._id}
                  paper={paper}
                  expanded={expandedId === paper._id}
                  onToggle={() => setExpandedId(expandedId === paper._id ? null : paper._id)}
                  showReviewBtn
                />
              ))}
            </div>
          )}

          {/* Reviewed section */}
          {reviewed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-400" /> Reviewed
              </h2>
              {reviewed.map((paper) => (
                <PaperAssignmentCard
                  key={paper._id}
                  paper={paper}
                  expanded={expandedId === paper._id}
                  onToggle={() => setExpandedId(expandedId === paper._id ? null : paper._id)}
                  showReviewBtn={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PaperAssignmentCard = ({ paper, expanded, onToggle, showReviewBtn }) => (
  <div className="apple-card">
    {/* Header row */}
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold leading-snug line-clamp-2">{paper.title}</h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StatusBadge status={paper.status} />
          <span className="text-apple-gray-500 text-xs">by {paper.author?.name}</span>
          {paper.myReview && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 size={11} /> Your score: {paper.myReview.overallScore}/10
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showReviewBtn && (
          <Link
            to={`/review/${paper._id}`}
            className="btn-primary text-sm px-4 py-2"
          >
            Review
          </Link>
        )}
        <button
          onClick={onToggle}
          className="glass p-2 rounded-apple-xs text-apple-gray-400 hover:text-white transition-colors"
          title="Toggle ATS score"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>

    {/* ATS Score — shown when expanded */}
    {expanded && (
      <div className="mt-5 border-t border-white/[0.06] pt-5 animate-fade-in">
        <p className="text-apple-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
          ATS Score — use to inform your evaluation
        </p>
        <ATSScorePanel
          paperId={paper._id}
          initialScore={paper.aiScore}
          initialStatus={paper.aiAnalysisStatus}
          compact={false}
        />
      </div>
    )}

    {/* Quick ATS hint when collapsed */}
    {!expanded && paper.aiScore?.overallScore > 0 && (
      <div className="mt-3 flex items-center gap-2">
        <div className="text-apple-gray-500 text-xs">ATS Score:</div>
        <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${paper.aiScore.overallScore}%`,
              backgroundColor:
                paper.aiScore.overallScore >= 80 ? '#34d399' :
                paper.aiScore.overallScore >= 60 ? '#60a5fa' :
                paper.aiScore.overallScore >= 40 ? '#fbbf24' : '#f87171'
            }}
          />
        </div>
        <span className="text-white text-xs font-bold">{paper.aiScore.overallScore}</span>
        <button onClick={onToggle} className="text-apple-blue text-xs hover:underline ml-1">Details</button>
      </div>
    )}
  </div>
);

export default ReviewerDashboard;
