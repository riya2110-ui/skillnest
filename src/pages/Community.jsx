import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Heart, Share2, Plus, Filter, Search, 
  TrendingUp, Award, Users, ChevronRight, X, Send,
  Sparkles, Briefcase, GraduationCap
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const Community = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Post Form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'Interview Experience',
    company: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/forum');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/forum/${postId}/like`);
      setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    
    setSubmitting(true);
    try {
      const res = await api.post('/forum', newPost);
      setPosts([res.data, ...posts]);
      setShowAddModal(false);
      setNewPost({ title: '', content: '', type: 'Interview Experience', company: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesFilter = filter === 'All' || p.type === filter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const postTypes = [
    { name: 'All', icon: <Users size={16} />, color: 'bg-slate-100 text-slate-600' },
    { name: 'Success Story', icon: <Award size={16} />, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Interview Experience', icon: <Briefcase size={16} />, color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Question', icon: <MessageSquare size={16} />, color: 'bg-amber-100 text-amber-600' }
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] font-dm-sans">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar pb-20">
        <div className="max-w-5xl mx-auto px-8 py-10">
          
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-[var(--navy)] flex items-center gap-3">
                SkillNest Community <Sparkles className="text-indigo-500" />
              </h1>
              <p className="text-[var(--text-2)] mt-2 font-medium">Learn from peers, share your wins, and grow together.</p>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={18} /> Share Your Story
            </button>
          </header>

          {/* Filters & Search */}
          <section className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search experiences, companies, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-[var(--input-border)] rounded-2xl outline-none focus:border-indigo-500 shadow-sm transition-all text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {postTypes.map(pt => (
                <button
                  key={pt.name}
                  onClick={() => setFilter(pt.name)}
                  className={`px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-black transition-all whitespace-nowrap border ${
                    filter === pt.name 
                    ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/10' 
                    : 'bg-white text-slate-500 border-[var(--input-border)] hover:border-indigo-300'
                  }`}
                >
                  {pt.icon}
                  {pt.name}
                </button>
              ))}
            </div>
          </section>

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Gathering stories...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-[var(--input-border)] shadow-sm">
              <div className="text-6xl mb-6">🏜️</div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No stories found</h3>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto">Be the first one to share an experience and inspire the community!</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all"
              >
                + Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post, idx) => (
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={post._id}
                  className="bg-white rounded-[2rem] border border-[var(--input-border)] p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl">
                        {post.user?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {post.user?.firstName} {post.user?.lastName}
                          {post.type === 'Success Story' && <Award size={14} className="text-emerald-500" />}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {post.user?.profile?.role || 'Member'} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      post.type === 'Success Story' ? 'bg-emerald-50 text-emerald-600' :
                      post.type === 'Interview Experience' ? 'bg-indigo-50 text-indigo-600' :
                      post.type === 'Question' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {post.type}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-800 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  {post.company && (
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-indigo-500 bg-indigo-50/50 w-fit px-3 py-1 rounded-lg">
                      <Briefcase size={12} /> {post.company}
                    </div>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-3 md:line-clamp-none">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 text-xs font-black transition-all ${
                          post.likes?.includes(user?.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                        }`}
                      >
                        <Heart size={18} fill={post.likes?.includes(user?.id) ? 'currentColor' : 'none'} />
                        {post.likes?.length || 0}
                      </button>
                      <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 transition-all">
                        <MessageSquare size={18} />
                        {post.comments?.length || 0}
                      </button>
                    </div>
                    <button className="text-slate-300 hover:text-indigo-500 transition-all">
                      <Share2 size={18} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Post Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Share with SkillNest</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Your experience could be someone's breakthrough.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitPost} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type of Post</label>
                    <select 
                      value={newPost.type}
                      onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-700 transition-all appearance-none"
                    >
                      <option>Interview Experience</option>
                      <option>Success Story</option>
                      <option>Question</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Google, Amazon..."
                      value={newPost.company}
                      onChange={(e) => setNewPost({ ...newPost, company: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catchy Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. How I cleared the TCS Ninja OA with 0 prep"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-base transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content</label>
                  <textarea 
                    required
                    placeholder="Share the details, questions asked, or your feelings..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full h-48 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Post to Community <Send size={16} /></>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Community;
