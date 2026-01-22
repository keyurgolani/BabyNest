import { NextRequest, NextResponse } from "next/server";

// Extended timeout for vision model processing (10 minutes)
export const maxDuration = 600;

const API_BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const babyId = request.nextUrl.searchParams.get("babyId");

    if (!babyId) {
      return NextResponse.json(
        { error: "babyId is required" },
        { status: 400 }
      );
    }

    // Forward authorization header
    const authHeader = request.headers.get("authorization");
    const headers: HeadersInit = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Forward the request to the backend API with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

    const response = await fetch(
      `${API_BACKEND_URL}/api/v1/babies/${babyId}/photo-import/analyze`,
      {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out after 10 minutes" },
        { status: 504 }
      );
    }
    console.error("Photo import analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 }
    );
  }
}
