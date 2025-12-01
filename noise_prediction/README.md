** DO NOT DELETE `raw_data` FOLDER

Please run `main.ipynb` file for preprocessing, training, and evaluation.

Folders and files:

1. `sample_data`: Contains both raw and processed data
2. `model_data`: Data splits for train, val, and test csvs. Each csv contains data for one frame of frequency and magnitaude values.
3. `preprocessing.py`: For all data preprocessing functions
4. `training.py`: For all split and training functions

For now, we are only predicting 3 classes, `background`, `shout`, and `drill` noises.