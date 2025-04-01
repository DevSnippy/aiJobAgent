import { UserProfileEditor } from "@/components/user-profile-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-6 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground max-w-[700px]">
          Manage your professional information used for job applications
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <UserProfileEditor />
      </div>
    </main>
  )
}

