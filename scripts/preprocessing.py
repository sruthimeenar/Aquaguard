"""
Water Quality Preprocessing & Feature Engineering Module
==========================================================
Provides end-to-end data cleaning, missing value imputation, outlier handling,
numerical range validation, feature engineering, and standard Water Quality Index (WQI) calculation.

Standard Method: Weighted Arithmetic Water Quality Index Method (CPCB / WHO / IS 10500 Standards).
Designed to save fitted preprocessing parameters into joblib/JSON for zero-skew Person B website integration.
"""

import numpy as np
import pandas as pd
import joblib
import json
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Recognized Standard Water Quality Permissible Limits (S_i), Ideal Values (V_ideal), and Weights (w_i)
# Based on WHO & BIS (IS 10500:2012) Drinking Water Standards
STANDARD_WQI_CONFIG = {
    'pH': {
        'column': 'Potential of Hydrogen (pH)',
        'S_i': 8.5,
        'V_ideal': 7.0,
        'weight': 0.219,
        'min_val': 0.0,
        'max_val': 14.0,
        'unit': 'pH units'
    },
    'Dissolved_Oxygen': {
        'column': 'Dissolved oxygen (mg/L)',
        'S_i': 5.0,  # Minimum required DO for healthy aquatic life/drinking source
        'V_ideal': 14.6, # Saturation DO at 0°C
        'weight': 0.3720,
        'min_val': 0.0,
        'max_val': 20.0,
        'unit': 'mg/L'
    },
    'TDS': {
        'column': 'Total Dissolved Solids (mg/L)',
        'S_i': 500.0,
        'V_ideal': 0.0,
        'weight': 0.0037,
        'min_val': 0.0,
        'max_val': 10000.0,
        'unit': 'mg/L'
    },
    'Chloride': {
        'column': 'Chloride (mg/L)',
        'S_i': 250.0,
        'V_ideal': 0.0,
        'weight': 0.0074,
        'min_val': 0.0,
        'max_val': 5000.0,
        'unit': 'mg/L'
    },
    'Nitrate': {
        'column': 'Nitrate N (mgN/L)',
        'S_i': 45.0,
        'V_ideal': 0.0,
        'weight': 0.0412,
        'min_val': 0.0,
        'max_val': 500.0,
        'unit': 'mgN/L'
    },
    'Alkalinity': {
        'column': 'Total Alkalinity (mg/L as CaCO3)',
        'S_i': 200.0,
        'V_ideal': 0.0,
        'weight': 0.0093,
        'min_val': 0.0,
        'max_val': 3000.0,
        'unit': 'mg/L'
    },
    'Calcium_Hardness': {
        'column': 'Hardness Calcium (mgCaCO3/L)',
        'S_i': 75.0,
        'V_ideal': 0.0,
        'weight': 0.0250,
        'min_val': 0.0,
        'max_val': 2000.0,
        'unit': 'mg/L'
    },
    'Magnesium_Hardness': {
        'column': 'Hardness_Magnesium (mg/L as CaCO3)',
        'S_i': 30.0,
        'V_ideal': 0.0,
        'weight': 0.0620,
        'min_val': 0.0,
        'max_val': 1000.0,
        'unit': 'mg/L'
    },
    'Ammonia': {
        'column': 'Amonia N (mgN/L)',
        'S_i': 0.5,
        'V_ideal': 0.0,
        'weight': 0.3720,
        'min_val': 0.0,
        'max_val': 100.0,
        'unit': 'mgN/L'
    },
    'Iron': {
        'column': 'Iron(mg/L)',
        'S_i': 0.3,
        'V_ideal': 0.0,
        'weight': 0.6200,
        'min_val': 0.0,
        'max_val': 50.0,
        'unit': 'mg/L'
    }
}


