import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { getEmployeeStats } from '../services/apiService';

const data = [
  { name: 'Jan', active: 45, resign: 5 },
  { name: 'Feb', active: 52, resign: 8 },
  { name: 'Mar', active: 48, resign: 12 },
  { name: 'Apr', active: 61, resign: 7 },
  { name: 'May', active: 55, resign: 10 },
  { name: 'Jun', active: 67, resign: 4 },
];

const StatCard = ({ title, value, icon, color, subText, subColor }: any) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
    <div className={`absolute -right-2 -top-2 p-8 opacity-5 group-hover:scale-110 transition-transform ${color}`}>
      <i className={`fa-solid ${icon} text-8xl`}></i>
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-4xl font-bold mt-2 text-slate-800">{value}</h3>
    </div>
    {subText && (
      <div className={`flex items-center gap-1.5 text-xs font-bold ${subColor || 'text-slate-400'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${subColor?.replace('text-', 'bg-') || 'bg-slate-400'}`}></div>
        {subText}
      </div>
    )}
  </div>
);

const QueueWidget = ({ title, inCount, outCount, overdue, color }: any) => (
  <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 flex-1">
    <div className="flex items-center justify-between mb-8">
      <h4 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-slate-800">
        <div className={`w-3 h-3 rounded-full ${color} shadow-lg shadow-current`}></div>
        {title}
      </h4>
      {overdue > 0 && (
        <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter animate-pulse">
          {overdue} OVERDUE
        </span>
      )}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">REGISTER IN</p>
        <div className="flex items-baseline gap-2">
           <p className="text-3xl font-black text-slate-800">{inCount}</p>
           <span className="text-[10px] text-slate-400">Cases</span>
        </div>
      </div>
      <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">REGISTER OUT</p>
        <div className="flex items-baseline gap-2">
           <p className="text-3xl font-black text-slate-800">{outCount}</p>
           <span className="text-[10px] text-slate-400">Cases</span>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  // State to hold the API data
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPendingDetail, setShowPendingDetail] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load dashboard data. Make sure Django backend is running on port 8000.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty dependency array = run once on mount

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white text-xl">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3 className="font-bold text-rose-900 text-lg">Connection Error</h3>
            <p className="text-rose-700 text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-rose-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-rose-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no stats data yet, show a message
  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }

  // Calculate sync rate (just a dummy calculation for now)
  const syncRate = stats.total_employees > 0 
    ? Math.round((stats.total_employees / (stats.total_employees + stats.pending_actions)) * 100) 
    : 0;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Employees" 
          value={stats.total_employees.toLocaleString()} 
          icon="fa-users" 
          color="text-blue-500" 
          subText={`${syncRate}% Sync rate`} 
        />
        <StatCard 
          title="New Joiners" 
          value={stats.new_joiners} 
          icon="fa-user-plus" 
          color="text-emerald-500" 
          subText="This month" 
          subColor="text-emerald-500" 
        />
        <StatCard 
          title="Resignations" 
          value={stats.resignations} 
          icon="fa-user-minus" 
          color="text-rose-500" 
          subText="This month" 
          subColor="text-rose-500" 
        />
        <div className="relative">
          <div onClick={() => setShowPendingDetail(prev => !prev)} className="cursor-pointer">
            <StatCard
              title="Pending Action"
              value={stats.pending_actions}
              icon="fa-clock"
              color="text-amber-500"
              subText={stats.pending_actions > 0 ? "Needs attention" : "All clear"}
              subColor={stats.pending_actions > 0 ? "text-amber-500" : "text-emerald-500"}
            />
          </div>

          {showPendingDetail && (
            <>
              {/* Backdrop to close on outside click */}
              <div className="fixed inset-0 z-10" onClick={() => setShowPendingDetail(false)} />

              {/* Popover panel */}
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-6 py-4 border-b border-slate-50">
                  <p classname="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Breakdown</p>
                </div>

                {[
                  { label: 'SSF Register In', count: stats.ssf_queue.register_in, color: 'bg-blue-500', tab: 'employee' },
                  { label: 'AIA Register In', count: stats.aia_queue.register_in, color: 'bg-rose-500', tab: 'employee' },
                  { label: 'SSF Exits', count: stats.ssf_queue.register_out, color: 'bg-blue-300', tab: 'employee' },
                  { label: 'AIA Exits', count: stats.aia_queue.register_out, color: 'bg-rose-300', tab: 'employee' },
                ].map(row => (
                  <button 
                    key={row.label}
                    onClick={() => {setActiveTab(row.tab); setShowPendingDetail(false); }}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${row.color}`}></div>
                      <span className="text-xs font-bold text-slate-600">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${row.count > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {row.count}
                      </span>
                      <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                    </div>
                  </button>
                ))}

                <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-black text-slate-700">{stats.pending_actions}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QueueWidget 
          title="Social Security (SSF)" 
          inCount={stats.ssf_queue.register_in} 
          outCount={stats.ssf_queue.register_out} 
          overdue={0} 
          color="bg-blue-500" 
        />
        <QueueWidget 
          title="Group Insurance (AIA)" 
          inCount={stats.aia_queue.register_in} 
          outCount={stats.aia_queue.register_out} 
          overdue={0} 
          color="bg-rose-500" 
        />
      </div>
    </div>
  );
};

export default Dashboard;