export * from './pdf-generator.client';

// This file used to contain the pdfMake client implementation, but the
// app now uses Puppeteer on the server and the client wrapper in
// `lib/pdf-generator.client.ts`. Keep this file as a compatibility
// re-export so older imports (`@/lib/pdf-generator`) still work.
