# Details on data

`data.txt` - Collected by Sitong :D

Data attributes are:

`{`
    `"timestamp"`
    `"analog_value"`
    `"digital_value"`
`}`

- Data is streamed from ESP32, sound is sampled from KY-037 sensor. Each file contains about ~25 seconds of data, with around 800+ data points. The data is read from terminal, so the data can be unstructured as lines will overlap each other when the sampling rate is too high. Data is sampled every 10ms, however there are delays from the I/O from the sensor to terminal output which result in data being sampled at a irregular interval (estimated ~30ms on average). 
- Background noise at: 0s - 5s, 10s - 15s, 20s - 25s
- Shout noise at: 5s - 10s, 15s - 20s, 25s - 30s
  