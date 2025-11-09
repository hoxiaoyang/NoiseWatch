The lambda function is deployed. Communication with the endpoint is throguh websocket, since we need:
1. Sensors to send periodic updates on noise levels to be stored in DynamoDB
2. Our servers will ping our hardware to make sure that it is all functioning correctly and reponsive.