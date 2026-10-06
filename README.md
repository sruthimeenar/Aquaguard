# Aquaguard

# Intelligent Water Quality Assessment System (WQI Predictor)

## Project Overview
This project predicts the **Water Quality Index (WQI)** using a tuned **LightGBM Regressor** and standard **Weighted Arithmetic Index (CPCB / WHO)** methods. It enables contamination detection, environmental risk monitoring, safe water resource management, and public health protection across surface and groundwater monitoring stations.

---

## Technical Architecture & Pipeline Strategy
To avoid **training-serving skew**, the preprocessing pipeline and trained LightGBM model are bundled together as re-usable Python modules and Joblib serialization objects:

1. **Preprocessing Pipeline (`models/pipeline.joblib` & `scripts/preprocessing.py`)**:
   - **Duplicate Removal**: Automatically drops identical data records.
   - **Range Validation**: Filters/clips out-of-bounds physical values (e.g. pH strictly $[0, 14]$, non-negative chemical concentrations).
   - **Missing Value Imputation**: Imputes missing values using station/district-group medians learned during training, falling back to global parameter medians stored in `preprocessing_config.json`.
   - **Outlier Handling**: Clips non-physical extreme spikes to 1.5x IQR bounds to maintain numerical tree stability without deleting real pollution events.
   - **Feature Engineering**: Calculates total hardness ($Ca + Mg$), $DO$ saturation deficit, TDS-to-chloride salinity ratio, combined heavy metal toxicity indices, and seasonal indicators.

2. **WQI Calculation Standard Method**:
   - Uses the **Weighted Arithmetic Index Method**:
     $$WQI = \frac{\sum (q_i \cdot w_i)}{\sum w_i}$$
     where $q_i = 100 \times \frac{|V_i - V_{ideal}|}{|S_i - V_{ideal}|}$ and $w_i \propto \frac{1}{S_i}$.
   - Categories:
     - **< 25**: Excellent (Grade A - Safe)
     - **25 - 50**: Good (Grade B - Acceptable)
     - **50 - 75**: Poor (Grade C - Needs Treatment)
     - **75 - 100**: Very Poor (Grade D - Unsafe)
     - ** 100**: Severely Contaminated (Grade E - Non-potable)

3. **Hyperparameter Tuning & Model Training**:
   - Optuna 25-trial optimization tuning `num_leaves`, `learning_rate`, `subsample`, `max_depth`, and `reg_alpha/reg_lambda`.
   - 80/20 Train-Test Split with 5-Fold Cross Validation.

---

## Handoff Guide for Person B (Website Builder Integration)

### 1. File Artifacts Provided
- `models/model.joblib`: Trained LightGBM model.
- `models/pipeline.joblib`: Fitted `WaterQualityPreprocessor` class instance.
- `models/preprocessing_config.json`: Human-readable JSON containing all global & group medians, feature names, and WQI weights.
- `models/evaluation_metrics.json`: MAE, MSE, RMSE, $R^2$, Adjusted $R^2$, and 5-Fold CV metrics.
- `data/dataset_metadata.json`: Dataset statistics, feature ranges, and category distributions.

### 2. Integration Code Example for Person B (Python Backend API)

```python
import joblib
import pandas as pd
from scripts.preprocessing import WaterQualityPreprocessor

# Load pipeline and model
preprocessor = joblib.load('models/pipeline.joblib')
model = joblib.load('models/model.joblib')

# Sample incoming request from user
sample_data = {
    'Potential of Hydrogen (pH)': 7.2,
    'Dissolved oxygen (mg/L)': 6.5,
    'Total Dissolved Solids (mg/L)': 420.0,
    'Chloride (mg/L)': 110.0,
    'Nitrate N (mgN/L)': 2.1,
    'Total Alkalinity (mg/L as CaCO3)': 180.0,
    'Hardness Calcium (mgCaCO3/L)': 80.0,
    'Hardness_Magnesium (mg/L as CaCO3)': 30.0,
    'Amonia N (mgN/L)': 0.4,
    'Iron(mg/L)': 0.1,
    'District': 'Erode',
    'Month': 9
}

# Transform raw input using fitted pipeline (handles missing fields automatically!)
X_single = preprocessor.transform_single_sample(sample_data)

# Predict WQI
predicted_wqi = model.predict(X_single)[0]
print(f"Predicted WQI: {predicted_wqi:.2f}")
```

---

## Model Performance & Evaluation Metrics
- **MAE**: ~0.8 - 1.5 WQI units
- **RMSE**: ~1.2 - 2.5 WQI units
- **$R^2$ Score**: > 0.98
- **Adjusted $R^2$**: > 0.98
- **5-Fold Cross Validation $R^2$**: High stability across all folds.
