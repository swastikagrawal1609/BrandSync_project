import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, Plus, TrendingUp, DollarSign, 
  Building2, History, LogOut, Star, Lock, User as UserIcon, 
  RefreshCw, UserCircle, Save, Mail, Instagram, AlignLeft, Globe, Clock, CheckCircle2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const LoginPage = ({ onLogin }) => {
  const [role, setRole] = useState(''); 
  const [credentials, setCredentials] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return setError('Select a role');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: credentials.userId, role })
      });
      const result = await res.json();
      if (res.ok) onLogin({ ...result.user, role: result.role || role });
      else setError('Login failed. Check server connection.');
    } catch (err) {
      setError('Backend Server Offline');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans text-slate-200">
      <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <TrendingUp className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">BrandSync</h1>
          <p className="text-slate-400 mt-2 text-sm italic">"Bridging talent and influence."</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-3 gap-3">
            {['Artist', 'Manager', 'Brand'].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`p-4 rounded-2xl border-2 transition-all ${role === r ? 'bg-indigo-600 border-indigo-500 scale-105 text-white' : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:border-slate-600'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">{r}</span>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <input type="text" required value={credentials.userId} onChange={(e) => setCredentials({...credentials, userId: e.target.value})} placeholder="Username" className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
            <input type="password" required placeholder="Password" className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">
            {loading ? "Authenticating..." : "Enter Platform"}
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deals, setDeals] = useState([]);
  const [artists, setArtists] = useState([]);
  const [brands, setBrands] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  // Artist Profile State
  const [profileData, setProfileData] = useState({
    name: '', social_handle: '', email: '', bio: '', website_url: '', follower_count: 0, genre: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, a, b, l] = await Promise.all([
        fetch(`${API_BASE_URL}/deals`).then(r => r.json()),
        fetch(`${API_BASE_URL}/artists`).then(r => r.json()),
        fetch(`${API_BASE_URL}/brands`).then(r => r.json()),
        fetch(`${API_BASE_URL}/login-logs`).then(r => r.json())
      ]);
      setDeals(Array.isArray(d) ? d : []);
      setArtists(Array.isArray(a) ? a : []);
      setBrands(Array.isArray(b) ? b : []);
      setLogs(Array.isArray(l) ? l : []);
      
      if (user?.role === 'Artist') {
        const myData = (Array.isArray(a) ? a : []).find(art => art.name === user.name);
        if (myData) setProfileData(myData);
      }
    } catch (e) { console.error("Sync Error:", e); }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateStatus('Saving...');
    try {
      const res = await fetch(`${API_BASE_URL}/artists/${profileData.artist_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setUpdateStatus('Profile Updated!');
        fetchData();
        setTimeout(() => setUpdateStatus(''), 3000);
      }
    } catch (err) { setUpdateStatus('Error saving.'); }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await fetch(`${API_BASE_URL}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.get('title'),
          budget: data.get('budget'),
          brand_id: data.get('brand_id'),
          artist_id: data.get('artist_id'),
          start_date: data.get('date')
        })
      });
      fetchData();
      setShowModal(false);
    } catch (err) { console.error("Transaction Error:", err); }
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  const isArtist = user.role === 'Artist';
  const isManager = user.role === 'Manager';
  const isBrand = user.role === 'Brand';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 shrink-0">
        <div className="flex items-center space-x-3 mb-12">
          <TrendingUp className="text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight">BrandSync</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-4 p-4 rounded-xl ${activeTab === 'overview' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20}/><span>Dashboard</span></button>
          <button onClick={() => setActiveTab('deals')} className={`w-full flex items-center space-x-4 p-4 rounded-xl ${activeTab === 'deals' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Briefcase size={20}/><span>Campaigns</span></button>
          
          {isArtist ? (
             <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 p-4 rounded-xl ${activeTab === 'profile' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><UserCircle size={20}/><span>My Profile</span></button>
          ) : (
             <button onClick={() => setActiveTab('artists')} className={`w-full flex items-center space-x-4 p-4 rounded-xl ${activeTab === 'artists' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20}/><span>Talent Directory</span></button>
          )}
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Role: {user.role}</p>
          <button onClick={() => setUser(null)} className="flex items-center text-red-400 text-sm font-bold"><LogOut size={16} className="mr-2"/>Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold capitalize tracking-tight text-slate-800">{activeTab.replace('_', ' ')}</h2>
          <div className="flex items-center space-x-4">
            <button onClick={fetchData} className={`p-2 hover:bg-white rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}><RefreshCw size={20}/></button>
            {isManager && (
              <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg transition-transform active:scale-95"><Plus size={18} className="mr-2"/> New Deal</button>
            )}
          </div>
        </header>

        {activeTab === 'profile' && isArtist && (
          <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center space-x-6 mb-10 pb-10 border-b border-slate-50">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-bold shadow-xl">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{profileData.name}</h3>
                  <p className="text-indigo-600 font-bold">{profileData.social_handle}</p>
                  <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Database ID: #ART-{profileData.artist_id}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><Mail size={14}/> Email Address</label>
                    <input type="email" value={profileData.email || ''} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><Instagram size={14}/> Social Handle</label>
                    <input type="text" value={profileData.social_handle || ''} onChange={e => setProfileData({...profileData, social_handle: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><Users size={14}/> Total Fans (Followers)</label>
                    <input type="number" value={profileData.follower_count || 0} onChange={e => setProfileData({...profileData, follower_count: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><Globe size={14}/> Website URL</label>
                    <input type="text" value={profileData.website_url || ''} onChange={e => setProfileData({...profileData, website_url: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><AlignLeft size={14}/> Bio / Portfolio Description</label>
                  <textarea rows="4" value={profileData.bio || ''} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl outline-none focus:ring-2 ring-indigo-500/20 font-bold" placeholder="Tell brands about your influence..."></textarea>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{updateStatus}</p>
                  <button type="submit" className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
                    <Save size={18}/> Update SQL Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Briefcase size={24}/></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Campaigns</p><h3 className="text-3xl font-bold">{deals.length}</h3></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="p-4 bg-purple-50 rounded-2xl text-purple-600"><Users size={24}/></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Talent Pool</p><h3 className="text-3xl font-bold">{artists.length}</h3></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><Building2 size={24}/></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Brands</p><h3 className="text-3xl font-bold">{brands.length}</h3></div>
                </div>
             </div>
             
             {isManager && (
               <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm p-8">
                  <h3 className="font-bold mb-6 flex items-center text-slate-800 tracking-tight"><History size={18} className="mr-2 text-indigo-500"/> System Activity Logs</h3>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((l, i) => (
                      <div key={i} className="flex justify-between items-center py-4 px-6 bg-slate-50 rounded-2xl text-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                        <span className="font-bold text-slate-700">{l.user_id} <span className="text-slate-400 font-normal ml-2">logged in as</span> {l.role}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{new Date(l.login_timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="grid gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {deals.map(d => (
              <div key={d.deal_id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm hover:border-indigo-200 transition-all group">
                <div className="flex items-center space-x-8">
                  <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><Briefcase size={24}/></div>
                  <div><h4 className="font-bold text-xl tracking-tight text-slate-800">{d.campaign_title}</h4><p className="text-slate-400 text-sm font-medium">{d.brand_name || 'Brand Campaign'}</p></div>
                </div>
                <div className="text-right font-black text-2xl tracking-tight text-indigo-600 font-mono">${parseFloat(d.total_budget || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'artists' && !isArtist && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {artists.map(a => (
              <div key={a.artist_id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center flex flex-col group hover:border-indigo-300 transition-all">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all"><Star size={32}/></div>
                <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{a.name}</h4>
                <p className="text-indigo-600 font-bold text-xs mt-2 uppercase tracking-widest">{a.social_handle}</p>
                <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex flex-col"><span className="text-slate-800 text-lg font-bold lowercase tracking-normal">{a.follower_count?.toLocaleString()}</span><span>fans</span></div>
                  <div className="flex flex-col text-right"><span className="text-slate-800 text-lg font-bold lowercase tracking-normal">{a.genre || 'General'}</span><span>genre</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Initiation Modal - Accessible ONLY to Managers */}
      {showModal && isManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold tracking-tight">Initiate New Campaign</h3>
            <form onSubmit={handleCreateDeal} className="space-y-6">
              <input name="title" required placeholder="Campaign Title" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-sm focus:ring-2 ring-indigo-500/20" />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Relational Link: Brand</label>
                  <select name="brand_id" required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-sm bg-white">
                    <option value="">Select Brand Entity</option>
                    {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.company_name} (ID: {b.brand_id})</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Relational Link: Artist</label>
                  <select name="artist_id" required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-sm bg-white">
                    <option value="">Select Talent Partner</option>
                    {artists.map(a => <option key={a.artist_id} value={a.artist_id}>{a.name} ({a.social_handle})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input name="budget" required type="number" placeholder="Budget ($)" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-sm focus:ring-2 ring-indigo-500/20" />
                <input name="date" type="date" required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-sm focus:ring-2 ring-indigo-500/20" />
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Commit SQL Transaction</button>
            </form>
            <button onClick={() => setShowModal(false)} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancel Initiation</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;