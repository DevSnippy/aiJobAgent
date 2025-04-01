import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { api_key } = await request.json()

    if (!api_key) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // In a real implementation, this would verify the API key with OpenAI
    // For now, we'll simulate verification

    // Simulate API key verification
    const isValid = await verifyApiKey(api_key)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Error verifying API key:", error)
    return NextResponse.json({ error: "Failed to verify API key" }, { status: 500 })
  }
}

// Mock function to verify API key
async function verifyApiKey(apiKey: string) {
  // In a real implementation, this would make a test request to OpenAI
  // For now, we'll just check if it starts with "sk-" and has a reasonable length

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return apiKey.startsWith("sk-") && apiKey.length > 20
}

