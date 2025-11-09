import json
import boto3
import time

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SensorData')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])  # data from HTTP POST
        device_id = body.get('deviceId')
        value = body.get('value')
        timestamp = int(time.time())

        table.put_item(Item={
            'deviceId': device_id,
            'timestamp': timestamp,
            'value': value
        })

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Data stored successfully'})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

