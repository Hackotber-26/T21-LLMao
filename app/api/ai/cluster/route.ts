import { NextRequest, NextResponse } from 'next/server';
import { findRelatedProblems } from '@/lib/ai/problem-clustering';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.newReport || typeof body.newReport.description !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request: "newReport" object with "description" is required.',
        },
        { status: 400 }
      );
    }

    const candidateClusters = Array.isArray(body.candidateClusters) ? body.candidateClusters : [];

    const result = await findRelatedProblems(body.newReport, candidateClusters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Problem clustering failed.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

