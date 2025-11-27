###########################################################################
# This train.py file for model training is to be deployed on AWS SageMaker #
###########################################################################

# Import necessary libraries
import matplotlib.pyplot as plt
import os
import joblib

# Import functions from preprocessing and training modules
from preprocessing import process_unstructured_data_to_csv, get_labelled_csv, process_all_files
from feature_extract import create_model_dataset, load_dataset_with_features

# Import model training libraries
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, classification_report

# Get current working directory
cwd = "/opt/ml/input/data/training"

# Raw data directory
data_dir = os.path.join(cwd, "raw_data")

# SageMaker saves final artifacts here
model_dir = "/opt/ml/model"

# Load raw data from desired file

file_names = ['shout1.txt', 'shout2.txt', 'shout3.txt', 'drill1.txt', 'drill2.txt', 'drill3.txt']
shout_time_interval = 28 # milliseconds between data points
drill_time_interval = 17 # milliseconds between data points

for file_name in file_names:

    print(f"\nProcessing file: {file_name}")
    
    # Save processed CSV dataframe from the unstructured data file
    if 'shout' in file_name:
        time_interval = shout_time_interval
    elif 'drill' in file_name:
        time_interval = drill_time_interval
    process_unstructured_data_to_csv(data_dir + '\\' + file_name, time_interval)

    # Separate csv further into 'shout' and 'background'
    if 'shout' in file_name:
        get_labelled_csv(data_dir + '\\' + file_name.split('.')[0] + '.csv', type='shout', labelling_interval=5)

    elif 'drill' in file_name:
        get_labelled_csv(data_dir + '\\' + file_name.split('.')[0] + '.csv', type='drill', labelling_interval=5)

frame_size = 30  # Number of data points per frame, so that each data sample is 0.5-0.9 seconds long
overlap_percentage = 70 # Percentage of overlap between frames

# For each file, we will create frames and process them with fourier transform, saving results to new CSVs
process_all_files(
    input_base_dir=cwd + '\\' + 'sample_data' + '\\' + 'labelled',  # Contains background/ and shout/ folders with CSVs
    output_base_dir=cwd + '\\' +'sample_data' + '\\' + 'processed',    # Output directory for processed CSVs
    frame_size=frame_size,
    overlap_percent=overlap_percentage
)

create_model_dataset(
    freq_domain_dir=cwd + '\\' + 'sample_data' + '\\' + 'processed',
    output_dir=cwd + '\\' + 'model_data'
)

X_train, y_train, n_features = load_dataset_with_features(cwd + '\\model_data', 'train')
X_val, y_val, _ = load_dataset_with_features(cwd + '\\model_data', 'validation')
X_test, y_test, _ = load_dataset_with_features(cwd + '\\model_data', 'test')

rf = RandomForestClassifier(n_estimators=100, random_state=42)
gb = GradientBoostingClassifier(n_estimators=100, random_state=42)

# Voting ensemble
voting_model = VotingClassifier(
    estimators=[('rf', rf), ('gb', gb)],
    voting='soft'
)
voting_model.fit(X_train, y_train)

# Validate model
y_val_pred = voting_model.predict(X_val)
val_accuracy = accuracy_score(y_val, y_val_pred)
print(f"Validation Accuracy: {val_accuracy:.4f}")
print("Validation Classification Report:")
print(classification_report(y_val, y_val_pred, target_names=['background', 'shout', 'drill']))

# Test model
y_test_pred = voting_model.predict(X_test)
test_accuracy = accuracy_score(y_test, y_test_pred)
print(f"Test Accuracy: {test_accuracy:.4f}")
print("Test Classification Report:")
print(classification_report(y_test, y_test_pred, target_names=['background', 'shout', 'drill']))

# Save to SageMaker’s output directory
os.makedirs(model_dir, exist_ok=True)
joblib.dump(voting_model, os.path.join(model_dir, "model.joblib"))