import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET (' + process.env.NEXTAUTH_SECRET.substring(0, 10) + '...)' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
    database: 'not tested',
  };

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    diagnostics.database = 'OK - connected';
  } catch (error) {
    diagnostics.database = 'ERROR: ' + error.message;
  }

  return NextResponse.json(diagnostics);
}
