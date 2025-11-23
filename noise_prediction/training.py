import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def create_model_dataset(freq_domain_dir, output_dir, train_split=0.7, val_split=0.15):
    """
    Split frequency domain data into train/val/test sets.
    
    Args:
        freq_domain_dir: Directory with background/ and shout/ frequency data
        output_dir: Where to save train/val/test splits
        train_split: Proportion for training (0.7 = 70%)
        val_split: Proportion for validation (0.15 = 15%)
    """
    
    classes = ['background', 'shout']
    
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
    
    classes = ['background', 'shout']
    label_map = {'background': 0, 'shout': 1}
    
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

def extract_spectral_features(freq_df):
    """
    Extract fixed-length features from frequency domain data.
    Works regardless of number of frequency bins!
    
    Returns:
        features: 1D array of fixed length
    """

    # # Try removing 0 Hz component if present
    # if freq_df['frequency'].values[0] == 0.0:
    #     freq_df = freq_df.iloc[1:]

    magnitude = freq_df['magnitude'].values
    frequency = freq_df['frequency'].values
    
    features = []
    
    # Statistical features (8 features)
    features.append(np.mean(magnitude))           # Mean magnitude
    features.append(np.std(magnitude))            # Std deviation
    features.append(np.max(magnitude))            # Peak magnitude
    features.append(np.median(magnitude))         # Median
    features.append(np.percentile(magnitude, 25)) # 25th percentile
    features.append(np.percentile(magnitude, 75)) # 75th percentile
    features.append(np.sum(magnitude))            # Total energy
    features.append(np.var(magnitude))            # Variance
    
    # Spectral features (5 features)
    # Spectral centroid (center of mass of spectrum)
    spectral_centroid = np.sum(frequency * magnitude) / np.sum(magnitude)
    features.append(spectral_centroid)
    
    # Dominant frequency (frequency with max magnitude)
    dominant_freq = frequency[np.argmax(magnitude)]
    features.append(dominant_freq)
    
    # Spectral rolloff (frequency below which 85% of energy is contained)
    cumsum = np.cumsum(magnitude)
    rolloff_threshold = 0.85 * cumsum[-1]
    rolloff_idx = np.where(cumsum >= rolloff_threshold)[0][0]
    spectral_rolloff = frequency[rolloff_idx]
    features.append(spectral_rolloff)
    
    # Spectral bandwidth
    spectral_bandwidth = np.sqrt(np.sum(((frequency - spectral_centroid) ** 2) * magnitude) / np.sum(magnitude))
    features.append(spectral_bandwidth)
    
    # Zero crossing rate (approximation from frequency)
    features.append(np.sum(magnitude[frequency < 100]))  # Low freq energy
    
    return np.array(features)

def load_dataset_with_features(data_dir, split='train'):
    """
    Load dataset with extracted features (fixed length).
    """
    X_list = []
    y_list = []
    
    classes = ['background', 'shout']
    label_map = {'background': 0, 'shout': 1}
    
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
            features = extract_spectral_features(df)
            X_list.append(features)
            y_list.append(label_map[class_name])
    
    X = np.array(X_list)
    y = np.array(y_list)
    
    print(f"{split} set: {X.shape[0]} samples, {X.shape[1]} features (fixed length)")
    
    return X, y, X.shape[1]