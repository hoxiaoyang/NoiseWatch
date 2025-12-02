###########################################################################
# This train.py file for model training is to be deployed on AWS SageMaker #
###########################################################################

# Import necessary libraries
import matplotlib.pyplot as plt
import os
import joblib
import pandas as pd

# Import functions from preprocessing and training modules
from preprocessing import process_file
from feature_extract import create_model_dataset, load_dataset_with_features

# Import model training libraries
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Get current working directory
cwd = os.getcwd() # This would be /opt/ml/code if you run this in Sagemaker notebook.

# Support multiple CSV files - look for all CSV files or use specific names

# Csv path names for job training
# csv_files = [
#     "/opt/ml/input/data/background/background.csv",
#     "/opt/ml/input/data/shout/shout.csv",
#     "/opt/ml/input/data/drill/drill.csv"
# ]

# Csv path names for local training
csv_files = [
    "background.csv",
    "shout.csv",
    "drill.csv"
]

# Get pretrained model directory from cwd
pretrained_model_path = os.path.join(cwd, "model.joblib")

# SageMaker saves final artifacts here
model_dir = "/opt/ml/model"

frame_size = 30  # Number of data points per frame, so that each data sample is 0.5-0.9 seconds long
overlap_percentage = 70 # Percentage of overlap between frames

# Process all CSV files and combine their data
all_train_data = []
all_val_data = []
all_test_data = []
label_map = {'background': 0, 'shout': 1, 'drill': 2}

for csv_path in csv_files:
    print(f"\nProcessing file: {csv_path}")
    sample_df = pd.read_csv(csv_path)
    sample_label = sample_df['label'].iloc[0]  # Get first label
    label_id = label_map.get(sample_label, 0)  # Convert to integer
    print(f"Label: {sample_label} (id: {label_id})")
    
    # For each file, we will create frames and process them with fourier transform
    freq_df, sampling_rate = process_file(
        csv_file=csv_path,
        frame_size=frame_size,
        overlap_percent=overlap_percentage
    )

    # Split data into train/val/test
    train_df, val_df, test_df = create_model_dataset(
        df=freq_df,
    )

    # Load features for each split
    X_train, y_train, n_features = load_dataset_with_features(train_df, label_id, 'train')
    X_val, y_val, _ = load_dataset_with_features(val_df, label_id, 'validation')
    X_test, y_test, _ = load_dataset_with_features(test_df, label_id, 'test')
    
    all_train_data.append((X_train, y_train))
    all_val_data.append((X_val, y_val))
    all_test_data.append((X_test, y_test))
    
    print(f"  Training: {X_train.shape[0]}, Validation: {X_val.shape[0]}, Test: {X_test.shape[0]}")

# Combine all data
import numpy as np
X_train = np.vstack([data[0] for data in all_train_data])
y_train = np.hstack([data[1] for data in all_train_data])
X_val = np.vstack([data[0] for data in all_val_data])
y_val = np.hstack([data[1] for data in all_val_data])
X_test = np.vstack([data[0] for data in all_test_data])
y_test = np.hstack([data[1] for data in all_test_data])

print(f"\n=== Combined Dataset ===")
print(f"Training samples: {X_train.shape[0]}, Features: {X_train.shape[1]}")
print(f"Validation samples: {X_val.shape[0]}")
print(f"Test samples: {X_test.shape[0]}")
print(f"Unique classes in training: {np.unique(y_train)}")

# Check if we have enough classes for training
unique_classes = len(np.unique(y_train))
if unique_classes < 2:
    print(f"\nERROR: Only {unique_classes} unique class found.")
    print("Multi-class classification requires at least 2 classes.")
    print("Please provide CSV files with different labels.")
    exit(1)

# Model architecture
rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
gb = GradientBoostingClassifier(n_estimators=100, random_state=42, max_depth=5)

# Voting ensemble
voting_model = VotingClassifier(
    estimators=[('rf', rf), ('gb', gb)],
    voting='soft'
)

# Create pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('voting_classifier', voting_model)
])

# Load pretrained pipeline if it exists and rebuild it
if os.path.exists(pretrained_model_path):
    try:
        print(f"Loading pretrained model from {pretrained_model_path}")
        loaded_pipeline = joblib.load(pretrained_model_path)
        
        # Extract components and rebuild to avoid attribute errors
        if hasattr(loaded_pipeline, 'named_steps'):
            scaler = loaded_pipeline.named_steps.get('scaler', StandardScaler())
            classifier = loaded_pipeline.named_steps.get('voting_classifier', voting_model)
            
            # Rebuild clean pipeline
            pipeline = Pipeline([
                ('scaler', scaler),
                ('voting_classifier', classifier)
            ])
            print("Successfully loaded and rebuilt pretrained pipeline")
        else:
            pipeline = loaded_pipeline
            print("Loaded pretrained pipeline directly")
            
    except Exception as e:
        print(f"Error loading pretrained model: {e}")
        print("Using new pipeline instead")
else:
    print("No pretrained model found, training from scratch")

# Train model
print("\nTraining model...")
pipeline.fit(X_train, y_train)

# Validate model
y_val_pred = pipeline.predict(X_val)
val_accuracy = accuracy_score(y_val, y_val_pred)
print(f"\nValidation Accuracy: {val_accuracy:.4f}")

# Test model
y_test_pred = pipeline.predict(X_test)
test_accuracy = accuracy_score(y_test, y_test_pred)
print(f"Test Accuracy: {test_accuracy:.4f}")

# Print classification report
print("\nClassification Report:")
target_names = ['background', 'shout', 'drill']
print(classification_report(y_test, y_test_pred, target_names=target_names, zero_division=0))

# If the accuracy is satisfactory, save the model
if test_accuracy >= 0.85:
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"\nModel saved to {model_path}")
else:
    print(f"\nModel accuracy ({test_accuracy:.4f}) below threshold (0.85); not saving the model.")

print("\nTraining complete!")