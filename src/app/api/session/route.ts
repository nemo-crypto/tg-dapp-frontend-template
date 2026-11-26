import { NextRequest, NextResponse } from "next/server"
import fetcher from "@/utils/fetch/server/fetcher"

import { validateServiceRequest } from "@/utils/fetch/server/request"

export async function POST(req: NextRequest) {
  let input: unknown
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ err: "RequestInvalid" }, { status: 400 })
  }
  const r = validateServiceRequest(input)
  if (!r) {
    return NextResponse.json({ err: "RequestInvalid" }, { status: 400 })
  }

  const response = await fetcher.request(
    r.method,
    r.path,
    r.data,
    r.token,
  )
  if (response.json) {
    return NextResponse.json(response.json, { status: response.status })
  }

  return new NextResponse(response.body, { status: response.status })
}