def compute_weighted_arithmetic_wqi(row_dict):
    """
    Computes standard Weighted Arithmetic Water Quality Index (WQI).
    WQI = Sum(q_i * w_i) / Sum(w_i)
    Where q_i = 100 * |V_i - V_ideal| / |S_i - V_ideal|
    """
    total_weighted_q = 0.0
    total_weights = 0.0
    parameter_breakdown = {}

    for param, config in STANDARD_WQI_CONFIG.items():
        col_name = config['column']
        if col_name in row_dict and row_dict[col_name] is not None and not np.isnan(row_dict[col_name]):
            val = float(row_dict[col_name])
            S_i = config['S_i']
            V_ideal = config['V_ideal']
            w_i = config['weight']

            if param == 'pH':
                q_i = 100.0 * abs(val - 7.0) / abs(8.5 - 7.0)
            elif param == 'Dissolved_Oxygen':
                # For DO, higher is better. Standard min is 5.0, ideal is 14.6
                q_i = 100.0 * abs(14.6 - val) / abs(14.6 - 5.0) if val <= 14.6 else 0.0
            else:
                q_i = 100.0 * (val / S_i)

            total_weighted_q += (q_i * w_i)
            total_weights += w_i
            parameter_breakdown[param] = {
                'value': val,
                'sub_index': round(q_i, 2),
                'status': 'Normal' if q_i <= 100 else 'Exceeds Standard Limit'
            }

    if total_weights == 0:
        return 50.0, "Unknown", parameter_breakdown

    wqi = total_weighted_q / total_weights

    # Categorization based on WQI score
    if wqi <= 25:
        category = "Excellent (Grade A - Safe for Drinking)"
    elif wqi <= 50:
        category = "Good (Grade B - Acceptable Water Quality)"
    elif wqi <= 75:
        category = "Poor (Grade C - Requires Filtration & Treatment)"
    elif wqi <= 100:
        category = "Very Poor (Grade D - Unsafe for Consumption)"
    else:
        category = "Severely Contaminated (Grade E - Non-potable/Hazardous)"

    return round(float(wqi), 2), category, parameter_breakdown


