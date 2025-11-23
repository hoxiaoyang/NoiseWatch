import pandas as pd
import numpy as np
import re
import os
import matplotlib.pyplot as plt

def process_unstructured_data_to_csv(file_name, time_interval):
    """
    Convert raw data in file into pandas dataframe based on the specified time interval (in ms). Will save the dataframe as a CSV file.

    Args:
        file_name: File name of raw data. Data should contain "analog_value" attribute.
        time_interval: Time interval in milliseconds for data aggregation.
    """
    
    # Read file line by line
    with open(file_name, 'r') as file:

        lines = file.readlines()

        # Initialise pandas dataframe
        df = pd.DataFrame(columns=['timestamp', 'analog_value'])

        # Initialise list to hold timestamp and analog values
        timestamps = []
        analog_values = []

        # Extract all lines containing "analog_value", and add to dataframe. For timestamp, increment by the time interval for each line.
        timestamp = 0
        for line in lines:
            if "analog_value\":" in line:
                # Extract analog value
                analog_value_str = line.split("analog_value\":")[1]

                # Extract just the number (remove commas, brackets, quotes, etc.)
                match = re.search(r'[-+]?\d*\.?\d+', analog_value_str)
                if match:
                    analog_value = float(match.group())

                # These values might be wrong, due to the transmission delay and overlapping of data packets when we log values from the microcontroller. We are not able to parse a clean data set from the raw data log.
                # Hence, we need to check that data is NEVER above 4096 (12-bit ADC max value). If it is, we set it to the previous value.
                # We assume that the value will never drop to below 1000 (tested values range from 2000+ to 3000+) If it is, we set it to the previous value as well.
                if analog_value > 4096:
                    if len(analog_values) > 0:
                        analog_value = analog_values[-1]
                    else:
                        analog_value = 0.0  # If it's the first value, set to 0

                if analog_value <= 1000:
                    if len(analog_values) > 0:
                        analog_value = analog_values[-1]
                    else:
                        analog_value = 0.0  # If it's the first value, set to 0

                # Add analog value and timestamp to list
                analog_values.append(analog_value)
                timestamps.append(timestamp)

                # Increment timestamp
                timestamp += time_interval

        # Add lists to dataframe
        df['timestamp'] = timestamps
        df['analog_value'] = analog_values

        # Save dataframe as CSV into the "structured" directory that is one level up from the raw data file
        directory = os.path.dirname(os.path.dirname(file_name))
        structured_dir = os.path.join(directory, 'structured')
        os.makedirs(structured_dir, exist_ok=True)
        print("Directory:", directory)
        base_name = os.path.splitext(os.path.basename(file_name))[0]
        csv_file_name = os.path.join(structured_dir, base_name + '_structured.csv')
        df.to_csv(csv_file_name, index=False)

        print(f"CSV file saved as {csv_file_name}")


def get_labelled_csv(csv_file_name, type='shout'):
    """
    Convert the csv into labelled csv files based on time intervals. 
    Label data as "shout"/"drill" at: 0s - 5s, 10s - 15s, 20s - 25s
    Label data as "background" at: 5s - 10s, 15s - 20s
    
    Args:
        csv_file_name: File name of the processed CSV data.
        type: 'shout' or 'drill' to indicate the type of noise event.
    """

    # Add "_structured" to file name if not already present
    if '_structured' not in csv_file_name:
        base_name = csv_file_name.split('.')[0]
        # If the file is in raw_data directory, look for structured version in structured subdirectory
        if 'raw_data' in csv_file_name:
            directory = os.path.dirname(os.path.dirname(csv_file_name))
            structured_dir = os.path.join(directory, 'structured')
            csv_file_name = os.path.join(structured_dir, os.path.basename(base_name) + '_structured.csv')
        else:
            csv_file_name = base_name + '_structured.csv'

    # Read CSV file into pandas dataframe
    df = pd.read_csv(csv_file_name)

    # Divide df into 6 intervals based on the labelling scheme
    df_length = len(df)
    interval_length = df_length // 6
    
    # Get base name for output files (remove '_structured' suffix if present)
    base_name = os.path.splitext(os.path.basename(csv_file_name))[0]
    if base_name.endswith('_structured'):
        base_name = base_name[:-11]  # Remove '_structured'
    
    # Create labelled directory and subdirectories
    directory = os.path.dirname(os.path.dirname(csv_file_name))
    labelled_dir = os.path.join(directory, 'labelled')
    shout_dir = os.path.join(labelled_dir, 'shout')
    drill_dir = os.path.join(labelled_dir, 'drill')
    background_dir = os.path.join(labelled_dir, 'background')
    
    os.makedirs(shout_dir, exist_ok=True)
    os.makedirs(drill_dir, exist_ok=True)
    os.makedirs(background_dir, exist_ok=True)
    
    # Create 5 separate CSV files
    if type == 'drill':
        intervals = [
            (0, interval_length, f"{base_name}_1.csv", "drill", drill_dir),
            (interval_length, 2 * interval_length, f"{base_name}_2.csv","background", background_dir),
            (2 * interval_length, 3 * interval_length, f"{base_name}_3.csv", "drill", drill_dir),
            (3 * interval_length, 4 * interval_length, f"{base_name}_4.csv","background", background_dir),
            (4 * interval_length, df_length, f"{base_name}_5.csv", "drill", drill_dir),
        ]
    else:  # type == 'shout'
        intervals = [
            (0, interval_length, f"{base_name}_1.csv", "shout", shout_dir),
            (interval_length, 2 * interval_length, f"{base_name}_2.csv","background", background_dir),
            (2 * interval_length, 3 * interval_length, f"{base_name}_3.csv", "shout", shout_dir),
            (3 * interval_length, 4 * interval_length, f"{base_name}_4.csv","background", background_dir),
            (4 * interval_length, df_length, f"{base_name}_5.csv", "shout", shout_dir),
        ]
    
    for start_idx, end_idx, filename, label, output_dir in intervals:
        # Extract subset of dataframe
        subset_df = df.iloc[start_idx:end_idx].copy()
        
        # Add label column
        subset_df['label'] = label
        
        # Save to CSV in appropriate label directory
        output_path = os.path.join(output_dir, filename)
        subset_df.to_csv(output_path, index=False)
        
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

