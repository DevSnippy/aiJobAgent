import { NextResponse } from "next/server"

export async function POST() {
  try {
    const coverLetter = `March 28, 2025

TechCorp, Inc.
123 Innovation Way
San Francisco, CA 94105

Dear Hiring Manager,

I am writing to express my interest in the Senior Frontend Developer position at TechCorp, as advertised on your careers page. With over 5 years of experience building responsive and intuitive web applications using React and TypeScript, I am confident in my ability to contribute to your team's success.

Throughout my career, I have focused on creating exceptional user experiences through clean, efficient code and thoughtful UI design. At my current role with WebSolutions, I led the development of a complex dashboard application that reduced load times by 40% and improved user engagement metrics by 25%. I have extensive experience collaborating with designers, backend developers, and product managers to deliver high-quality products that meet both user needs and business objectives.

My technical expertise includes deep knowledge of React, TypeScript, and modern JavaScript practices. I am passionate about writing maintainable code, implementing responsive designs, and ensuring cross-browser compatibility. While I have primarily used Context API for state management, I am eager to apply my knowledge to Redux and expand my skills with GraphQL in your environment.

I am particularly drawn to TechCorp's mission to simplify complex workflows through intuitive technology solutions. Your recent product launches demonstrate a commitment to innovation that aligns perfectly with my professional values. I would welcome the opportunity to bring my technical skills and collaborative approach to your team.

Thank you for considering my application. I look forward to discussing how my experience and skills can benefit TechCorp.

Sincerely,

John Smith`

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error("Error generating cover letter:", error)
    return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
  }
}

