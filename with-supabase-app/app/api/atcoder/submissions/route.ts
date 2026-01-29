import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user");
  const fromSecond = searchParams.get("from_second");

  if (!userId) {
    return NextResponse.json(
      { error: "user parameter is required" },
      { status: 400 }
    );
  }

  if (!fromSecond) {
    return NextResponse.json(
      { error: "from_second parameter is required" },
      { status: 400 }
    );
  }

  try {
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(userId)}&from_second=${encodeURIComponent(fromSecond)}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1시간마다 재검증
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch submissions: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
