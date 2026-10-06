"""
LightGBM Training & Optuna Tuning Script for Water Quality Index (WQI) Prediction
==================================================================================
Requirements implemented:
- Automatic dataset loading & cleaning
- Standard WQI calculation before training
- 80% Train / 20% Test Split
- Optuna hyperparameter tuning
- LightGBM Regressor training
- Full metric suite: MAE, MSE, RMSE, R2, Adjusted R2, 5-Fold Cross Validation
- Model interpretability: Feature Importance, SHAP values
- Production plot generation: Feature Importance, SHAP Summary, Residuals, Actual vs Predicted, Error Distribution
- Saving trained model and preprocessor via Joblib
- Saving dataset metadata JSON
"""

import os
import sys
import json
import logging
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Non-interactive backend for headless plot generation
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb
import optuna
import shap

from preprocessing import WaterQualityPreprocessor, STANDARD_WQI_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
optuna.logging.set_verbosity(optuna.logging.WARNING)

def train_and_evaluate():
    logging.info("Starting Water Quality Assessment Model Pipeline...")

    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'water_quality_data.csv')
    models_dir = os.path.join(base_dir, 'models')
    plots_dir = os.path.join(base_dir, 'plots')
    data_dir = os.path.join(base_dir, 'data')

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    # 1. Load Dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df_raw = pd.read_csv(data_path)
    logging.info(f"Loaded raw dataset with {len(df_raw)} rows and {len(df_raw.columns)} columns.")

    # 2. Preprocessing & Feature Engineering & WQI Calculation
    preprocessor = WaterQualityPreprocessor(handle_outliers=True)
    X, y, df_processed = preprocessor.fit_transform(df_raw)

    logging.info(f"Preprocessed dataset shapes: X={X.shape}, y={y.shape}")

    # Save Preprocessing Pipeline
    pipeline_path = os.path.join(models_dir, 'pipeline.joblib')
    preprocessor.save(pipeline_path)

    # Generate Dataset Metadata JSON
    metadata = {
        'total_records_raw': int(len(df_raw)),
        'total_records_cleaned': int(len(df_processed)),
        'num_features': int(X.shape[1]),
        'feature_names': list(X.columns),
        'target_variable': 'WQI (Water Quality Index)',
        'wqi_stats': {
            'mean': float(y.mean()),
            'std': float(y.std()),
            'min': float(y.min()),
            'max': float(y.max()),
            'median': float(y.median())
        },
        'category_distribution': df_processed['WQI_Category'].value_counts().to_dict(),
        'districts_covered': list(df_raw['District'].dropna().unique()) if 'District' in df_raw.columns else [],
        'stations_count': int(df_raw['Station'].nunique()) if 'Station' in df_raw.columns else 0,
        'year_range': [int(df_raw['Year'].min()), int(df_raw['Year'].max())] if 'Year' in df_raw.columns else []
    }

    metadata_path = os.path.join(data_dir, 'dataset_metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    logging.info(f"Saved dataset metadata to {metadata_path}")

    # 3. Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    logging.info(f"Data Split: Train={len(X_train)} samples, Test={len(X_test)} samples.")

    # 4. Hyperparameter Tuning using Optuna
    logging.info("Starting Optuna hyperparameter optimization for LightGBM...")

    def objective(trial):
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'verbosity': -1,
            'boosting_type': 'gbdt',
            'random_state': 42,
            'n_estimators': trial.suggest_int('n_estimators', 50, 300),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
            'num_leaves': trial.suggest_int('num_leaves', 15, 127),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'min_child_samples': trial.suggest_int('min_child_samples', 5, 50),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
            'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True)
        }

        model = lgb.LGBMRegressor(**params)
        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='neg_root_mean_squared_error')
        return -scores.mean()

    study = optuna.create_study(direction='minimize')
    study.optimize(objective, n_trials=25)

    best_params = study.best_params
    best_params.update({
        'objective': 'regression',
        'metric': 'rmse',
        'verbosity': -1,
        'boosting_type': 'gbdt',
        'random_state': 42
    })
    logging.info(f"Optuna Best Parameters: {best_params}")

    # 5. Train Final LightGBM Regressor
    best_model = lgb.LGBMRegressor(**best_params)
    best_model.fit(X_train, y_train)

    # Save Model via Joblib
    model_path = os.path.join(models_dir, 'model.joblib')
    joblib.dump(best_model, model_path)
    logging.info(f"Saved trained LightGBM model to {model_path}")

    # 6. Evaluate Model Performance
    y_pred_test = best_model.predict(X_test)
    y_pred_train = best_model.predict(X_train)

    mae = float(mean_absolute_error(y_test, y_pred_test))
    mse = float(mean_squared_error(y_test, y_pred_test))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred_test))

    n = len(y_test)
    p = X_test.shape[1]
    adj_r2 = float(1 - ((1 - r2) * (n - 1) / (n - p - 1))) if (n - p - 1) > 0 else r2

    # 5-Fold Cross Validation Scores
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_r2_scores = cross_val_score(best_model, X, y, cv=kf, scoring='r2')
    cv_rmse_scores = np.sqrt(-cross_val_score(best_model, X, y, cv=kf, scoring='neg_mean_squared_error'))

    eval_metrics = {
        'MAE': round(mae, 4),
        'MSE': round(mse, 4),
        'RMSE': round(rmse, 4),
        'R2': round(r2, 4),
        'Adjusted_R2': round(adj_r2, 4),
        'CV_R2_Mean': round(float(cv_r2_scores.mean()), 4),
        'CV_R2_Std': round(float(cv_r2_scores.std()), 4),
        'CV_RMSE_Mean': round(float(cv_rmse_scores.mean()), 4),
        'CV_RMSE_Std': round(float(cv_rmse_scores.std()), 4),
        'Best_Optuna_Trial': study.best_trial.number,
        'Best_Optuna_Value_RMSE': round(study.best_value, 4),
        'Optuna_Best_Params': best_params
    }

    metrics_path = os.path.join(models_dir, 'evaluation_metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(eval_metrics, f, indent=2)
    logging.info(f"Saved evaluation metrics: {eval_metrics}")

    # 7. Generate Visualizations & Plots
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

    # A. Feature Importance Plot
    plt.figure(figsize=(10, 6))
    feature_imp = pd.Series(best_model.feature_importances_, index=X.columns).sort_values(ascending=True)
    feature_imp.tail(15).plot(kind='barh', color='#2563eb', edgecolor='black', alpha=0.85)
    plt.title('Top Feature Importances (LightGBM Split Gain)', fontsize=14, fontweight='bold', pad=12)
    plt.xlabel('Importance Score', fontsize=12)
    plt.ylabel('Feature', fontsize=12)
    plt.tight_layout()
    fi_plot_path = os.path.join(plots_dir, 'feature_importance.png')
    plt.savefig(fi_plot_path, dpi=300)
    plt.close()

    # B. Actual vs Predicted Plot
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, y_pred_test, alpha=0.65, color='#0284c7', edgecolors='k', s=45)
    min_val = min(y_test.min(), y_pred_test.min())
    max_val = max(y_test.max(), y_pred_test.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', label='Ideal 1:1 Line')
    plt.title(f'Actual vs Predicted WQI (R² = {r2:.3f})', fontsize=14, fontweight='bold', pad=12)
    plt.xlabel('Actual WQI Target', fontsize=12)
    plt.ylabel('LightGBM Predicted WQI', fontsize=12)
    plt.legend(frameon=True)
    plt.tight_layout()
    avp_plot_path = os.path.join(plots_dir, 'actual_vs_predicted.png')
    plt.savefig(avp_plot_path, dpi=300)
    plt.close()

    # C. Residual Plot
    residuals = y_test - y_pred_test
    plt.figure(figsize=(8, 6))
    plt.scatter(y_pred_test, residuals, alpha=0.65, color='#d97706', edgecolors='k', s=45)
    plt.axhline(0, color='black', linestyle='--', linewidth=1.5)
    plt.title('Residual Plot (Predicted WQI vs Residuals)', fontsize=14, fontweight='bold', pad=12)
    plt.xlabel('Predicted WQI', fontsize=12)
    plt.ylabel('Residuals (Actual - Predicted)', fontsize=12)
    plt.tight_layout()
    res_plot_path = os.path.join(plots_dir, 'residual_plot.png')
    plt.savefig(res_plot_path, dpi=300)
    plt.close()

    # D. Error Distribution Plot
    plt.figure(figsize=(8, 6))
    sns.histplot(residuals, kde=True, color='#059669', bins=25, stat="density", alpha=0.6)
    plt.axvline(0, color='red', linestyle='--', label='Zero Error')
    plt.title(f'Prediction Error Distribution (Mean={residuals.mean():.2f}, Std={residuals.std():.2f})', fontsize=14, fontweight='bold', pad=12)
    plt.xlabel('Prediction Error (WQI Units)', fontsize=12)
    plt.ylabel('Density', fontsize=12)
    plt.legend()
    plt.tight_layout()
    err_plot_path = os.path.join(plots_dir, 'error_distribution.png')
    plt.savefig(err_plot_path, dpi=300)
    plt.close()

    # E. SHAP Summary Plot
    try:
        explainer = shap.TreeExplainer(best_model)
        shap_values = explainer(X_test)

        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_test, show=False)
        plt.title('SHAP Feature Contribution Summary', fontsize=14, fontweight='bold', pad=12)
        plt.tight_layout()
        shap_plot_path = os.path.join(plots_dir, 'shap_summary.png')
        plt.savefig(shap_plot_path, dpi=300)
        plt.close()

        # Save top SHAP importance values as JSON for interactive UI
        mean_abs_shap = np.abs(shap_values.values).mean(axis=0)
        shap_df = pd.DataFrame({
            'feature': X_test.columns,
            'mean_abs_shap': mean_abs_shap
        }).sort_values(by='mean_abs_shap', ascending=False)
        
        shap_json_path = os.path.join(models_dir, 'shap_values.json')
        shap_df.to_json(shap_json_path, orient='records', indent=2)
        logging.info("Saved SHAP summary plot and JSON.")
    except Exception as e:
        logging.warning(f"SHAP explanation plot skipped due to error: {e}")

    logging.info("Model pipeline execution completed successfully!")
    return eval_metrics

if __name__ == '__main__':
    train_and_evaluate()
