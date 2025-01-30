import { NextResponse } from "next/server";
import { editText } from "@/lib/grpc-client";

export async function POST(request: Request) {
  try {
    console.log("Received POST request to /api/transform");
    const { text } = await request.json();
    console.log("Request body:", { text });

    const transformedText = await editText(text);
    console.log("Successfully transformed text:", transformedText);

    return NextResponse.json({ transformedText });
  } catch (error) {
    console.error("Error transforming text:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to transform text" },
      { status: 500 }
    );
  }
}
