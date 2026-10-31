import { NextRequest, NextResponse } from 'next/server';
import { recommendProblemsForUser } from '@/lib/ai/discovery-chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.profile || !Array.isArray(body.availableProblems)) {
      return NextResponse.json(
        {
          error: 'Invalid request: "profile" object and "availableProblems" array are required.',
        },
        { status: 400 }
      );
    }

    const result = await recommendProblemsForUser(body.profile, body.availableProblems);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Problem recommendation failed.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