def plot_frequency_spectrum(time_df, freq_df, title="Frequency Spectrum", directory="spectrograms"):
    """Plot both time and frequency domain representations of the signal. Save in specified directory.
    Args:
        df: DataFrame with 'timestamp' (ms) and 'analog_value' columns
        title: Title for the plots
        directory: Directory to save the plots
    """
    # Create output directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)
    
    plt.figure(figsize=(12, 8))

    # Time domain plot
    plt.subplot(2, 1, 1)
    plt.plot(time_df['timestamp'], time_df['analog_value'])
    plt.title(f"{title} - Time Domain")
    plt.xlabel("Time (ms)")
    plt.ylabel("Analog Value")
    plt.grid()

    # Frequency domain plot (We will just plot the 2nd frame as an example)
    plt.subplot(2, 1, 2)
    frame_id = 1
    frame_data = freq_df[freq_df['frame_id'] == frame_id]
    plt.plot(frame_data['frequency'], frame_data['magnitude'])
    plt.title(f"{title} - Frequency Domain (Frame {frame_id})")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude")
    plt.grid()

    # Save plot
    plot_file_name = os.path.join(directory, f"{title}_spectrum.png")
    plt.tight_layout()
    plt.savefig(plot_file_name)
    plt.close()

def process_all_files(input_base_dir, output_base_dir, frame_size=30, overlap_percent=50):
    """
    Process all CSV files in background, shout and drill folders.
    Apply FFT to convert from time domain to frequency domain.
    
    Args:
        input_base_dir: Base directory containing background/ and shout/ and drill/ CSV folders
        output_base_dir: Where to save frequency domain files
    """
    classes = ['background', 'shout', 'drill']
    
    for class_name in classes:
        input_dir = os.path.join(input_base_dir, class_name)
        output_freq_dir = os.path.join(output_base_dir, class_name)
        
        # Create output directory
        os.makedirs(output_freq_dir, exist_ok=True)
        
        # Get all CSV files
        csv_files = [f for f in os.listdir(input_dir) if f.endswith('.csv')]
        
        for file_name in csv_files:
            print(f"Processing {class_name}/{file_name}...")
            
            # Read CSV
            input_path = os.path.join(input_dir, file_name)
            time_df = pd.read_csv(input_path)
            
            # Convert to frequency domain
            freq_df, sampling_rate = fourier_transform(time_df, frame_size, overlap_percent)

            # Plot and save spectrogram in directory one level up from output_freq_dir
            spectrogram_directory = os.path.dirname(output_freq_dir) + '/spectrograms/' + class_name
            print("Spectrogram directory:", spectrogram_directory)

            plot_frequency_spectrum(time_df, freq_df, title=f"{class_name.capitalize()} - {file_name}", directory=spectrogram_directory)
            
            # Save frequency domain CSV, for each frame_id save a separate CSV file
            base_name = os.path.splitext(file_name)[0]
            for frame_id in freq_df['frame_id'].unique():
                frame_data = freq_df[freq_df['frame_id'] == frame_id]
                output_file_name = f"{base_name}_frame{frame_id}.csv"
                output_path = os.path.join(output_freq_dir, output_file_name)
                frame_data.to_csv(output_path, index=False)