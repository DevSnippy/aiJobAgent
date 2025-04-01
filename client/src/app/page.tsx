"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  User,
  Briefcase,
  Key,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ApiKeySetup } from "@/components/api-key-setup";
import { ResumeUploader } from "@/components/resume-uploader";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Fetch the API key from the settings endpoint.
        const response = await fetch("http://localhost:8000/api/settings");
        const data = await response.json();
        // If data.api_key exists (and is non-empty), mark as configured.
        setApiKeyConfigured(!!data.api_key);
      } catch (error) {
        console.error("Failed to check API key status:", error);
        setApiKeyConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    checkApiKey();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4 md:px-6 flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col items-center space-y-6 text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">AI Job Assistant</h1>
        <p className="text-muted-foreground max-w-[700px]">
          Analyze job postings, generate tailored cover letters, and manage your
          professional profile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* API Key Setup Card */}
        <Card
          className={`border-2 ${apiKeyConfigured ? "border-green-200" : "border-dashed"}`}
        >
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Key className="mr-2 h-5 w-5" />
              API Key Setup
            </CardTitle>
            <CardDescription>
              {apiKeyConfigured
                ? "Your OpenAI API key is configured"
                : "Configure your OpenAI API key to use the application"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {apiKeyConfigured ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-medium mb-4">
                  API Key is configured and working
                </p>
                <Button variant="outline" asChild>
                  <Link href="/settings">Update API Key</Link>
                </Button>
              </div>
            ) : (
              <ApiKeySetup onSuccess={() => setApiKeyConfigured(true)} />
            )}
          </CardContent>
        </Card>

        {/* Resume Upload Card - Only enabled if API key is configured */}
        <Card
          className={`border-2 border-dashed ${!apiKeyConfigured ? "opacity-50" : ""}`}
        >
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Upload className="mr-2 h-5 w-5" />
              Resume Upload
            </CardTitle>
            <CardDescription>
              Upload your resume to begin your job application journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {!apiKeyConfigured ? (
              <Alert>
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Please configure your API key first
                </AlertDescription>
              </Alert>
            ) : (
              <ResumeUploader />
            )}
          </CardContent>
        </Card>

        {/* Profile and Job Tools Cards - Only enabled if API key is configured */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <Card className={!apiKeyConfigured ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Manage your professional information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Keep your profile up-to-date to generate accurate cover letters
                and job matches.
              </p>
              <Button
                className="w-full"
                variant="outline"
                asChild
                disabled={!apiKeyConfigured}
              >
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Job Tools Card */}
          <Card className={!apiKeyConfigured ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Job Tools
              </CardTitle>
              <CardDescription>
                Analyze job postings and generate cover letters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Analyze how well you match job requirements and create tailored
                cover letters.
              </p>
              <Button
                className="w-full"
                variant="outline"
                asChild
                disabled={!apiKeyConfigured}
              >
                <Link href="/job-tools">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
