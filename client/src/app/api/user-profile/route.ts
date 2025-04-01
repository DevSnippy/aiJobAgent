import { NextResponse } from "next/server"

// Mock data - in a real implementation, this would be stored in a database
// or retrieved from your Python backend
const mockUserProfile = {
  first_name: "John",
  middle_name: "",
  last_name: "Smith",
  phone: "(555) 123-4567",
  email: "john.smith@example.com",
  country: "United States",
  city: "San Francisco",
  address: "123 Tech Street",
  zip_code: "94105",
  linkedin: "linkedin.com/in/johnsmith",
  personal_site: "johnsmith.dev",
  github: "github.com/johnsmith",
  skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Responsive Design", "UI/UX Implementation"],
  languages: ["English", "Spanish"],
  years_of_experience: "5",
  summary:
    "Frontend developer with 5+ years of experience building responsive web applications using React and TypeScript. Passionate about creating intuitive user interfaces and optimizing web performance.",
  personal_note: "I enjoy contributing to open source projects and attending tech meetups in my free time.",
}

export async function GET() {
  try {
    // In a real implementation, this would fetch from your Python backend
    // For now, we'll return mock data

    // Simulate a delay to mimic API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(mockUserProfile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const profile = await request.json()

    // In a real implementation, this would update your Python backend
    // For now, we'll just simulate a successful update

    // Simulate a delay to mimic API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}

