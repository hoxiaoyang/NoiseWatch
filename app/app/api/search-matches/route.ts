import { NextRequest, NextResponse } from 'next/server';
import { NoiseMatch } from '../../types';

/**
 * API Route: Search for matching noise records
 * 
 * This route integrates with AWS Lambda to search for noise records
 * that match the user's complaint parameters.
 * 
 * Expected request body:
 * {
 *   unitNumber: string,
 *   startTime: string (ISO 8601),
 *   endTime: string (ISO 8601),
 *   description: string
 * }
 * 
 * Expected response:
 * {
 *   matches: Array<{
 *     id: string,
 *     houseName: string,
 *     timestamp: string,
 *     confidenceScore: number,
 *     description: string
 *   }>
 * }
 */

// Convert ISO 8601 timestamp to Unix timestamp (seconds)
function isoToUnixTimestamp(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

// Convert Unix timestamp (seconds) to ISO 8601 string
function unixToIsoTimestamp(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString();
}


// Map description to noise class
// 0 -> background, 1 -> shout, 2 -> drill
function getNoiseClassFromDescription(description: string): number | null {
  const desc = description.toLowerCase();
  
  if (desc.includes('shout') || desc.includes('shouting') || desc.includes('yell') || desc.includes('yelling')) {
    return 1; // shout
  }
  if (desc.includes('drill') || desc.includes('drilling') || desc.includes('renovation') || desc.includes('construction')) {
    return 2; // drill
  }
  
  // For "Other" or unknown, return null to use get_house_without_label
  return null;
}

// Map noise class to description
// 0 -> background, 1 -> shout, 2 -> drill
function getDescriptionFromNoiseClass(noiseClass: number): string {
  switch (noiseClass) {
    case 0:
      return 'Background noise';
    case 1:
      return 'Shouting';
    case 2:
      return 'Drilling';
    default:
      return 'Noise disturbance';
  }
}

// Transform Lambda response from get_house_without_label to NoiseMatch format
function transformLambdaResponseToMatches(
  responseData: any,
  body: any,
  startTimestamp?: number,
  endTimestamp?: number
): NoiseMatch[] {
  const matches: NoiseMatch[] = [];
  
  // Calculate timestamps if not provided (for mock data)
  const startTs = startTimestamp || Math.floor(new Date(body.startTime).getTime() / 1000);
  const endTs = endTimestamp || Math.floor(new Date(body.endTime).getTime() / 1000);
  
  if (responseData.houses) {
    for (const [houseName, noiseEvents] of Object.entries(responseData.houses)) {
      const events = Array.isArray(noiseEvents) ? noiseEvents : [];
      
      for (const event of events) {
        // Calculate confidence score based on time proximity
        const complaintMidpoint = (startTs + endTs) / 2;
        const timeDifference = Math.abs(event.timestamp - complaintMidpoint);
        const timeWindow = endTs - startTs;
        const timeProximityScore = Math.max(0, 100 - (timeDifference / timeWindow) * 100);
        
        const noiseClassScore = event.noiseClass >= 2 ? 80 : 60;
        const confidenceScore = Math.round((timeProximityScore * 0.6) + (noiseClassScore * 0.4));

        matches.push({
          id: `${houseName}_${event.timestamp}`,
          houseName: houseName as string,
          timestamp: unixToIsoTimestamp(event.timestamp),
          confidenceScore: Math.min(100, Math.max(50, confidenceScore)),
          description: getDescriptionFromNoiseClass(event.noiseClass),
        });
      }
    }
  }

  // Sort matches by confidence score (highest first)
  matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
  
  return matches;
}

// Transform Lambda response from get_house (with noise class) to NoiseMatch format
// This endpoint returns timestampByHouse instead of houses with full event objects
function transformGetHouseResponseToMatches(
  responseData: any,
  body: any,
  noiseClass: number,
  startTimestamp: number,
  endTimestamp: number
): NoiseMatch[] {
  const matches: NoiseMatch[] = [];
  
  if (responseData.timestampByHouse) {
    for (const [houseName, timestamps] of Object.entries(responseData.timestampByHouse)) {
      const timestampArray = Array.isArray(timestamps) ? timestamps : [];
      
      for (const timestamp of timestampArray) {
        // Calculate confidence score based on time proximity
        const complaintMidpoint = (startTimestamp + endTimestamp) / 2;
        const timeDifference = Math.abs(timestamp - complaintMidpoint);
        const timeWindow = endTimestamp - startTimestamp;
        const timeProximityScore = Math.max(0, 100 - (timeDifference / timeWindow) * 100);
        
        const noiseClassScore = noiseClass >= 2 ? 80 : 60;
        const confidenceScore = Math.round((timeProximityScore * 0.6) + (noiseClassScore * 0.4));

        matches.push({
          id: `${houseName}_${timestamp}`,
          houseName: houseName as string,
          timestamp: unixToIsoTimestamp(timestamp),
          confidenceScore: Math.min(100, Math.max(50, confidenceScore)),
          description: getDescriptionFromNoiseClass(noiseClass),
        });
      }
    }
  }

  // Sort matches by confidence score (highest first)
  matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
  
  return matches;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'startTime and endTime are required' },
        { status: 400 }
      );
    }

    // Convert ISO timestamps to Unix timestamps
    const startTimestamp = isoToUnixTimestamp(body.startTime);
    const endTimestamp = isoToUnixTimestamp(body.endTime);

    // Validate timestamp range
    if (startTimestamp >= endTimestamp) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 }
      );
    }

    // Check if mock mode is enabled (for testing)
    const useMockData = process.env.USE_MOCK_DATA === 'true' || (!process.env.LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT && !process.env.LAMBDA_GET_HOUSE_ENDPOINT);
    
    if (useMockData) {
      console.log('Using mock data for testing');
      // Determine noise class from description
      const noiseClass = getNoiseClassFromDescription(body.description) || 2;
      
      // Simulate Lambda response format with statusCode and body wrapper
      const mockLambdaResponse = {
        statusCode: 200,
        body: JSON.stringify({
          noiseClass: noiseClass,
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp,
          houses: {
            "house_124": [
              {
                house: "house_124",
                timestamp: startTimestamp + 3600, // 1 hour after start
                noiseClass: noiseClass
              }
            ],
            "house_123": [
              {
                house: "house_123",
                timestamp: startTimestamp + 7200, // 2 hours after start
                noiseClass: noiseClass
              }
            ],
            "house_125": [
              {
                house: "house_125",
                timestamp: startTimestamp + 5400, // 1.5 hours after start
                noiseClass: noiseClass
              }
            ]
          }
        })
      };
      
      // Process mock data the same way as real Lambda response
      let responseData = mockLambdaResponse;
      if (responseData.statusCode && responseData.body) {
        responseData = typeof responseData.body === 'string' 
          ? JSON.parse(responseData.body) 
          : responseData.body;
      }
      
      // Transform to NoiseMatch format (same logic as below)
      const matches = transformLambdaResponseToMatches(responseData, body, startTimestamp, endTimestamp);
      
      return NextResponse.json(
        { 
          matches,
          message: matches.length > 0 
            ? `Found ${matches.length} matching noise record(s) (MOCK DATA - Noise Class ${noiseClass})` 
            : 'No matching noise records found in the specified time range'
        },
        { status: 200 }
      );
    }

    // Try to determine noise class from description
    const noiseClass = getNoiseClassFromDescription(body.description);
    const getHouseEndpoint = process.env.LAMBDA_GET_HOUSE_ENDPOINT;
    const useGetHouseEndpoint = noiseClass !== null && getHouseEndpoint;
    
    let matches: NoiseMatch[] = [];
    let endpointUsed = '';

    // Try get_house endpoint first if we have a noise class and the endpoint is configured
    if (useGetHouseEndpoint && getHouseEndpoint) {
      try {
        const url = new URL(getHouseEndpoint);
        url.searchParams.append('noiseClass', noiseClass.toString());
        url.searchParams.append('startTimestamp', startTimestamp.toString());
        url.searchParams.append('endTimestamp', endTimestamp.toString());
        
        const lambdaResponse = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (lambdaResponse.ok) {
          const lambdaData = await lambdaResponse.json();
          
          // Handle Lambda response format
          let responseData = lambdaData;
          if (lambdaData.statusCode && lambdaData.body) {
            responseData = typeof lambdaData.body === 'string' 
              ? JSON.parse(lambdaData.body) 
              : lambdaData.body;
          }

          // Transform get_house response (has timestampByHouse format)
          matches = transformGetHouseResponseToMatches(responseData, body, noiseClass, startTimestamp, endTimestamp);
          endpointUsed = `get_house (noiseClass=${noiseClass})`;
          
          if (matches.length > 0) {
            return NextResponse.json(
              { 
                matches,
                message: `Found ${matches.length} matching noise record(s) using noise class filter (${noiseClass})`
              },
              { status: 200 }
            );
          }
        } else {
          console.warn(`get_house endpoint returned ${lambdaResponse.status}, falling back to get_house_without_label`);
        }
      } catch (error) {
        console.warn('Error calling get_house endpoint, falling back to get_house_without_label:', error);
      }
    }

    // Fallback to get_house_without_label endpoint
    const lambdaEndpoint = process.env.LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT;
    
    if (!lambdaEndpoint) {
      console.error('LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT is not configured');
      return NextResponse.json(
        { error: 'Lambda endpoint not configured' },
        { status: 500 }
      );
    }

    // Call Lambda function
    let url: URL;
    try {
      url = new URL(lambdaEndpoint);
      url.searchParams.append('startTimestamp', startTimestamp.toString());
      url.searchParams.append('endTimestamp', endTimestamp.toString());
    } catch (urlError) {
      console.error('Invalid Lambda endpoint URL:', lambdaEndpoint, urlError);
      return NextResponse.json(
        { error: 'Invalid Lambda endpoint URL configuration' },
        { status: 500 }
      );
    }
    
    let lambdaResponse: Response;
    try {
      lambdaResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      console.error('Failed to connect to Lambda endpoint:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to Lambda endpoint. Please check your network connection and endpoint URL.' },
        { status: 502 }
      );
    }

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error('Lambda API error:', lambdaResponse.status, errorText);
      return NextResponse.json(
        { error: `Lambda API error (${lambdaResponse.status}): ${errorText || 'Unknown error'}` },
        { status: 502 }
      );
    }

    const lambdaData = await lambdaResponse.json();
    
    // Handle Lambda response format (may have statusCode and body wrapper)
    // According to lambda/README.md, the response format is:
    // { "statusCode": 200, "body": "{\"noiseClass\": 2, \"startTimestamp\": ..., \"houses\": {...}}" }
    let responseData = lambdaData;
    if (lambdaData.statusCode && lambdaData.body) {
      // The body is a JSON string, so we need to parse it
      responseData = typeof lambdaData.body === 'string' 
        ? JSON.parse(lambdaData.body) 
        : lambdaData.body;
    }

    // Transform Lambda response to NoiseMatch format
    matches = transformLambdaResponseToMatches(responseData, body, startTimestamp, endTimestamp);
    endpointUsed = endpointUsed || 'get_house_without_label';

    return NextResponse.json(
      { 
        matches,
        message: matches.length > 0 
          ? `Found ${matches.length} matching noise record(s)${endpointUsed ? ` (via ${endpointUsed})` : ''}` 
          : 'No matching noise records found in the specified time range'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error searching for matches:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to search for noise matches: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search for noise matches' },
      { status: 500 }
    );
  }
}