class WaterQualityPreprocessor:
    def __init__(self, handle_outliers=True, outlier_factor=1.5):
        self.handle_outliers = handle_outliers
        self.outlier_factor = outlier_factor
        self.feature_medians = {}
        self.group_medians = {}
        self.column_bounds = {}
        self.feature_names = []
        self.is_fitted = False

    def fit(self, df):
        """Learns missing value imputation statistics and validation bounds from training data."""
        logging.info("Fitting WaterQualityPreprocessor on dataset...")
        df_copy = df.copy()

        # Clean numerical columns
        numeric_cols = df_copy.select_dtypes(include=[np.number]).columns.tolist()

        # Store global medians
        for col in numeric_cols:
            med = df_copy[col].median()
            self.feature_medians[col] = float(med) if not np.isnan(med) else 0.0

            # Store lower and upper bounds for range validation
            q25 = df_copy[col].quantile(0.25)
            q75 = df_copy[col].quantile(0.75)
            iqr = q75 - q25
            lower_bound = max(0.0, q25 - self.outlier_factor * iqr) if col != 'Potential of Hydrogen (pH)' else max(0.0, q25 - self.outlier_factor * iqr)
            upper_bound = q75 + self.outlier_factor * iqr if iqr > 0 else df_copy[col].quantile(0.99)
            self.column_bounds[col] = {'lower': float(lower_bound), 'upper': float(upper_bound)}

        # Store district/station group medians if present
        if 'District' in df_copy.columns:
            for col in numeric_cols:
                grp_med = df_copy.groupby('District')[col].median().to_dict()
                self.group_medians[col] = {str(k): float(v) for k, v in grp_med.items() if not np.isnan(v)}

        self.is_fitted = True
        return self

    def clean_and_impute(self, df):
        """Performs missing value imputation, outlier clipping, range validation, and duplicate removal."""
        df_clean = df.copy()

        # 1. Remove duplicate rows
        init_len = len(df_clean)
        df_clean = df_clean.drop_duplicates()
        removed_dups = init_len - len(df_clean)
        if removed_dups > 0:
            logging.info(f"Removed {removed_dups} duplicate rows.")

        # 2. Numerical Range Validation
        for col, cfg in STANDARD_WQI_CONFIG.items():
            full_col = cfg['column']
            if full_col in df_clean.columns:
                min_v, max_val = cfg['min_val'], cfg['max_val']
                # Flag out-of-range impossible values as NaN to be imputed cleanly
                df_clean.loc[(df_clean[full_col] < min_v) | (df_clean[full_col] > max_val), full_col] = np.nan

        # 3. Impute Missing Values (Group Median by District, then Global Median)
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
        for col in numeric_cols:
            if col in self.feature_medians:
                # Group imputation
                if 'District' in df_clean.columns and col in self.group_medians:
                    grp_dict = self.group_medians[col]
                    df_clean[col] = df_clean.apply(
                        lambda r: grp_dict.get(str(r['District']), self.feature_medians[col]) if pd.isna(r[col]) else r[col],
                        axis=1
                    )
                # Fallback global median
                df_clean[col] = df_clean[col].fillna(self.feature_medians.get(col, 0.0))

        # 4. Outlier Handling via Clipping
        if self.handle_outliers:
            for col in numeric_cols:
                if col in self.column_bounds:
                    # Clip extreme numerical anomalies to 1.5*IQR bounds to preserve model stability
                    b = self.column_bounds[col]
                    df_clean[col] = df_clean[col].clip(lower=b['lower'], upper=b['upper'])

        return df_clean

    def engineer_features(self, df):
        """Creates physically meaningful hydrological and pollution index features."""
        df_fe = df.copy()

        # Hardness Ratio & Total Hardness
        ca_col = 'Hardness Calcium (mgCaCO3/L)'
        mg_col = 'Hardness_Magnesium (mg/L as CaCO3)'
        if ca_col in df_fe.columns and mg_col in df_fe.columns:
            df_fe['Total_Hardness'] = df_fe[ca_col] + df_fe[mg_col]
            df_fe['Ca_Mg_Hardness_Ratio'] = df_fe[ca_col] / (df_fe[mg_col] + 1e-5)

        # Dissolved Oxygen Deficit
        do_col = 'Dissolved oxygen (mg/L)'
        if do_col in df_fe.columns:
            df_fe['DO_Deficit'] = np.maximum(0.0, 14.6 - df_fe[do_col])

        # TDS to Chloride Salinity Proxy
        tds_col = 'Total Dissolved Solids (mg/L)'
        cl_col = 'Chloride (mg/L)'
        if tds_col in df_fe.columns and cl_col in df_fe.columns:
            df_fe['Salinity_Proxy'] = df_fe[tds_col] / (df_fe[cl_col] + 1e-5)

        # Heavy Metal Combined Index
        metal_cols = ['Arsenic (mg/L)', 'Cadmium (mg/L)', 'Chromium (mg/L)', 'Lead (mg/L)', 'Mercury(mg/L)', 'Zinc (mg/L)', 'Manganese (mg/L)']
        present_metals = [c for c in metal_cols if c in df_fe.columns]
        if present_metals:
            df_fe['Heavy_Metal_Sum'] = df_fe[present_metals].sum(axis=1)

        # Seasonal Encoding
        if 'Month' in df_fe.columns:
            df_fe['Season_Monsoon'] = df_fe['Month'].isin([6, 7, 8, 9]).astype(int)
            df_fe['Season_PostMonsoon'] = df_fe['Month'].isin([10, 11, 12]).astype(int)
            df_fe['Season_Winter'] = df_fe['Month'].isin([1, 2]).astype(int)
            df_fe['Season_Summer'] = df_fe['Month'].isin([3, 4, 5]).astype(int)

        return df_fe

    def transform_target(self, df):
        """Calculates WQI target for every row using standard Weighted Arithmetic WQI method."""
        df_target = df.copy()
        wqi_list = []
        category_list = []

        for _, row in df_target.iterrows():
            wqi_val, cat, _ = compute_weighted_arithmetic_wqi(row.to_dict())
            wqi_list.append(wqi_val)
            category_list.append(cat)

        df_target['WQI'] = wqi_list
        df_target['WQI_Category'] = category_list
        return df_target

    def fit_transform(self, df):
        """Fits preprocessor and transforms dataframe returning cleaned features X and WQI target y."""
        self.fit(df)
        df_cleaned = self.clean_and_impute(df)
        df_engineered = self.engineer_features(df_cleaned)
        df_with_wqi = self.transform_target(df_engineered)

        # Separate features X and target y
        ignore_cols = ['_id', 'SlNo', 'Station', 'District LGD Code', 'District', 'Tehsil',
                       'Latitude', 'Longitude', 'Data Acquisition Time', 'WQI', 'WQI_Category']
        feature_cols = [c for c in df_with_wqi.columns if c not in ignore_cols]
        self.feature_names = feature_cols

        X = df_with_wqi[feature_cols].copy()
        y = df_with_wqi['WQI'].copy()

        return X, y, df_with_wqi

    def transform_single_sample(self, input_dict):
        """Transforms a single raw JSON/Dict sample from Person B's frontend for inference."""
        df_single = pd.DataFrame([input_dict])
        
        # Apply bounds & fallback imputation
        for param, config in STANDARD_WQI_CONFIG.items():
            col = config['column']
            if col not in df_single.columns or pd.isna(df_single[col].iloc[0]):
                df_single[col] = self.feature_medians.get(col, config['V_ideal'])

        # Clean & Feature Engineer
        df_cleaned = self.clean_and_impute(df_single)
        df_engineered = self.engineer_features(df_cleaned)

        # Align with fitted feature columns
        X_single = pd.DataFrame()
        for f in self.feature_names:
            if f in df_engineered.columns:
                X_single[f] = df_engineered[f]
            else:
                X_single[f] = [self.feature_medians.get(f, 0.0)]

        return X_single

    def save(self, filepath):
        """Saves preprocessing pipeline configuration to disk."""
        config_data = {
            'feature_medians': self.feature_medians,
            'group_medians': self.group_medians,
            'column_bounds': self.column_bounds,
            'feature_names': self.feature_names,
            'standard_wqi_config': STANDARD_WQI_CONFIG
        }
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)
        json_path = filepath.replace('.joblib', '_config.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
        logging.info(f"Preprocessing pipeline saved to {filepath} and {json_path}")


if __name__ == '__main__':
    logging.info("Preprocessing module ready.")
