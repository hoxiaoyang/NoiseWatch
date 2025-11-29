# List of deployed lambda functions:

1. *noise_inference* endpoint: 

Receives data in the format of HTTP post, Data format of input:

`{`   
    `"start_time": <timestamp>,`
    `"house_id": <id>,`
    `"data": [ {"timestamp": <timestamp1>, "analog_value": <value1>}, {"timestamp": <timestamp2>, "analog_value": <value2>}, ... for 30 sets of values]`
`}`

If inference is successful, it returns: 

`"statusCode": 200,`
    `"body": "{\"predicted_label\": 2}"`
`}`

2. *get_house* endpoint: 

Receives data in format of HTTP get. Data format of example input:

`{`
  `"queryStringParameters": {`
    `"noiseClass": "2",`
    `"startTimestamp": "1763648995",`
    `"endTimestamp": "1764426595"`
  `}`
`}`

If the search is successful, it returns:

`{`
  `"statusCode": 200,`
  `"body": "{"noiseClass": 2, "startTimestamp": 1763648995, "endTimestamp": 1764426595, "timestampByHouse": {"house_123": [1764257968]}}"`
`}`

3. *get_house_without_label* endpoint:

Receives data in format of HTTP get. Data format of example input:

`{`
  `"queryStringParameters": {`
    `"startTimestamp": "1763648995",`
    `"endTimestamp": "1764426595"`
  `}`
`}`

If the search is successful, it returns:

`{`
  `"statusCode": 200,`
  `"body": "{"noiseClass": 2, "startTimestamp": 1763648995, "endTimestamp": 1764426595, "houses\": {"house_123": [{"house": "house_123", "timestamp": 1763648995, "noiseClass": 2}]}}"`
`}`