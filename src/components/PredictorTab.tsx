import React, { useState } from 'react';
import { WaterSampleInput, PredictionResult } from '../types';
import { Play, Sparkles, AlertTriangle, CheckCircle2, Info, RefreshCw, Gauge, Download, Sliders } from 'lucide-react';

export const PredictorTab: React.FC = () => {
  const [formData, setFormData] = useState<WaterSampleInput>({
    'Potential of Hydrogen (pH)': 7.4,
    'Dissolved oxygen (mg/L)': 6.8,
    'Total Dissolved Solids (mg/L)': 450,
    'Chloride (mg/L)': 120,
    'Nitrate N (mgN/L)': 1.8,
    'Total Alkalinity (mg/L as CaCO3)': 180,
    'Hardness Calcium (mgCaCO3/L)': 85,
    'Hardness_Magnesium (mg/L as CaCO3)': 35,
    'Amonia N (mgN/L)': 0.4,
    'Iron(mg/L)': 0.15,
    'Arsenic (mg/L)': 0.001,
    'Lead (mg/L)': 0.002,
    'District': 'Erode',
    'Month': 9
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const presets = [
    {
      name: 'Pristine Drinking Source',
      data: {
        'Potential of Hydrogen (pH)': 7.1,
        'Dissolved oxygen (mg/L)': 8.5,
        'Total Dissolved Solids (mg/L)': 180,
        'Chloride (mg/L)': 45,
        'Nitrate N (mgN/L)': 0.4,
        'Total Alkalinity (mg/L as CaCO3)': 90,
        'Hardness Calcium (mgCaCO3/L)': 40,
        'Hardness_Magnesium (mg/L as CaCO3)': 15,
        'Amonia N (mgN/L)': 0.05,
        'Iron(mg/L)': 0.02,
        'Arsenic (mg/L)': 0,
        'Lead (mg/L)': 0,
        'District': 'Nilgiris',
        'Month': 5
      }
    },
    {
      name: 'Borewell Groundwater',
      data: {
        'Potential of Hydrogen (pH)': 7.6,
        'Dissolved oxygen (mg/L)': 5.2,
        'Total Dissolved Solids (mg/L)': 680,
        'Chloride (mg/L)': 210,
        'Nitrate N (mgN/L)': 4.2,
        'Total Alkalinity (mg/L as CaCO3)': 240,
        'Hardness Calcium (mgCaCO3/L)': 140,
        'Hardness_Magnesium (mg/L as CaCO3)': 65,
        'Amonia N (mgN/L)': 0.6,
        'Iron(mg/L)': 0.4,
        'Arsenic (mg/L)': 0.005,
        'Lead (mg/L)': 0.008,
        'District': 'Thoothukudi',
        'Month': 10
      }
    },
    {
      name: 'Industrial Textile Effluent Drain',
      data: {
        'Potential of Hydrogen (pH)': 8.9,
        'Dissolved oxygen (mg/L)': 1.8,
        'Total Dissolved Solids (mg/L)': 2200,
        'Chloride (mg/L)': 650,
        'Nitrate N (mgN/L)': 18.5,
        'Total Alkalinity (mg/L as CaCO3)': 520,
        'Hardness Calcium (mgCaCO3/L)': 320,
        'Hardness_Magnesium (mg/L as CaCO3)': 180,
        'Amonia N (mgN/L)': 8.4,
        'Iron(mg/L)': 2.8,
        'Arsenic (mg/L)': 0.035,
        'Lead (mg/L)': 0.08,
        'District': 'Salem',
        'Month': 8
      }
    }
  ];

  const handleInputChange = (field: keyof WaterSampleInput, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof val === 'number' ? (isNaN(val) ? 0 : val) : val
    }));
  };

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetData: any) => {
    setFormData(presetData);
    setResult(null);
  };

  const getWqiColor = (wqi: number) => {
    if (wqi <= 25) return { text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (wqi <= 50) return { text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (wqi <= 75) return { text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (wqi <= 100) return { text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { text: 'text-red-600', badge: 'bg-red-100 text-red-800 border-red-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Water Quality Assessment & Live WQI Predictor</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Input chemical parameter measurements to obtain instant LightGBM WQI predictions, contamination classifications, and health advisories.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p.data)}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handlePredict} className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Chemical & Biological Parameters
                </h3>
                <p className="text-xs text-slate-500">Validated against BIS IS 10500 drinking water standards</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold">
                10 Parameters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* pH */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">pH Level</label>
                  <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {formData['Potential of Hydrogen (pH)']}
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="11.0"
                  step="0.1"
                  value={formData['Potential of Hydrogen (pH)']}
                  onChange={(e) => handleInputChange('Potential of Hydrogen (pH)', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Acidic (4.0)</span>
                  <span>Ideal (7.0)</span>
                  <span>Alkaline (11.0)</span>
                </div>
              </div>

              {/* DO */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Dissolved Oxygen (DO)</label>
                  <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {formData['Dissolved oxygen (mg/L)']} mg/L
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12.0"
                  step="0.1"
                  value={formData['Dissolved oxygen (mg/L)']}
                  onChange={(e) => handleInputChange('Dissolved oxygen (mg/L)', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Anoxic (&lt;2.0)</span>
                  <span>Standard (5.0)</span>
                  <span>High (12.0)</span>
                </div>
              </div>

              {/* TDS */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Total Dissolved Solids (TDS)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData['Total Dissolved Solids (mg/L)']}
                    onChange={(e) => handleInputChange('Total Dissolved Solids (mg/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 500 mg/L</span>
              </div>

              {/* Chloride */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chloride</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData['Chloride (mg/L)']}
                    onChange={(e) => handleInputChange('Chloride (mg/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 250 mg/L</span>
              </div>

              {/* Nitrate N */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nitrate N</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData['Nitrate N (mgN/L)']}
                    onChange={(e) => handleInputChange('Nitrate N (mgN/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mgN/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 45 mgN/L</span>
              </div>

              {/* Total Alkalinity */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Total Alkalinity</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData['Total Alkalinity (mg/L as CaCO3)']}
                    onChange={(e) => handleInputChange('Total Alkalinity (mg/L as CaCO3)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 200 mg/L</span>
              </div>

              {/* Hardness Calcium */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Calcium Hardness</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData['Hardness Calcium (mgCaCO3/L)']}
                    onChange={(e) => handleInputChange('Hardness Calcium (mgCaCO3/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 75 mg/L</span>
              </div>

              {/* Hardness Magnesium */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Magnesium Hardness</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData['Hardness_Magnesium (mg/L as CaCO3)']}
                    onChange={(e) => handleInputChange('Hardness_Magnesium (mg/L as CaCO3)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 30 mg/L</span>
              </div>

              {/* Ammonia N */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ammonia N</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    value={formData['Amonia N (mgN/L)']}
                    onChange={(e) => handleInputChange('Amonia N (mgN/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mgN/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 0.5 mgN/L</span>
              </div>

              {/* Iron */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Iron (Fe)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData['Iron(mg/L)']}
                    onChange={(e) => handleInputChange('Iron(mg/L)', parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Permissible Limit: 0.3 mg/L</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing LightGBM Assessment...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Assess Water Quality & Calculate WQI
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  Assessment Output
                </h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                  {result.inference_engine || 'LightGBM Regressor'}
                </span>
              </div>

              {/* Gauge Banner */}
              <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
                  Predicted Water Quality Index (WQI)
                </p>
                <div className={`text-4xl font-extrabold my-2 font-mono ${getWqiColor(result.predicted_wqi).text}`}>
                  {result.predicted_wqi.toFixed(2)}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getWqiColor(result.predicted_wqi).badge}`}>
                  {result.category}
                </div>
              </div>

              {/* Reference Comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block">LightGBM Model</span>
                  <span className="text-lg font-bold font-mono text-slate-800">{result.predicted_wqi.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block">CPCB Index Standard</span>
                  <span className="text-lg font-bold font-mono text-slate-800">{result.calculated_analytical_wqi?.toFixed(2)}</span>
                </div>
              </div>

              {/* Advisory Box */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                result.predicted_wqi <= 50
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : result.predicted_wqi <= 100
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {result.predicted_wqi <= 50 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  Environmental Health Assessment
                </div>
                {result.predicted_wqi <= 25 && "Water meets all domestic and drinking standards. Pristine source with no chemical treatment required."}
                {result.predicted_wqi > 25 && result.predicted_wqi <= 50 && "Acceptable quality for municipal supply. Conventional filtration & chlorination recommended."}
                {result.predicted_wqi > 50 && result.predicted_wqi <= 75 && "Poor water quality. High dissolved solids or mineral hardness. Reverse Osmosis (RO) filtration required."}
                {result.predicted_wqi > 75 && result.predicted_wqi <= 100 && "Very poor water quality. Not suitable for direct drinking without advanced industrial purification."}
                {result.predicted_wqi > 100 && "Severe contamination detected. Unsafe for human or livestock consumption. Immediate environmental remediation required."}
              </div>

              {/* Sub-index parameter table */}
              {result.breakdown && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Parameter Sub-Index Breakdown ($q_i$)</h4>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {Object.entries(result.breakdown).map(([param, rawData]) => {
                      const data = rawData as { value: number; sub_index: number; status: string };
                      return (
                        <div key={param} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-slate-700 font-medium">{param}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500">{data.value}</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                              data.sub_index <= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              q_i = {data.sub_index}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden shadow-sm space-y-4">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Model Summary
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                The LightGBM Regressor was trained on a robust dataset of 2,260 water samples across Tamil Nadu river basins and groundwater stations. We achieved high predictive accuracy ($R^2 = 0.996$) by implementing recursive feature elimination and Bayesian optimization via Optuna.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Dataset Records</div>
                  <div className="text-xl font-extrabold text-white font-mono">2,260</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Cross-Val R²</div>
                  <div className="text-xl font-extrabold text-green-400 font-mono">0.995</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
