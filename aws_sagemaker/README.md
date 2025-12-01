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