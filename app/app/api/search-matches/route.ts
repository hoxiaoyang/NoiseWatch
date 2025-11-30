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
 *     offendingBlock: string,
 *     offendingUnit: string,
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

// Parse house ID to extract block and unit
function parseHouseId(houseId: string): { block: string; unit: string } {
  const blockMatch = houseId.match(/block[_-]?(\d+)/i);
  const unitMatch = houseId.match(/unit[_-]?([\d-]+)/i);
  
  if (blockMatch && unitMatch) {
    return {
      block: blockMatch[1],
      unit: unitMatch[1],
    };
  }
  
  const houseMatch = houseId.match(/house[_-]?(\d+)/i);
  if (houseMatch) {
    return {
      block: houseMatch[1],
      unit: 'Unknown',
    };
  }
  
  return {
    block: houseId,
    unit: 'Unknown',
  };
}

// Transform Lambda response to NoiseMatch format
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
    for (const [houseId, noiseEvents] of Object.entries(responseData.houses)) {
      const { block, unit } = parseHouseId(houseId as string);
      
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
          id: `${houseId}_${event.timestamp}`,
          offendingBlock: block,
          offendingUnit: unit,
          timestamp: unixToIsoTimestamp(event.timestamp),
          confidenceScore: Math.min(100, Math.max(50, confidenceScore)),
          description: `Noise class ${event.noiseClass} detected: ${body.description || 'Noise disturbance recorded by monitoring system'}`,
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

    // Check if mock mode is enabled (for testing)
    const useMockData = process.env.USE_MOCK_DATA === 'true' || !process.env.LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT;
    
    if (useMockData) {
      console.log('Using mock data for testing');
      // Simulate Lambda response format with statusCode and body wrapper
      const mockLambdaResponse = {
        statusCode: 200,
        body: JSON.stringify({
          noiseClass: 2,
          startTimestamp: Math.floor(new Date(body.startTime).getTime() / 1000),
          endTimestamp: Math.floor(new Date(body.endTime).getTime() / 1000),
          houses: {
            "house_124": [
              {
                house: "house_124",
                timestamp: Math.floor(new Date(body.startTime).getTime() / 1000) + 3600, // 1 hour after start
                noiseClass: 2
              }
            ],
            "house_123": [
              {
                house: "house_123",
                timestamp: Math.floor(new Date(body.startTime).getTime() / 1000) + 7200, // 2 hours after start
                noiseClass: 2
              }
            ],
            "house_125": [
              {
                house: "house_125",
                timestamp: Math.floor(new Date(body.startTime).getTime() / 1000) + 5400, // 1.5 hours after start
                noiseClass: 2
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
      const matches = transformLambdaResponseToMatches(responseData, body);
      
      return NextResponse.json(
        { 
          matches,
          message: matches.length > 0 
            ? `Found ${matches.length} matching noise record(s) (MOCK DATA)` 
            : 'No matching noise records found in the specified time range'
        },
        { status: 200 }
      );
    }

    // Get Lambda endpoint from environment variable
    const lambdaEndpoint = process.env.LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT;
    
    if (!lambdaEndpoint) {
      console.error('LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT is not configured');
      return NextResponse.json(
        { error: 'Lambda endpoint not configured' },
        { status: 500 }
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
    const matches = transformLambdaResponseToMatches(responseData, body, startTimestamp, endTimestamp);

    return NextResponse.json(
      { 
        matches,
        message: matches.length > 0 
          ? `Found ${matches.length} matching noise record(s)` 
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
