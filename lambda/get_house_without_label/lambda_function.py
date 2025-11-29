import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("NoiseLog")

def lambda_handler(event, context):
    """
    HTTP GET function to return list of houses that have any noiseClass,
    with timestamps between startTimestamp and endTimestamp.
    Returns all attributes.
    """

    try:
        # Read query-string parameters from API Gateway
        params = event.get("queryStringParameters", {}) or {}

        start_ts = params.get("startTimestamp")
        end_ts = params.get("endTimestamp")

        # Validate inputs
        if start_ts is None:
            return {"statusCode": 400, "body": json.dumps({"error": "startTimestamp is required"})}
        if end_ts is None:
            return {"statusCode": 400, "body": json.dumps({"error": "endTimestamp is required"})}

        start_ts = int(start_ts)
        end_ts = int(end_ts)

        # Query TimestampIndex GSI
        # 1 is a dummy value for the partition key
        response = table.query(
            IndexName="TimestampIndex",
            KeyConditionExpression=Key("dummy").eq("1") & Key("timestamp").between(start_ts, end_ts)
        )

        items = response.get("Items", [])

        # Convert Decimal to int/float for JSON
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                if obj % 1 == 0:
                    return int(obj)
                return float(obj)
            raise TypeError

        # Group items by houseName using a normal dict
        house_dict = {}
        for item in items:
            house = item["houseName"]
            record = {
                "house": house,
                "timestamp": int(item["timestamp"]),
                "noiseClass": int(item["noiseClass"])
            }
            if house in house_dict:
                house_dict[house].append(record)
            else:
                house_dict[house] = [record]

        return {
            "statusCode": 200,
            "body": json.dumps({
                "startTimestamp": start_ts,
                "endTimestamp": end_ts,
                "houses": house_dict
            }, default=decimal_default)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }