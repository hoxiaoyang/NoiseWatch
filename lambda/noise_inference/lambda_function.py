import pandas as pd
import numpy as np
import joblib
import numpy as np
import pandas as pd
import json
import boto3

# Logging for CLoudWatch
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.client("dynamodb")
TABLE_NAME = "NoiseLog"

# s3 = boto3.client("s3")

# # get environment variables
# model_bucket = os.environ['MODEL_BUCKET']
# model_key =  os.environ['MODEL_KEY']

# # S3 location of the model
# MODEL_BUCKET = model_bucket
# MODEL_KEY = model_key

# cached model
# model = None

# def load_model():
#     global model
#     if model is not None:
#         return model

#     # download to temp directory
#     temp_path = os.path.join(tempfile.gettempdir(), "model.joblib")
#     s3.download_file(MODEL_BUCKET, MODEL_KEY, temp_path)

#     model = joblib.load(temp_path)
#     return model

model = joblib.load("model.joblib")

def process_unstructured_data_to_csv(dictionary):
    """
    Convert raw data in file into pandas dataframe based on the specified time interval (in ms). Will save the dataframe as a CSV file.

    Args:
        dictionary: Data should be in following format: 
        {   
            "start_time": <timestamp>,
            "house_id": <id>,
            "data": [ {"timestamp": <timestamp1>, "analog_value": <value1>}, {"timestamp": <timestamp2>, "analog_value": <value2>}, ... for 30 sets of values]
        }
        time_interval: Time interval between data points in milliseconds.
    Returns:
        df: Pandas DataFrame with columns 'timestamp' and 'analog_value'
    """

    # Extract all analog values. For timestamp, increment by the time interval for each line.
    data = dictionary["data"]
    df = pd.DataFrame(data)

    return df

def fourier_transform(df):
    """
    Transform time-domain data to frequency domain using windowed FFT.
    
    Args:
        df: DataFrame with 'timestamp' (ms) and 'analog_value' columns
        
    Returns:
        freq_df: DataFrame with 'frequency' (Hz) and 'magnitude' columns
        sampling_rate: Sampling rate in Hz
    """

    # Get frame size from number of rows in df
    frame_size = len(df)

    # Extract values
    timestamps = df['timestamp'].values  # in milliseconds
    signal = df['analog_value'].values
    
    # Calculate sampling parameters
    time_interval = timestamps[1] - timestamps[0]  # ms between samples
    sampling_rate = 1000 / time_interval  # Convert to Hz (samples per second)
    
    # Initialize lists to store results
    all_frequencies = []
    all_magnitudes = []
    
    frame = signal
    
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
        
    # Create frequency domain dataframe
    freq_df = pd.DataFrame({
        'frequency': all_frequencies,
        'magnitude': all_magnitudes
    })
    
    return freq_df, sampling_rate

def extract_spectral_features(freq_df):
    """Extract features without normalization."""
    magnitude = freq_df['magnitude'].values
    frequency = freq_df['frequency'].values
    
    features = []

    sum = np.sum(magnitude)
    
    # Statistical features (8 features)
    features.append(np.mean(magnitude))
    features.append(np.std(magnitude))
    features.append(np.max(magnitude))
    features.append(np.median(magnitude))
    features.append(np.percentile(magnitude, 25))
    features.append(np.percentile(magnitude, 75))
    features.append(sum)
    features.append(np.var(magnitude))
    
    # Spectral features
    spectral_centroid = np.sum(frequency * magnitude) / sum
    features.append(spectral_centroid)
    
    dominant_freq = frequency[np.argmax(magnitude)]
    features.append(dominant_freq)
    
    cumsum = np.cumsum(magnitude)
    rolloff_threshold = 0.85 * cumsum[-1]
    rolloff_idx = np.where(cumsum >= rolloff_threshold)[0][0]
    spectral_rolloff = frequency[rolloff_idx]
    features.append(spectral_rolloff)
    
    spectral_bandwidth = np.sqrt(np.sum(((frequency - spectral_centroid) ** 2) * magnitude) / sum)
    features.append(spectral_bandwidth)
    
    features.append(np.sum(magnitude[frequency < 100]))
    
    return np.array(features)

def lambda_handler(event, context):
    """
    AWS Lambda handler function for inference.
    
    Args:
        event: Dictionary containing input data in specified format.
        context: Lambda Context runtime methods and attributes.
    Returns:
        prediction: Predicted label.
    """

    # model = load_model()

    try:
        body = json.loads(event['body'])  # data from HTTP POST

        # Get "house_id" if needed
        house_id = body.get("house_id")

        # Get start time if needed
        start_time = body.get("start_time")

        # Get data from input to this function
        df = process_unstructured_data_to_csv(body)

        freq_df, sampling_rate = fourier_transform(df)

        features = extract_spectral_features(freq_df)

        prediction = model.predict([features])

        logger.info(f"Prediction successful: {prediction[0]}")

        dynamodb.put_item(
            TableName=TABLE_NAME,
            Item={
                "houseName": {"S": house_id},
                "timestamp": {"N": str(start_time)},
                "noiseClass": {"N": str(prediction[0])}
            }
        )

        logger.info("Successfully inserted item into DynamoDB")

        return {
            'statusCode': 200,
            'body': json.dumps({'predicted_label': int(prediction[0])})
        }
    
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    