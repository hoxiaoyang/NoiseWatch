# List of deployed lambda functions:

1. *noise_inference* endpoint: receives data in the format of HTTP post, needs attribute:
        `{`   
            `"start_time": <timestamp>,`
            `"house_id": <id>,`
            `"data": [ {"timestamp": <timestamp1>, "analog_value": <value1>}, {"timestamp": <timestamp2>, "analog_value": <value2>}, ... for 30 sets of values]`
        `}`

    If inference is successful, it returns: 

    `"statusCode": 200,`
        `"body": "{\"predicted_label\": 2}"`
    `}`