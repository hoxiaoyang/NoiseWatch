import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def create_model_dataset(df, train_split=0.8, val_split=0.1):
    """
    Split frequency domain data into train/val/test sets.
    
    Args:
        df: DataFrame with frequency domain features
        train_split: Proportion for training (0.8 = 80%)
        val_split: Proportion for validation (0.1 = 10%)

    Returns:
        train_df, val_df, test_df
    """
    # Get unique frame IDs
    frame_ids = df['frame_id'].unique()
    
    # Split frame IDs (not rows)
    train_frames, temp_frames = train_test_split(frame_ids, train_size=train_split, random_state=42)
    val_frames, test_frames = train_test_split(temp_frames, train_size=val_split/(1-train_split), random_state=42)
    
    # Filter DataFrame by frame IDs
    train_df = df[df['frame_id'].isin(train_frames)]
    val_df = df[df['frame_id'].isin(val_frames)]
    test_df = df[df['frame_id'].isin(test_frames)]
    
    print(f"Dataset split: {len(train_frames)} train frames, {len(val_frames)} val frames, {len(test_frames)} test frames")
    
    return train_df, val_df, test_df

def extract_spectral_features(freq_df):
    """Extract features without normalization from a single frame."""
    magnitude = freq_df['magnitude'].values
    frequency = freq_df['frequency'].values
    
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

def load_dataset_with_features(df, label_id, split='train'):
    """
    Load dataset with extracted features (one per frame).
    
    Args:
        df: DataFrame with 'frame_id', 'frequency', 'magnitude' columns
        label_id: Class label for all frames
        split: Dataset split name for logging
    
    Returns:
        X: Feature array of shape (n_frames, n_features)
        y: Label array of shape (n_frames,)
        n_features: Number of features
    """
    X_list = []
    y_list = []
    
    # Process each frame separately
    for frame_id, frame_df in df.groupby('frame_id'):
        # Extract features for this single frame
        features = extract_spectral_features(frame_df)
        X_list.append(features)
        y_list.append(label_id)
    
    X = np.array(X_list)
    y = np.array(y_list)
    
    print(f"{split} set: {X.shape[0]} samples, {X.shape[1]} features (fixed length)")
    
    return X, y, X.shape[1]