import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def create_model_dataset(freq_domain_dir, output_dir, train_split=0.7, val_split=0.15):
    """
    Split frequency domain data into train/val/test sets.
    
    Args:
        freq_domain_dir: Directory with background/ and shout/ and drill/ frequency data
        output_dir: Where to save train/val/test splits
        train_split: Proportion for training (0.7 = 70%)
        val_split: Proportion for validation (0.15 = 15%)
    """
    
    classes = ['background', 'shout', 'drill']
    
    for class_name in classes:
        class_dir = os.path.join(freq_domain_dir, class_name)
        files = [f for f in os.listdir(class_dir) if f.endswith('.csv')]
        
        # Split files
        train_files, temp_files = train_test_split(files, train_size=train_split, random_state=42)
        val_files, test_files = train_test_split(temp_files, train_size=val_split/(1-train_split), random_state=42)
        
        # Copy to respective directories
        for split_name, split_files in [('train', train_files), ('validation', val_files), ('test', test_files)]:
            split_dir = os.path.join(output_dir, split_name, class_name)
            os.makedirs(split_dir, exist_ok=True)
            
            for file_name in split_files:
                src = os.path.join(class_dir, file_name)
                dst = os.path.join(split_dir, file_name)
                pd.read_csv(src).to_csv(dst, index=False)
        
        print(f"{class_name}: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test")

def load_dataset_for_training(data_dir, split='train'):
    """
    Load all frequency domain features for model training.
    
    Args:
        data_dir: Base directory (data/model_ready)
        split: 'train', 'validation', or 'test'
        
    Returns:
        X: Features array
        y: Labels array
        feature_length: Number of frequency bins
    """
    X_list = []
    y_list = []
    
    classes = ['background', 'shout', 'drill']
    label_map = {'background': 0, 'shout': 1, 'drill': 2}
    
    for class_name in classes:
        class_dir = os.path.join(data_dir, split, class_name)
        files = [f for f in os.listdir(class_dir) if f.endswith('.csv')]
        
        for file_name in files:
            file_path = os.path.join(class_dir, file_name)
            df = pd.read_csv(file_path)
            
            # Use magnitude as features
            features = df['magnitude'].values
            X_list.append(features)
            y_list.append(label_map[class_name])
    
    # Convert to numpy arrays
    X = np.array(X_list)
    y = np.array(y_list)
    
    return X, y

def get_feature_normalization_params(data_dir):
    """
    Compute mean and std for each feature across training set.
    
    Returns:
        feature_mean: Array of means for each feature
        feature_std: Array of stds for each feature
    """
    all_features = []
    classes = ['background', 'shout', 'drill']
    
    for class_name in classes:
        class_dir = os.path.join(data_dir, 'train', class_name)
        files = [f for f in os.listdir(class_dir) if f.endswith('.csv')]
        
        for file_name in files:
            file_path = os.path.join(class_dir, file_name)
            df = pd.read_csv(file_path)
            # Extract features WITHOUT normalization
            features = extract_spectral_features_raw(df)
            all_features.append(features)
    
    all_features = np.array(all_features)
    feature_mean = np.mean(all_features, axis=0)
    feature_std = np.std(all_features, axis=0)
    
    return feature_mean, feature_std

def extract_spectral_features_raw(freq_df):
    """Extract features without normalization."""
    magnitude = freq_df['magnitude'].values
    frequency = freq_df['frequency'].values

    # Remove 0.0 Hz component if present
    if frequency[0] == 0.0:
        magnitude = magnitude[1:]
        frequency = frequency[1:]
    
    features = []
    
    # Statistical features (8 features)
    features.append(np.mean(magnitude))
    features.append(np.std(magnitude))
    features.append(np.max(magnitude))
    features.append(np.median(magnitude))
    features.append(np.percentile(magnitude, 25))
    features.append(np.percentile(magnitude, 75))
    features.append(np.sum(magnitude))
    features.append(np.var(magnitude))
    
    # Spectral features
    spectral_centroid = np.sum(frequency * magnitude) / np.sum(magnitude)
    features.append(spectral_centroid)
    
    dominant_freq = frequency[np.argmax(magnitude)]
    features.append(dominant_freq)
    
    cumsum = np.cumsum(magnitude)
    rolloff_threshold = 0.85 * cumsum[-1]
    rolloff_idx = np.where(cumsum >= rolloff_threshold)[0][0]
    spectral_rolloff = frequency[rolloff_idx]
    features.append(spectral_rolloff)
    
    spectral_bandwidth = np.sqrt(np.sum(((frequency - spectral_centroid) ** 2) * magnitude) / np.sum(magnitude))
    features.append(spectral_bandwidth)
    
    features.append(np.sum(magnitude[frequency < 100]))
    
    return np.array(features)

def extract_spectral_features(freq_df, feature_mean, feature_std):
    """Extract and normalize features using pre-computed stats."""
    features = extract_spectral_features_raw(freq_df)
    # Normalize each feature independently
    features = (features - feature_mean) / (feature_std + 1e-8)  # Add epsilon to avoid division by zero
    return features

def load_dataset_with_features(data_dir, split='train'):
    """
    Load dataset with extracted features (fixed length).
    """
    X_list = []
    y_list = []
    
    classes = ['background', 'shout', 'drill']
    label_map = {'background': 0, 'shout': 1, 'drill': 2}

    feature_mean, feature_std = get_feature_normalization_params(data_dir)

    for class_name in classes:
        class_dir = os.path.join(data_dir, split, class_name)
        
        if not os.path.exists(class_dir):
            print(f"Warning: {class_dir} does not exist")
            continue
            
        files = [f for f in os.listdir(class_dir) if f.endswith('.csv')]
        
        for file_name in files:
            file_path = os.path.join(class_dir, file_name)
            df = pd.read_csv(file_path)
            
            # Extract fixed-length features
            features = extract_spectral_features(df, feature_mean, feature_std)
            X_list.append(features)
            y_list.append(label_map[class_name])
    
    X = np.array(X_list)
    y = np.array(y_list)
    
    print(f"{split} set: {X.shape[0]} samples, {X.shape[1]} features (fixed length)")
    
    return X, y, X.shape[1]