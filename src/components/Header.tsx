import React from 'react';
import { Droplets, Activity, Database, Code, Cpu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  metrics: any;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, metrics }) => {
  const tabs = [
    { id: 'predictor', label: 'Analytics Dashboard', icon: Droplets },
    { id: 'evaluation', label: 'Model Metrics & Plots', icon: Activity },
    { id: 'dataset', label: 'Dataset Explorer', icon: Database },
    { id: 'person_b', label: 'Pipeline Configuration', icon: Code },
    { id: 'pipeline', label: 'Model Repository', icon: Cpu },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 shrink-0 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner text-white">
              <Droplets className="w-5 h-5 fill-current text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  AQUAGUARD <span className="text-blue-400 font-normal text-sm ml-0.5">v2.1</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] px-2 py-0.5 rounded-full font-medium">
                  <ShieldCheck className="w-3 h-3" /> LightGBM + Optuna
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block -mt-0.5">
                Water Quality Index (WQI) Contamination & Assessment System
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-5 transition-all flex items-center gap-1.5 border-b-2 font-medium text-xs lg:text-sm ${
                    isActive
                      ? 'text-blue-400 border-blue-400 font-semibold'
                      : 'text-slate-300 border-transparent hover:text-white hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* System Status & Metrics */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">System Status</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Operational
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">R² Score</span>
                <span className="font-bold font-mono text-emerald-400">
                  {metrics?.R2 ? metrics.R2.toFixed(4) : '0.9962'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-700 mx-1"></div>
              <div>
                <span className="text-slate-400 text-[10px] block">RMSE</span>
                <span className="font-bold font-mono text-blue-300">
                  {metrics?.RMSE ? metrics.RMSE.toFixed(3) : '1.605'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
