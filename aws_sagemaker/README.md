# Using Sagemaker UI Notebook Instance

We need to upload the aws_sagemaker folder and its file contents onto Sagemaker UI Notebook instance. Run the below code in the Jupyter notebook cell. This will help create the training job.


```
from sagemaker.sklearn.estimator import SKLearn

role = "arn:aws:iam::<Account ID>:role/service-role/<Execution Role>"

estimator = SKLearn(
    entry_point="train.py",
    source_dir="/home/ec2-user/SageMaker/aws_sagemaker",
    role=role,
    instance_type="ml.m5.large",
    instance_count=1,
    framework_version="1.2-1",
    py_version="py3",
)

estimator.fit(
    inputs={
        "background": "s3://my-sagemaker-inputs-noise/aws_sagemaker/background.csv",
        "shout": "s3://my-sagemaker-inputs-noise/aws_sagemaker/shout.csv",
        "drill": "s3://my-sagemaker-inputs-noise/aws_sagemaker/drill.csv"
    }
)
```

To check the image URI being used (for the configuration specified), run this in a notebook cell.

```
from sagemaker import image_uris

image_uri = image_uris.retrieve(
    framework='sklearn',
    region='ap-southeast-1',
    version='1.2-1',
    py_version='py3',
    instance_type='ml.m5.large'
)
print(image_uri)
```

You should package the python files to store in your EC2 bucket using the following commands:

`tar -czf sourcedir.tar.gz train.py preprocessing.py feature_extract.py model.joblib requirements.txt`

`aws s3 cp sourcedir.tar.gz s3://my-sagemaker-inputs-noise/aws_sagemaker/source/`


Take note that Sagemaker will store your files in this way if you follow above steps:

```
/opt/ml/
├── code/                           # Your source code (cwd)
│   ├── train.py
│   ├── preprocessing.py
│   ├── feature_extract.py
│   └── model.joblib              # If you packaged it in tarball
├── input/
│   └── data/
│       ├── background/
│       │   └── background.csv
│       ├── shout/
│       │   └── shout.csv
│       └── drill/
│           └── drill.csv
├── model/                         # Where you save final model
│   └── model.joblib              # Saved after training
└── output/                        # For failure logs
```