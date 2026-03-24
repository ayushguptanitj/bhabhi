import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import ATSScorePanel from '../../components/ATSScorePanel';
import { Star, Send, ChevronLeft, User, Tag, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ScoreSlider = ({ label, name, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-apple-gray-400 text-xs font-medium">{label}</label>
      <span className="text-white text-sm font-bold">{value}<span className="text-apple-gray-500">/10</span></span>
    </div>
    <div className="flex gap-1">
      {[...Array(10)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(name, i + 1)}
          className={`flex-1 h-2.5 rounded-full transition-all duration-100 hover:scale-110 ${
            i < value
              ? i < 4 ? 'bg-red-500' : i < 7 ? 'bg-yellow-500' : 'bg-green-400'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        />
      ))}
    </div>
    <p className="text-apple-gray-600 text-[10px] text-right">
      {value <= 3 ? 'Poor' : value <= 5 ? 'Below Average' : value <= 7 ? 'Good' : value <= 9 ? 'Very Good' : 'Excellent'}
    </p>
  </div>
);

const ReviewForm = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'review'
  const [form, setForm] = useState({
    overallScore: 5,
    technicalScore: 5,
    originalityScore: 5,
    presentationScore: 5,
    comments: '',
    strengthsComments: '',
    weaknessComments: '',
    recommendation: 'accept',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/papers/${paperId}`);
        setPaper(data.paper);
      } catch {
        toast.error('Failed to load paper');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [paperId]);

  const handleScore = (name, val) => setForm((p) => ({ ...p, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.comments.length < 20) {
      return toast.error('Comments must be at least 20 characters');
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${paperId}`, form);
      toast.success('Review submitted successfully!');
      navigate('/assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="max-w-3xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="apple-card h-32 shimmer" />)}
        </div>
      </div>
    );
  }

  const recommendations = [
    { val: 'strong_accept', label: '⭐ Strong Accept', cls: 'border-green-400 bg-green-500/20 text-green-400' },
    { val: 'accept',        label: '✓ Accept',        cls: 'border-teal-400 bg-teal-500/20 text-teal-400' },
    { val: 'revision',      label: '✏ Revision',      cls: 'border-yellow-400 bg-yellow-500/20 text-yellow-400' },
    { val: 'reject',        label: '✗ Reject',        cls: 'border-red-400 bg-red-500/20 text-red-400' },
    { val: 'strong_reject', label: '✗✗ Strong Reject', cls: 'border-red-600 bg-red-600/20 text-red-500' },
  ];

  return (
    <div className="page-content animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-apple-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Assignments
        </button>

        {/* Paper Info */}
        {paper && (
          <div className="apple-card mb-6">
            <h1 className="text-white font-bold text-xl leading-snug">{paper.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-apple-gray-500">
              <span className="flex items-center gap-1"><User size={11} /> {paper.author?.name}</span>
              <span className="flex items-center gap-1"><Tag size={11} /> {paper.conferenceTrack}</span>
            </div>
            <p className="text-apple-gray-400 text-sm mt-3 leading-relaxed">{paper.abstract}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex glass rounded-full p-1 mb-6 w-fit">
          {[
            { id: 'ats', label: '📊 ATS Analysis', icon: BarChart2 },
            { id: 'review', label: '✏ Write Review', icon: Star },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-apple-blue text-white shadow'
                  : 'text-apple-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ATS Tab — full breakdown for reviewer */}
        {activeTab === 'ats' && paper && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={16} className="text-apple-blue" />
              <h2 className="text-white font-semibold">Paper Readiness Analysis</h2>
              <span className="text-apple-gray-500 text-xs">— use this to inform your evaluation</span>
            </div>
            <ATSScorePanel
              paperId={paper._id}
              initialScore={paper.aiScore}
              initialStatus={paper.aiAnalysisStatus}
              compact={false}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setActiveTab('review')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Proceed to Review <Star size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Scores */}
            <div className="apple-card space-y-5">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Star size={16} className="text-apple-blue" /> Evaluation Scores
              </h2>
              <ScoreSlider label="Overall Score" name="overallScore" value={form.overallScore} onChange={handleScore} />
              <ScoreSlider label="Technical Quality" name="technicalScore" value={form.technicalScore} onChange={handleScore} />
              <ScoreSlider label="Originality & Novelty" name="originalityScore" value={form.originalityScore} onChange={handleScore} />
              <ScoreSlider label="Presentation Quality" name="presentationScore" value={form.presentationScore} onChange={handleScore} />
            </div>

            {/* Recommendation */}
            <div className="apple-card">
              <h2 className="text-white font-semibold mb-4">Final Recommendation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {recommendations.map(({ val, label, cls }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, recommendation: val }))}
                    className={`py-2.5 px-2 rounded-apple-sm text-xs font-semibold border transition-all duration-150 text-center ${
                      form.recommendation === val ? cls : 'border-white/10 text-apple-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Written Feedback */}
            <div className="apple-card space-y-4">
              <h2 className="text-white font-semibold">Written Feedback</h2>

              <div>
                <label className="text-apple-gray-400 text-xs font-medium block mb-1.5">
                  Overall Comments <span className="text-red-400">*</span>
                  <span className="ml-2 text-apple-gray-600">(min 20 chars — {form.comments.length})</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.comments}
                  onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))}
                  placeholder="Provide a thorough, constructive assessment of this paper — technical content, methodology, results, and writing quality..."
                  className="apple-input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-apple-gray-400 text-xs font-medium block mb-1.5">
                    <span className="text-green-400">💪</span> Strengths
                  </label>
                  <textarea
                    rows={4}
                    value={form.strengthsComments}
                    onChange={(e) => setForm((p) => ({ ...p, strengthsComments: e.target.value }))}
                    placeholder="What does this paper do well?"
                    className="apple-input resize-none"
                  />
                </div>
                <div>
                  <label className="text-apple-gray-400 text-xs font-medium block mb-1.5">
                    <span className="text-yellow-400">⚠</span> Weaknesses
                  </label>
                  <textarea
                    rows={4}
                    value={form.weaknessComments}
                    onChange={(e) => setForm((p) => ({ ...p, weaknessComments: e.target.value }))}
                    placeholder="Areas that need improvement?"
                    className="apple-input resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ATS reminder */}
            <div className="flex items-start gap-3 glass rounded-apple-sm px-4 py-3 border border-apple-blue/20">
              <BarChart2 size={16} className="text-apple-blue shrink-0 mt-0.5" />
              <p className="text-apple-gray-400 text-xs leading-relaxed">
                The ATS score reflects automated checks on structure, grammar, readability, citations, and abstract quality.
                Your expert judgement on technical contribution and novelty is equally important.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><Send size={18} /> Submit Review</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
