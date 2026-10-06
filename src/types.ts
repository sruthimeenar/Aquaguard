export interface WaterSampleInput {
  'Potential of Hydrogen (pH)': number;
  'Dissolved oxygen (mg/L)': number;
  'Total Dissolved Solids (mg/L)': number;
  'Chloride (mg/L)': number;
  'Nitrate N (mgN/L)': number;
  'Total Alkalinity (mg/L as CaCO3)': number;
  'Hardness Calcium (mgCaCO3/L)': number;
  'Hardness_Magnesium (mg/L as CaCO3)': number;
  'Amonia N (mgN/L)': number;
  'Iron(mg/L)': number;
  'Arsenic (mg/L)'?: number;
  'Lead (mg/L)'?: number;
  'District'?: string;
  'Month'?: number;
}

export interface ParameterBreakdownItem {
  value: number;
  sub_index: number;
  status: string;
}

export interface PredictionResult {
  predicted_wqi: number;
  calculated_analytical_wqi: number;
  category: string;
  breakdown?: Record<string, ParameterBreakdownItem>;
  inference_engine?: string;
}

export interface EvaluationMetrics {
  MAE: number;
  MSE: number;
  RMSE: number;
  R2: number;
  Adjusted_R2: number;
  CV_R2_Mean: number;
  CV_R2_Std: number;
  CV_RMSE_Mean: number;
  CV_RMSE_Std: number;
  Best_Optuna_Trial: number;
  Best_Optuna_Value_RMSE: number;
  Optuna_Best_Params: Record<string, any>;
}

export interface DatasetMetadata {
  total_records_raw: number;
  total_records_cleaned: number;
  num_features: number;
  feature_names: string[];
  target_variable: string;
  wqi_stats: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  category_distribution: Record<string, number>;
  districts_covered: string[];
  stations_count: number;
  year_range: number[];
}

export interface StationRecord {
  _id: number;
  SlNo: number;
  Station: string;
  District: string;
  Tehsil: string;
  Latitude: number;
  Longitude: number;
  'Data Acquisition Time': string;
  'Potential of Hydrogen (pH)': number;
  'Dissolved oxygen (mg/L)': number;
  'Total Dissolved Solids (mg/L)': number;
  'Chloride (mg/L)': number;
  'Nitrate N (mgN/L)': number;
  'Total Alkalinity (mg/L as CaCO3)': number;
  'Hardness Calcium (mgCaCO3/L)': number;
  'Hardness_Magnesium (mg/L as CaCO3)': number;
  'Amonia N (mgN/L)': number;
  'Iron(mg/L)': number;
  Year: number;
  Month: number;
}

export interface ShapValueItem {
  feature: string;
  mean_abs_shap: number;
}
