/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/convert/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);


export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure temp directories exist
async function ensureTempDirs() {
  const dirs = ['/tmp/omr-uploads', '/tmp/omr-output'];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Clean up temporary files
async function cleanupFiles(files: string[]) {
  for (const file of files) {
    try {
      if (existsSync(file)) {
        await unlink(file);
      }
    } catch (err) {
      console.error(`Failed to delete ${file}:`, err);
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const sessionId = uuidv4();
  
  let uploadPath = '';
  let outputDir = '';
  
  try {
    // Ensure directories exist
    await ensureTempDirs();
    
    // Parse the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, and PDF are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExt = path.extname(file.name);
    uploadPath = `/tmp/omr-uploads/${sessionId}${fileExt}`;
    outputDir = `/tmp/omr-output/${sessionId}`;
    
    await writeFile(uploadPath, buffer);
    await mkdir(outputDir, { recursive: true });

    console.log(`Processing file: ${uploadPath}`);

    // Execute Audiveris command
    const audiverisCmd = `/opt/audiveris/bin/Audiveris -batch -export "${uploadPath}" -output "${outputDir}"`;
    
    try {
      const { stdout, stderr } = await execAsync(audiverisCmd, {
        timeout: 120000, // 2 minute timeout
      });
      
      console.log('Audiveris stdout:', stdout);
      if (stderr) console.error('Audiveris stderr:', stderr);
    } catch (execError: any) {
      console.error('Audiveris execution error:', execError);
      
      // Check for common Audiveris errors
      if (execError.message.includes('interline')) {
        return NextResponse.json(
          { 
            error: 'Image resolution too low. Please upload an image with at least 300 DPI.',
            details: execError.message 
          },
          { status: 422 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Audiveris processing failed. Ensure the image contains valid sheet music.',
          details: execError.message 
        },
        { status: 500 }
      );
    }

    // Find the generated MusicXML file
    const { readdir } = await import('fs/promises');
    const outputFiles = await readdir(outputDir, { recursive: true });
    
    // Look for .mxl or .xml files
    const musicxmlFile = outputFiles.find(f => 
      f.toString().endsWith('.mxl') || f.toString().endsWith('.xml')
    );

    if (!musicxmlFile) {
      return NextResponse.json(
        { 
          error: 'No MusicXML file generated. The image may not contain valid sheet music.',
          availableFiles: outputFiles 
        },
        { status: 422 }
      );
    }

    // Read the MusicXML content
    const musicxmlPath = path.join(outputDir, musicxmlFile.toString());
    let musicxmlContent: string;

    if (musicxmlFile.toString().endsWith('.mxl')) {
      const zip = new AdmZip(musicxmlPath);
      const zipEntries = zip.getEntries();
      
      // Find the main .xml file inside
      const xmlEntry = zipEntries.find((entry: any) => 
        entry.entryName.endsWith('.xml') && !entry.entryName.includes('META-INF')
      );
      
      if (!xmlEntry) {
        return NextResponse.json(
          { error: 'Failed to extract MusicXML from .mxl file' },
          { status: 500 }
        );
      }
      
      musicxmlContent = zip.readAsText(xmlEntry);
    } else {
      // Plain .xml file
      musicxmlContent = await readFile(musicxmlPath, 'utf-8');
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Clean up temporary files
    await cleanupFiles([uploadPath]);
    // Note: Keep output dir for a bit in case of issues, or clean up here

    return NextResponse.json({
      success: true,
      musicxml: musicxmlContent,
      filename: musicxmlFile.toString(),
      processingTime: processingTime,
      originalFile: file.name,
    });

  } catch (error: any) {
    console.error('Server error:', error);
    
    // Clean up on error
    if (uploadPath) await cleanupFiles([uploadPath]);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}