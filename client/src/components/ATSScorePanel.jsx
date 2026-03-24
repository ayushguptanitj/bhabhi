import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { ScoreRing, ScoreBar } from './ScoreDisplay';
import {
  CheckCircle2, XCircle, RefreshCw, TrendingUp, BookOpen,
  AlignLeft, Quote, BarChart2, Image, FileText, ChevronDown, ChevronUp
} from 'lucide-react';

/* ── helpers ── */
const getScoreColor = (s) => {
  if (s >= 80) return '#34d399';
  if (s >= 60) return '#60a5fa';
  if (s >= 40) return '#fbbf24';
  return '#f87171';
};

const getScoreLabel = (s) => {
  if (s >= 85) return { text: 'Excellent', color: 'text-green-400' };
  if (s >= 70) return { text: 'Good', color: 'text-blue-400' };
  if (s >= 55) return { text: 'Average', color: 'text-yellow-400' };
  return { text: 'Needs Work', color: 'text-red-400' };
};

/* ── sub-category card ── */
const ScoreCategory = ({ icon: Icon, label, score, feedback, color }) => (
  <div className="glass rounded-apple-sm p-3">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-white text-xs font-semibold">{label}</span>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{Math.round(score)}/100</span>
    </div>
    <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-2">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
    {feedback && <p className="text-apple-gray-500 text-[10px] leading-relaxed">{feedback}</p>}
  </div>
);

/* ── Main ATS Panel ── */
const ATSScorePanel = ({ paperId, initialScore, initialStatus, compact = false }) => {
  const [score, setScore] = useState(initialScore);
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [expanded, setExpanded] = useState(!compact);
  const [polling, setPolling] = useState(false);

  const fetchScore = useCallback(async () => {
    try {
      const { data } = await api.get(`/papers/${paperId}/ats-score`);
      setScore(data.aiScore);
      setStatus(data.aiAnalysisStatus);
      return data.aiAnalysisStatus;
    } catch { return 'failed'; }
  }, [paperId]);

  // Auto-poll while processing
  useEffect(() => {
    if (status !== 'completed' && status !== 'failed') {
      setPolling(true);
      const interval = setInterval(async () => {
        const newStatus = await fetchScore();
        if (newStatus === 'completed' || newStatus === 'failed') {
          clearInterval(interval);
          setPolling(false);
        }
      }, 3000); // poll every 3s
      return () => clearInterval(interval);
    }
  }, [status, fetchScore]);

  const overall = score?.overallScore || 0;
  const { text: ratingText, color: ratingColor } = getScoreLabel(overall);

  const categories = score ? [
    {
      icon: AlignLeft,
      label: 'Paper Structure',
      score: score.structureScore ?? score.formattingScore ?? 0,
      feedback: score.structureFeedback || score.formattingFeedback,
      color: getScoreColor(score.structureScore ?? score.formattingScore ?? 0),
    },
    {
      icon: BookOpen,
      label: 'Grammar & Language',
      score: score.grammarScore ?? 0,
      feedback: score.grammarFeedback,
      color: getScoreColor(score.grammarScore ?? 0),
    },
    {
      icon: TrendingUp,
      label: 'Clarity & Readability',
      score: score.clarityScore ?? 0,
      feedback: score.clarityFeedback,
      color: getScoreColor(score.clarityScore ?? 0),
    },
    {
      icon: Quote,
      label: 'References & Citations',
      score: score.referencesScore ?? 0,
      feedback: score.referencesFeedback,
      color: getScoreColor(score.referencesScore ?? 0),
    },
    {
      icon: FileText,
      label: 'Abstract Quality',
      score: score.abstractScore ?? 0,
      feedback: score.abstractFeedback,
      color: getScoreColor(score.abstractScore ?? 0),
    },
    {
      icon: BarChart2,
      label: 'Length Compliance',
      score: score.lengthScore ?? 0,
      feedback: score.lengthFeedback,
      color: getScoreColor(score.lengthScore ?? 0),
    },
    {
      icon: Image,
      label: 'Figures & Tables',
      score: score.visualsScore ?? 0,
      feedback: score.visualsFeedback,
      color: getScoreColor(score.visualsScore ?? 0),
    },
  ] : [];

  /* ── pending / processing state ── */
  if (status === 'pending' || status === 'processing') {
    return (
      <div className="glass rounded-apple p-5 border border-apple-blue/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
          <div>
            <p className="text-white font-semibold text-sm">Analyzing your paper…</p>
            <p className="text-apple-gray-500 text-xs mt-0.5">
              Running ATS checks: structure, grammar, clarity, references, abstract quality
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          {['Extracting text from PDF', 'Checking paper structure', 'Evaluating grammar & language',
            'Scoring references & citations', 'Computing readability', 'Assessing abstract quality'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 text-xs text-apple-gray-500">
              <div className="w-4 h-4 rounded-full border border-apple-blue/40 flex items-center justify-center shrink-0">
                <RefreshCw size={8} className="text-apple-blue animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── failed state ── */
  if (status === 'failed') {
    return (
      <div className="glass rounded-apple p-4 border border-red-500/30 bg-red-500/5">
        <p className="text-red-400 text-sm font-medium">ATS analysis could not be completed.</p>
        <p className="text-apple-gray-500 text-xs mt-1">This may happen with scanned or image-only PDFs.</p>
      </div>
    );
  }

  if (!score || overall === 0) return null;

  return (
    <div className="glass rounded-apple border border-white/[0.08] overflow-hidden">
      {/* Header row — always visible */}
      <div
        className={`p-5 ${compact ? 'cursor-pointer hover:bg-white/[0.03]' : ''} transition-colors`}
        onClick={compact ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center gap-5">
          <ScoreRing score={overall} color="auto" size={compact ? 72 : 90} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base">ATS Score</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full glass ${ratingColor}`}>
                {ratingText}
              </span>
            </div>
            <p className="text-apple-gray-400 text-xs leading-relaxed">
              Evaluated against IEEE / ACM standards: structure, grammar, clarity, references, abstract quality, length compliance & visual aids
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-apple-gray-500">
              {score.wordCount > 0 && <span>📄 {score.wordCount.toLocaleString()} words</span>}
              {score.citationCount > 0 && <span>🔗 {score.citationCount} citations</span>}
              {score.figureCount > 0 && <span>🖼 {score.figureCount} figures</span>}
              {score.avgSentenceLength && <span>📝 {score.avgSentenceLength} words/sentence</span>}
            </div>
          </div>
          {compact && (
            <div className="shrink-0 text-apple-gray-500">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
        </div>

        {/* Section flags — always visible */}
        {(score.hasAbstract !== undefined) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { label: 'Abstract', val: score.hasAbstract },
              { label: 'Introduction', val: score.hasIntroduction },
              { label: 'Methodology', val: score.hasMethodology },
              { label: 'Conclusion', val: score.hasConclusion },
            ].map(({ label, val }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-apple-xs border ${
                  val
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {val ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded detail breakdown */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-2.5 animate-fade-in">
          <p className="text-apple-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Parameter Breakdown
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <ScoreCategory key={cat.label} {...cat} />
            ))}
          </div>

          {/* Missing sections if any */}
          {score.missingSections?.length > 0 && (
            <div className="mt-3 p-3 rounded-apple-sm border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-yellow-400 text-xs font-semibold mb-1">⚠ Missing Sections</p>
              <p className="text-apple-gray-400 text-xs">{score.missingSections.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ATSScorePanel;
