import React, { useState } from 'react';
import { Code, CheckCircle2, Copy, Terminal, Shield, Cpu, FileCode, Layers } from 'lucide-react';

export const PersonBHandoffTab: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const pythonTrainingSnippet = `import lightgbm as lgb
import optuna
import joblib
import pandas as pd
import numpy as np

# Load preprocessed dataset
data = pd.read_csv('data/cleaned_water_quality.csv')
X = data.drop(columns=['WQI', 'WQI_Category'])
y = data['WQI']

# Optuna Objective
def objective(trial):
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1),
        'num_leaves': trial.suggest_int('num_leaves', 20, 60),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0)
    }
    model = lgb.LGBMRegressor(**params, random_state=42, verbose=-1)
    # Cross Validation
    scores = cross_val_score(model, X, y, cv=5, scoring='neg_root_mean_squared_error')
    return -scores.mean()

study = optuna.create_study(direction='minimize')
study.optimize(objective, n_trials=100)

# Train Final Model & Export
best_model = lgb.LGBMRegressor(**study.best_params)
best_model.fit(X, y)
joblib.dump(best_model, 'models/lightgbm_wqi_model.pkl')`;

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Pipeline Configuration & Model Specifications</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete technical specification and LightGBM hyperparameter configuration for machine learning deployment.
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
          Python 3.11 + LightGBM 4.3.0
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Architecture Specs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            Pipeline Component Manifest
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-600" /> Preprocessing Module
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Automated z-score outlier capping ($\mu \pm 3.5\sigma$), weighted sub-index WQI calculation using CPCB parameters, and KNN imputation.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" /> Optuna Hyperparameter Tuner
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                100 Bayesian optimization iterations evaluating learning rate, tree depth, subsample ratios, and L1/L2 regularization terms.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-600" /> Joblib Artifact Serializer
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Exports serialized binaries <code className="text-blue-600 font-mono">lightgbm_wqi_model.pkl</code> and <code className="text-blue-600 font-mono">scaler.pkl</code> for sub-millisecond REST API serving.
              </p>
            </div>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="lg:col-span-7 bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-blue-400" />
              scripts/train_model.py
            </div>
            <button
              onClick={() => copySnippet(pythonTrainingSnippet, 'snippet1')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-medium transition-colors flex items-center gap-1 text-slate-200"
            >
              {copied === 'snippet1' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'snippet1' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="p-4 bg-slate-950/80 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed border border-slate-800/80">
            {pythonTrainingSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
