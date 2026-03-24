import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { ScoreRing, ScoreBar } from '../../components/ScoreDisplay';
import {
  FileText, Users, CheckCircle2, XCircle, Clock, BarChart3,
  ChevronDown, ChevronUp, UserPlus, Gavel, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="apple-card">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-apple-xs flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {sub && <span className="text-apple-gray-500 text-xs">{sub}</span>}
    </div>
    <p className="text-white text-3xl font-bold">{value}</p>
    <p className="text-apple-gray-400 text-sm mt-1">{label}</p>
  </div>
);

const ChairDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({});
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [decision, setDecision] = useState({ decision: 'accept', comments: '' });
  const [schedule, setSchedule] = useState({ scheduledDate: '', scheduledRoom: '', scheduledSession: '' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [papersRes, statsRes, reviewersRes] = await Promise.all([
          api.get('/papers'),
          api.get('/papers/stats'),
          api.get('/users/reviewers'),
        ]);
        setPapers(papersRes.data.papers);
        setStats(statsRes.data);
        setReviewers(reviewersRes.data.reviewers);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredPapers = papers.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const handleAssign = async () => {
    if (!selectedReviewers.length) return toast.error('Select at least one reviewer');
    try {
      await api.patch(`/papers/${assignModal._id}/assign`, { reviewerIds: selectedReviewers });
      toast.success('Reviewers assigned');
      setPapers((prev) =>
        prev.map((p) => p._id === assignModal._id ? { ...p, status: 'under_review', assignedReviewers: reviewers.filter(r => selectedReviewers.includes(r._id)) } : p)
      );
      setAssignModal(null);
      setSelectedReviewers([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDecision = async () => {
    try {
      await api.patch(`/papers/${decisionModal._id}/decision`, decision);
      toast.success('Decision recorded');
      const status = decision.decision === 'accept' ? 'accepted' : decision.decision === 'reject' ? 'rejected' : 'revision_required';
      setPapers((prev) => prev.map((p) => p._id === decisionModal._id ? { ...p, status, chairDecision: decision } : p));
      setDecisionModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Decision failed');
    }
  };

  const handleSchedule = async () => {
    try {
      await api.patch(`/papers/${scheduleModal._id}/schedule`, schedule);
      toast.success('Paper scheduled');
      setScheduleModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scheduling failed');
    }
  };

  if (loading) return (
    <div className="page-content">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="apple-card h-28 shimmer" />)}
      </div>
    </div>
  );

  const tabs = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'under_review', label: 'Under Review', count: stats.under_review },
    { id: 'accepted', label: 'Accepted', count: stats.accepted },
    { id: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="page-content animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Chairperson Dashboard</h1>
        <p className="text-apple-gray-400 text-sm mt-1">Manage paper submissions, reviewers, and decisions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Papers" value={stats.total || 0} color="bg-apple-blue" />
        <StatCard icon={Clock} label="Pending" value={stats.pending || 0} color="bg-yellow-500/80" />
        <StatCard icon={BarChart3} label="Under Review" value={stats.under_review || 0} color="bg-blue-500/80" />
        <StatCard icon={CheckCircle2} label="Accepted" value={stats.accepted || 0} color="bg-green-500/80" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected || 0} color="bg-red-500/80" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-full p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-apple-blue text-white shadow'
                : 'text-apple-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
            }`}>{tab.count || 0}</span>
          </button>
        ))}
      </div>

      {/* Papers list */}
      <div className="space-y-3">
        {filteredPapers.length === 0 ? (
          <div className="apple-card text-center py-16">
            <FileText size={40} className="text-apple-gray-600 mx-auto mb-4" />
            <p className="text-apple-gray-400">No papers in this category</p>
          </div>
        ) : (
          filteredPapers.map((paper) => (
            <div key={paper._id} className="apple-card">
              <div className="flex items-center gap-4">
                <ScoreRing score={paper.aiScore?.overallScore || 0} color="auto" size={60} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-white font-semibold leading-snug line-clamp-1">{paper.title}</h3>
                      <p className="text-apple-gray-500 text-xs mt-0.5">
                        by {paper.author?.name} — {paper.conferenceTrack}
                      </p>
                    </div>
                    <StatusBadge status={paper.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {paper.status === 'pending' && (
                      <button
                        onClick={() => { setAssignModal(paper); setSelectedReviewers(paper.assignedReviewers?.map(r => r._id) || []); }}
                        className="text-xs flex items-center gap-1 text-apple-blue hover:text-blue-400 glass px-3 py-1 rounded-full transition"
                      >
                        <UserPlus size={12} /> Assign Reviewers
                      </button>
                    )}
                    {paper.status === 'under_review' && (
                      <button
                        onClick={() => setDecisionModal(paper)}
                        className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 glass px-3 py-1 rounded-full transition"
                      >
                        <Gavel size={12} /> Make Decision
                      </button>
                    )}
                    {paper.status === 'accepted' && (
                      <button
                        onClick={() => setScheduleModal(paper)}
                        className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 glass px-3 py-1 rounded-full transition"
                      >
                        <Calendar size={12} /> Schedule
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPaper(expandedPaper === paper._id ? null : paper._id)}
                      className="text-xs flex items-center gap-1 text-apple-gray-500 hover:text-white glass px-3 py-1 rounded-full transition"
                    >
                      {expandedPaper === paper._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expandedPaper === paper._id ? 'Less' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>

              {expandedPaper === paper._id && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] animate-fade-in space-y-3">
                  <p className="text-apple-gray-400 text-sm leading-relaxed line-clamp-3">{paper.abstract}</p>
                  {paper.aiScore?.overallScore > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreBar label="Grammar" score={paper.aiScore.grammarScore} color="auto" />
                      <ScoreBar label="Clarity" score={paper.aiScore.clarityScore} color="auto" />
                      <ScoreBar label="Formatting" score={paper.aiScore.formattingScore} color="auto" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-apple-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {paper.assignedReviewers?.length || 0} reviewers assigned
                    </span>
                    <span>Submitted {new Date(paper.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Assign Reviewers Modal */}
      {assignModal && (
        <Modal title="Assign Reviewers" onClose={() => setAssignModal(null)}>
          <p className="text-apple-gray-400 text-sm mb-4 line-clamp-2">{assignModal.title}</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {reviewers.map((r) => (
              <label key={r._id} className="flex items-center gap-3 glass rounded-apple-xs p-3 cursor-pointer hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-apple-blue"
                  checked={selectedReviewers.includes(r._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedReviewers((p) => [...p, r._id]);
                    else setSelectedReviewers((p) => p.filter((id) => id !== r._id));
                  }}
                />
                <div>
                  <p className="text-white text-sm font-medium">{r.name}</p>
                  <p className="text-apple-gray-500 text-xs">{r.email}</p>
                </div>
              </label>
            ))}
          </div>
          <button onClick={handleAssign} className="btn-primary w-full mt-4">Assign ({selectedReviewers.length} selected)</button>
        </Modal>
      )}

      {/* Decision Modal */}
      {decisionModal && (
        <Modal title="Make Decision" onClose={() => setDecisionModal(null)}>
          <p className="text-apple-gray-400 text-sm mb-4 line-clamp-2">{decisionModal.title}</p>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['accept', 'reject', 'revision'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision((p) => ({ ...p, decision: d }))}
                  className={`py-2 rounded-apple-sm text-sm font-medium capitalize transition-all ${
                    decision.decision === d
                      ? d === 'accept' ? 'bg-green-500 text-white' : d === 'reject' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                      : 'glass text-apple-gray-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Comments for the author (optional)"
              value={decision.comments}
              onChange={(e) => setDecision((p) => ({ ...p, comments: e.target.value }))}
              rows={3}
              className="apple-input resize-none"
            />
          </div>
          <button onClick={handleDecision} className="btn-primary w-full mt-4">Submit Decision</button>
        </Modal>
      )}

      {/* Schedule Modal */}
      {scheduleModal && (
        <Modal title="Schedule Paper" onClose={() => setScheduleModal(null)}>
          <p className="text-apple-gray-400 text-sm mb-4 line-clamp-2">{scheduleModal.title}</p>
          <div className="space-y-3">
            <input type="datetime-local" value={schedule.scheduledDate} onChange={(e) => setSchedule((p) => ({ ...p, scheduledDate: e.target.value }))} className="apple-input" style={{ colorScheme: 'dark' }} />
            <input placeholder="Room / Hall" value={schedule.scheduledRoom} onChange={(e) => setSchedule((p) => ({ ...p, scheduledRoom: e.target.value }))} className="apple-input" />
            <input placeholder="Session (e.g. Morning Session A)" value={schedule.scheduledSession} onChange={(e) => setSchedule((p) => ({ ...p, scheduledSession: e.target.value }))} className="apple-input" />
          </div>
          <button onClick={handleSchedule} className="btn-primary w-full mt-4">Save Schedule</button>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative glass rounded-apple p-6 w-full max-w-md shadow-apple-xl animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <button onClick={onClose} className="text-apple-gray-500 hover:text-white text-xl leading-none transition-colors">×</button>
      </div>
      {children}
    </div>
  </div>
);

export default ChairDashboard;
