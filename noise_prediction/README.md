# Instructions for using noise_prediction folder

** DO NOT DELETE `raw_data` FOLDER

Please run `main.ipynb` file for preprocessing, training, and evaluation.

Folders and files:

1. `sample_data`: Contains both raw and processed data
2. `model_data`: Data splits for train, val, and test csvs. Each csv contains data for one frame of frequency and magnitaude values.
3. `preprocessing.py`: For all data preprocessing functions
4. `training.py`: For all split and training functions

For now, we are only predicting 3 classes, `background`, `shout`, and `drill` noises.

# Details on raw data

Collected by Sitong :D

Data attributes are:

`{`
    `"timestamp"`
    `"analog_value"`
    `"digital_value"`
`}`

- Data is streamed from ESP32, sound is sampled from KY-037 sensor. Each file contains about ~25 seconds of data, with around 800+ data points. The data is read from terminal, so the data can be unstructured as lines will overlap each other when the sampling rate is too high. Data is sampled every 10ms, however there are delays from the I/O from the sensor to terminal output which result in data being sampled at a irregular interval (estimated ~28ms on average). 
- Background noise at: 0s - 5s, 10s - 15s, 20s - 25s
- Shout/drill noise at: 5s - 10s, 15s - 20s, 25s - 30s
  