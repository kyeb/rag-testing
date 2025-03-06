import { NextResponse } from 'next/server';
import { editText } from '@/lib/grpc-client';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const transformedText = await editText(text);
    return NextResponse.json({ transformedText });
  } catch {
    return NextResponse.json({ error: 'Failed to transform text' }, { status: 500 });
  }
}
