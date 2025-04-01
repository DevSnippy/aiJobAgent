import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would check if the API key exists and is valid
    // For now, we'll simulate checking the API key

    // Simulate fetching settings
    const settings = await getSettings()

    return NextResponse.json({
      configured: Boolean(settings.api_key && settings.api_key !== "your_default_api_key"),
    })
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json({ configured: false, error: "Failed to check API key" }, { status: 500 })
  }
}

// Mock function to get settings
async function getSettings() {
  // In a real implementation, this would fetch from your backend or local storage
  // For now, we'll return mock data

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    api_key: process.env.OPENAI_API_KEY || "your_default_api_key",
  }
}

