import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("NoiseLog")

def lambda_handler(event, context):
    """
    HTTP GET function to return list of houses that match:
        - noiseClass
        - timestamp range
    """

    try:
        # Read query-string parameters from API Gateway
        params = event.get("queryStringParameters", {}) or {}

        noise_class = params.get("noiseClass")
        start_ts = params.get("startTimestamp")
        end_ts = params.get("endTimestamp")

        # Validate inputs
        if noise_class is None:
            return {"statusCode": 400, "body": json.dumps({"error": "noiseClass is required"})}

        if start_ts is None:
            return {"statusCode": 400, "body": json.dumps({"error": "startTimestamp is required"})}

        if end_ts is None:
            return {"statusCode": 400, "body": json.dumps({"error": "endTimestamp is required"})}

        noise_class = int(noise_class)
        start_ts = int(start_ts)
        end_ts = int(end_ts)

        response = table.query(
            IndexName="NoiseClassIndex",
            KeyConditionExpression=Key("noiseClass").eq(noise_class) &
                                   Key("timestamp").between(start_ts, end_ts)
        )

        items = response.get("Items", [])

        # Extract the list of houses with corresponding "timestamp" attribute
        house_list = [
            {
                "house": item["houseName"],
                "timestamp": int(item["timestamp"])
            }
            for item in items
        ]
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "noiseClass": noise_class,
                "startTimestamp": start_ts,
                "endTimestamp": end_ts,
                "houses": house_list
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
