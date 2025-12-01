import pandas as pd
import numpy as np
import re
import os
import matplotlib.pyplot as plt
        
def fourier_transform(df, frame_size, overlap_percent):
    """
    Transform time-domain data to frequency domain using windowed FFT.
    
    Args:
        df: DataFrame with 'timestamp' (ms) and 'analog_value' columns
        frame_size: Number of data points in each frame/window
        overlap_percent: Overlap percentage between consecutive frames (0-100)
        
    Returns:
        freq_df: DataFrame with 'frame_id', 'frequency' (Hz) and 'magnitude' columns
        sampling_rate: Sampling rate in Hz
    """
    # Extract values
    timestamps = df['timestamp'].values  # in milliseconds
    signal = df['analog_value'].values
    
    # Calculate sampling parameters
    time_interval = timestamps[1] - timestamps[0]  # ms between samples
    sampling_rate = 1000 / time_interval  # Convert to Hz (samples per second)
    
    # Calculate hop size (step between frames)
    overlap_samples = int(frame_size * overlap_percent / 100)
    hop_size = frame_size - overlap_samples
    
    # Initialize lists to store results
    all_frequencies = []
    all_magnitudes = []
    all_frame_ids = []
    
    # Process signal in overlapping frames
    frame_id = 0
    start_idx = 0
    
    while start_idx + frame_size <= len(signal):
        # Extract frame
        frame = signal[start_idx:start_idx + frame_size]
        
        # Apply window function (Hanning) to reduce spectral leakage
        window = np.hanning(frame_size)
        windowed_frame = frame * window
        
        # Perform FFT on this frame
        fft_values = np.fft.fft(windowed_frame)
        fft_freq = np.fft.fftfreq(frame_size, d=time_interval/1000)  # Frequency bins in Hz
        
        # Get magnitude (absolute value) and only positive frequencies
        magnitude = np.abs(fft_values)
        positive_freq_idx = fft_freq >= 0
        
        # Store results with frame ID
        frame_frequencies = fft_freq[positive_freq_idx]
        frame_magnitudes = magnitude[positive_freq_idx]
        
        all_frequencies.extend(frame_frequencies)
        all_magnitudes.extend(frame_magnitudes)
        all_frame_ids.extend([frame_id] * len(frame_frequencies))
        
        # Move to next frame
        start_idx += hop_size
        frame_id += 1
    
    # Create frequency domain dataframe
    freq_df = pd.DataFrame({
        'frame_id': all_frame_ids,
        'frequency': all_frequencies,
        'magnitude': all_magnitudes
    })
    
    print(f"Processed {frame_id} frames with {overlap_percent}% overlap")
    
    return freq_df, sampling_rate

def process_file(csv_file, frame_size=30, overlap_percent=50):
    """
    Process single CSV file
    Apply FFT to convert from time domain to frequency domain.
    
    Args:
        csv_file: Path to input CSV file
        frame_size: Number of data points in each frame/window
        overlap_percent: Overlap percentage between consecutive frames (0-100)
    Returns:
        freq_df: DataFrame with 'frequency' (Hz) and 'magnitude' columns
        sampling_rate: Sampling rate in Hz
    """
    
    print(f"Processing {csv_file}...")
    
    # Read CSV
    time_df = pd.read_csv(csv_file)
    
    # Convert to frequency domain
    freq_df, sampling_rate = fourier_transform(time_df, frame_size, overlap_percent)

    return freq_df, sampling_rate