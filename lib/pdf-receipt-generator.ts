// PDF Receipt Generator using Puppeteer
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export interface PDFGenerationOptions {
  html: string;
  fileName: string;
}

/**
 * Generate a PDF from HTML content using Puppeteer
 * Supports Urdu fonts loaded from local TTF files
 */
export async function generatePDFFromHTML(
  options: PDFGenerationOptions
): Promise<Uint8Array> {
  const { html, fileName } = options;

  let browser = null;

  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set content with proper encoding
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF with A4 size
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
      },
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  }
}

/**
 * Generate PDF and save to filesystem
 */
export async function generateAndSavePDF(
  options: PDFGenerationOptions,
  outputPath: string
): Promise<string> {
  const pdfBuffer = await generatePDFFromHTML(options);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write PDF to file - pdfBuffer is already Uint8Array
  fs.writeFileSync(outputPath, pdfBuffer as any);
  
  return outputPath;
}

/**
 * Helper function to get font path
 */
export function getUrduFontPath(): string {
  return path.join(
    process.cwd(),
    'Noto_Nastaliq_Urdu',
    'NotoNastaliqUrdu-VariableFont_wght.ttf'
  );
}
