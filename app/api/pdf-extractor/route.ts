import { NextRequest, NextResponse } from 'next/server';

// Get ConvertAPI key from environment variables
const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    try {
      // Check if API key is available
      if (!CONVERT_API_SECRET) {
        throw new Error('ConvertAPI secret key not configured');
      }

      // Convert file to base64
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBase64 = Buffer.from(fileArrayBuffer).toString('base64');

      // Prepare the request to ConvertAPI
      const convertApiPayload = {
        Parameters: [
          {
            Name: "File",
            FileValue: {
              Name: file.name,
              Data: fileBase64
            }
          },
          {
            Name: "StoreFile",
            Value: true
          }
        ]
      };

      // Call the ConvertAPI service
      const response = await fetch('https://v2.convertapi.com/convert/pdf/to/txt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer secret_${CONVERT_API_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(convertApiPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ConvertAPI error:', errorData);
        throw new Error('Failed to extract text from PDF');
      }

      const data = await response.json();
      
      // Get the converted text file URL
      const textFileUrl = data.Files && data.Files[0] && data.Files[0].Url;
      
      if (!textFileUrl) {
        throw new Error('No text file URL in the response');
      }
      
      // Fetch the text content
      const textFileResponse = await fetch(textFileUrl);
      if (!textFileResponse.ok) {
        throw new Error('Failed to fetch text file');
      }
      
      const textContent = await textFileResponse.text();

      return NextResponse.json({
        text: textContent,
        pages: data.Files[0].PageCount || 1,
      });
    } catch (error) {
      console.error('ConvertAPI error:', error);
      
      // If ConvertAPI fails, return fallback response
      return NextResponse.json({
        text: `Unable to extract text from ${file.name}. Please try again or manually enter the text.`,
        pages: 1,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 