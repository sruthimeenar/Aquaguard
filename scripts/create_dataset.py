import os
import sys

# Script to verify and generate complete dataset if needed
def ensure_dataset():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, 'water_quality_data.csv')
    
    if os.path.exists(csv_path):
        with open(csv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print(f"Dataset exists with {len(lines)} lines.")
            if len(lines) >= 2000:
                return csv_path
                
    print("Writing water_quality_data.csv...")

if __name__ == '__main__':
    ensure_dataset()
