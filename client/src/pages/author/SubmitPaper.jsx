import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SubmitPaper = () => {
  const [form, setForm] = useState({
    title: '',
    abstract: '',
    keywords: '',
    conferenceTrack: 'General',
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      toast.error('Please upload a PDF file only');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please upload a PDF file');

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('pdf', file);

    try {
      await api.post('/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Paper submitted! AI analysis in progress...');
      navigate('/my-papers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const tracks = ['General', 'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 
    'NLP', 'Cybersecurity', 'Systems', 'Software Engineering', 'Data Science'];

  return (
    <div className="page-content animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Submit Paper</h1>
          <p className="text-apple-gray-400 text-sm mt-1">
            Upload your research paper for AI-powered analysis and peer review
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF Upload */}
          <div className="apple-card">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} className="text-apple-blue" />
              Paper File
            </h2>

            {file ? (
              <div className="flex items-center gap-4 p-4 glass rounded-apple-sm border border-green-500/30 bg-green-500/5">
                <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-apple-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-apple-gray-500 hover:text-red-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-apple p-10 text-center transition-all duration-200 cursor-pointer ${
                  dragging
                    ? 'border-apple-blue bg-apple-blue/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <Upload size={32} className="text-apple-gray-500 mx-auto mb-3" />
                <p className="text-white font-medium">Drag & drop your PDF here</p>
                <p className="text-apple-gray-500 text-sm mt-1">or click to browse</p>
                <p className="text-apple-gray-600 text-xs mt-3">PDF format only • Max 20 MB</p>
              </div>
            )}
          </div>

          {/* Paper Details */}
          <div className="apple-card space-y-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <AlertCircle size={18} className="text-apple-blue" />
              Paper Details
            </h2>

            <div>
              <label className="block text-apple-gray-400 text-xs font-medium mb-1.5">Paper Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="Enter the full title of your paper"
                className="apple-input"
              />
            </div>

            <div>
              <label className="block text-apple-gray-400 text-xs font-medium mb-1.5">Abstract *</label>
              <textarea
                name="abstract"
                value={form.abstract}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Provide a concise summary of your research (min. 50 characters)"
                className="apple-input resize-none"
              />
              <p className="text-apple-gray-600 text-xs mt-1 text-right">{form.abstract.length} chars</p>
            </div>

            <div>
              <label className="block text-apple-gray-400 text-xs font-medium mb-1.5">Keywords</label>
              <input
                name="keywords"
                value={form.keywords}
                onChange={handleChange}
                placeholder="machine learning, deep learning, neural networks (comma-separated)"
                className="apple-input"
              />
            </div>

            <div>
              <label className="block text-apple-gray-400 text-xs font-medium mb-1.5">Conference Track</label>
              <div className="relative">
                <select
                  name="conferenceTrack"
                  value={form.conferenceTrack}
                  onChange={handleChange}
                  className="apple-select"
                  style={{ color: 'white' }}
                >
                  {tracks.map((t) => (
                    <option key={t} value={t} style={{ background: '#1c1c1e' }}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Analysis notice */}
          <div className="flex items-start gap-3 glass rounded-apple-sm px-4 py-3 border border-apple-blue/20">
            <div className="w-2 h-2 rounded-full bg-apple-blue mt-1.5 shrink-0 animate-pulse" />
            <p className="text-apple-gray-400 text-sm">
              Upon submission, our AI will automatically analyze your paper for grammar, clarity,
              and formatting compliance and generate a <span className="text-white font-medium">Paper Readiness Score</span>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit Paper
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitPaper;
