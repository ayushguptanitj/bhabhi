import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Building2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'author', affiliation: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isLogin
        ? await login(form.email, form.password)
        : await register(form);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/20 via-[#5856d6]/10 to-black" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-[0.03]"
              style={{
                width: Math.random() * 400 + 100,
                height: Math.random() * 400 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: 'white',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-apple-blue flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">ConferenceMS</h2>
              <p className="text-apple-gray-500 text-xs">Management System</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Academic<br />Conference<br />
                <span className="gradient-text-blue">Made Simple.</span>
              </h1>
              <p className="text-apple-gray-400 text-lg mt-4 leading-relaxed">
                Submit papers, manage reviews, and schedule presentations — all in one place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Papers Submitted', value: '2,400+' },
                { label: 'Conferences Hosted', value: '180+' },
                { label: 'Reviewers', value: '900+' },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-apple-sm p-4 text-center">
                  <div className="text-white font-bold text-xl">{value}</div>
                  <div className="text-apple-gray-500 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-apple-gray-600 text-xs">© 2024 ConferenceMS. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-apple p-8 shadow-apple-xl">
            {/* Mode toggle */}
            <div className="flex glass rounded-full p-1 mb-8">
              {['Login', 'Register'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIsLogin(mode === 'Login')}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    (mode === 'Login') === isLogin
                      ? 'bg-apple-blue text-white shadow-lg'
                      : 'text-apple-gray-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-apple-gray-400 text-sm">
                {isLogin
                  ? 'Sign in to your conference account'
                  : 'Join the conference management platform'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Full name"
                    className="apple-input pl-11"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                  className="apple-input pl-11"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Password"
                  className="apple-input pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!isLogin && (
                <>
                  <div className="relative">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="apple-select"
                      style={{ color: form.role ? 'white' : '#86868b' }}
                    >
                      <option value="author" style={{ background: '#1c1c1e' }}>Author</option>
                      <option value="reviewer" style={{ background: '#1c1c1e' }}>Reviewer</option>
                      <option value="chairperson" style={{ background: '#1c1c1e' }}>Chairperson</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-gray-500 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500" />
                    <input
                      name="affiliation"
                      value={form.affiliation}
                      onChange={handleChange}
                      placeholder="Institution / Affiliation (optional)"
                      className="apple-input pl-11"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
