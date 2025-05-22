import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'travelee', 
  api_key: process.env.CLOUDINARY_API_KEY || '884793152861746', 
  api_secret: process.env.CLOUDINARY_API_SECRET || '-UjW9F9RS7Syyz6crou5_otGggg' 
});

export async function POST(request: NextRequest) {
  try {

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Only teachers can upload PDFs' },
        { status: 403 }
      );
    }

    // Get the PDF file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type || !file.type.includes('pdf')) {
      return NextResponse.json(
        { message: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const fileHash = crypto.randomBytes(8).toString('hex');
    const fileName = `${fileHash}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    try {
      console.log('Starting Cloudinary upload process...');
      
      // Convert the file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const dataURI = `data:${file.type};base64,${base64Data}`;
      
      console.log(`File prepared for upload: ${fileName}, size: ${Math.round(arrayBuffer.byteLength / 1024)} KB`);
      
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        public_id: `quiz-pdfs/${fileHash}`,
        format: 'pdf'
      });
      
      console.log('Cloudinary upload successful:', uploadResult.secure_url);
      
      return NextResponse.json({
        message: 'File uploaded successfully',
        url: uploadResult.secure_url,
        fileId: fileHash,
        name: file.name
      });
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      // Log more detailed error information
      if (error.error) {
        console.error('Cloudinary error details:', error.error);
      }
      
      return NextResponse.json(
        { 
          message: 'Error uploading file to cloud storage',
          error: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        message: 'Error uploading file',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 