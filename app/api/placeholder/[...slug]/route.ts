import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const dimensions = pathname.split('/').pop(); // Get "400x300" part

  let width = 400;
  let height = 300;

  if (dimensions) {
    const [w, h] = dimensions.split('-'); // Split "400-300"
    width = parseInt(w) || 400;
    height = parseInt(h) || 300;
  }

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        Visit Photo ${width}x${height}
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  });
}