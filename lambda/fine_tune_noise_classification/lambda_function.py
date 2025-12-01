import json
import boto3
import time

sagemaker_client = boto3.client('sagemaker', region_name='ap-southeast-1')

def lambda_handler(event, context):
    try:
        job_name = f"noise-train-{int(time.time())}"

        response = sagemaker_client.create_training_job(
            TrainingJobName=job_name,
            AlgorithmSpecification={
                "TrainingImage": "121021644041.dkr.ecr.ap-southeast-1.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3",
                "TrainingInputMode": "File"
            },
            RoleArn="arn:aws:iam::<Account ID>:role/service-role/<Sagemaker execution role>",
            HyperParameters={
                "sagemaker_program": "train.py",
                "sagemaker_submit_directory": "s3://my-sagemaker-inputs-noise/aws_sagemaker/source/sourcedir.tar.gz",
                "sagemaker_requirements": "requirements.txt" 
            },
            InputDataConfig=[
                {
                    "ChannelName": "background",
                    "DataSource": {
                        "S3DataSource": {
                            "S3DataType": "S3Prefix",
                            "S3Uri": "s3://my-sagemaker-inputs-noise/aws_sagemaker/background.csv",
                            "S3DataDistributionType": "FullyReplicated"
                        }
                    },
                    "ContentType": "text/csv"
                },
                {
                    "ChannelName": "shout",
                    "DataSource": {
                        "S3DataSource": {
                            "S3DataType": "S3Prefix",
                            "S3Uri": "s3://my-sagemaker-inputs-noise/aws_sagemaker/shout.csv",
                            "S3DataDistributionType": "FullyReplicated"
                        }
                    },
                    "ContentType": "text/csv"
                },
                {
                    "ChannelName": "drill",
                    "DataSource": {
                        "S3DataSource": {
                            "S3DataType": "S3Prefix",
                            "S3Uri": "s3://my-sagemaker-inputs-noise/aws_sagemaker/drill.csv",
                            "S3DataDistributionType": "FullyReplicated"
                        }
                    },
                    "ContentType": "text/csv"
                }
            ],
            OutputDataConfig={
                "S3OutputPath": "s3://my-sagemaker-inputs-noise/aws_sagemaker/output"
            },
            ResourceConfig={
                "InstanceType": "ml.m5.large",
                "InstanceCount": 1,
                "VolumeSizeInGB": 10
            },
            StoppingCondition={
                "MaxRuntimeInSeconds": 3600
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Training job started",
                "TrainingJobName": job_name,
                "TrainingJobArn": response['TrainingJobArn']
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }