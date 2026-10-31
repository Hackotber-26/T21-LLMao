import { NextRequest, NextResponse } from 'next/server';
import { classifyProblem } from '@/lib/ai/problem-validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body.description !== 'string' || body.description.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid request: "description" string field is required.',
        },
        { status: 400 }
      );
    }

    const result = await classifyProblem({
      title: body.title,
      description: body.description.trim(),
      location: body.location,
      submittedCategory: body.submittedCategory || body.category,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Problem classification failed.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
