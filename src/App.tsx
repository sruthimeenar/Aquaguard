import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PredictorTab } from './components/PredictorTab';
import { ModelEvaluationTab } from './components/ModelEvaluationTab';
import { DatasetExplorerTab } from './components/DatasetExplorerTab';
import { PersonBHandoffTab } from './components/PersonBHandoffTab';
import { PipelineExecutionTab } from './components/PipelineExecutionTab';
import { EvaluationMetrics } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('predictor');
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);

  useEffect(() => {
    // Fetch model evaluation metrics on mount
    fetch('/api/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.R2) {
          setMetrics(data);
        }
      })
      .catch((err) => {
        console.warn('Backend metrics fetch fallback:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} metrics={metrics} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'predictor' && <PredictorTab />}
        {activeTab === 'evaluation' && <ModelEvaluationTab metrics={metrics} />}
        {activeTab === 'dataset' && <DatasetExplorerTab />}
        {activeTab === 'person_b' && <PersonBHandoffTab />}
        {activeTab === 'pipeline' && <PipelineExecutionTab />}
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            AQUAGUARD Intelligent Water Quality Assessment System v2.1
          </div>
          <div>
            Engineered with <span className="font-semibold text-slate-700">LightGBM Regressor</span> & <span className="font-semibold text-slate-700">Optuna Bayesian Optimization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
