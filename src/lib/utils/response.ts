import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api.types';

export function successResponse<T>(data: T, message = 'Operation completed successfully', status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}
