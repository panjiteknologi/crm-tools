import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, fileName, fileUrl, uploadedBy } = body;

    // Simpan ke Convex
    const kpiId = await fetchMutation(api.kpiPerformance.create, {
      year,
      fileName,
      fileUrl,
      uploadedBy,
    });

    return NextResponse.json({ success: true, id: kpiId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload KPI" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    let kpis;
    if (year) {
      kpis = await fetchQuery(api.kpiPerformance.getByYear, { year });
    } else {
      kpis = await fetchQuery(api.kpiPerformance.list, {});
    }

    return NextResponse.json({ success: true, data: kpis });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}
