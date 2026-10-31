import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredProblem } from '@/lib/ai/structured-problem-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.cluster || !Array.isArray(body.reports)) {
      return NextResponse.json(
        {
          error: 'Invalid request: "cluster" object and "reports" array are required.',
        },
        { status: 400 }
      );
    }

    const result = await generateStructuredProblem(body.cluster, body.reports);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Structured problem aggregation failed.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
