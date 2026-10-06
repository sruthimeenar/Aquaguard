"""
Inference Script for Water Quality Index (WQI) Prediction
===========================================================
Used by Person B's backend or web application to make consistent WQI predictions.
Reads JSON input from CLI argument or stdin, passes through saved preprocessing pipeline,
and outputs predicted WQI, risk category, and parameter sub-index breakdown.
"""

import sys
import json
import os
import joblib
import pandas as pd
import numpy as np

# Ensure custom preprocessor class is loadable by joblib
from preprocessing import WaterQualityPreprocessor, compute_weighted_arithmetic_wqi

def predict_sample(sample_dict):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'models', 'model.joblib')
    pipeline_path = os.path.join(base_dir, 'models', 'pipeline.joblib')

    if not os.path.exists(model_path) or not os.path.exists(pipeline_path):
        # Fallback to direct analytical WQI calculation if model file missing
        wqi, category, breakdown = compute_weighted_arithmetic_wqi(sample_dict)
        return {
            'predicted_wqi': wqi,
            'calculated_analytical_wqi': wqi,
            'category': category,
            'breakdown': breakdown,
            'inference_engine': 'analytical_fallback'
        }

    # Load fitted preprocessor and LightGBM model
    preprocessor = joblib.load(pipeline_path)
    model = joblib.load(model_path)

    # Preprocess incoming raw sample
    X_single = preprocessor.transform_single_sample(sample_dict)

    # ML Prediction
    predicted_wqi = float(model.predict(X_single)[0])
    
    # Calculate analytical reference & breakdown
    analytical_wqi, category, breakdown = compute_weighted_arithmetic_wqi(sample_dict)

    return {
        'predicted_wqi': round(predicted_wqi, 2),
        'calculated_analytical_wqi': round(analytical_wqi, 2),
        'category': category,
        'breakdown': breakdown,
        'inference_engine': 'LightGBM Regressor (Optuna Tuned)'
    }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
        try:
            sample_data = json.loads(raw_input)
            result = predict_sample(sample_data)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(json.dumps({'error': str(e)}))
    else:
        # Demo sample
        sample = {
            'Potential of Hydrogen (pH)': 7.5,
            'Dissolved oxygen (mg/L)': 6.2,
            'Total Dissolved Solids (mg/L)': 450.0,
            'Chloride (mg/L)': 120.0,
            'Nitrate N (mgN/L)': 1.5,
            'Total Alkalinity (mg/L as CaCO3)': 190.0,
            'Hardness Calcium (mgCaCO3/L)': 80.0,
            'Hardness_Magnesium (mg/L as CaCO3)': 35.0,
            'Amonia N (mgN/L)': 0.5,
            'Iron(mg/L)': 0.2
        }
        res = predict_sample(sample)
        print("Demo Sample Prediction:")
        print(json.dumps(res, indent=2))
