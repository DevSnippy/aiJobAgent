"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="w-full flex flex-col items-center justify-center">
        <div className="bg-muted rounded-full p-6 mb-6">
          <Upload className="h-12 w-12 text-primary" />
        </div>

        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />

        <Button
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mb-4"
        >
          <Upload className="mr-2 h-5 w-5" />
          Select Resume (PDF)
        </Button>

        {file && (
          <div className="flex items-center mt-4 p-3 bg-muted rounded-md w-full">
            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <Button
              variant="default"
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        )}

        {uploading && (
          <div className="w-full mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center mt-1 text-muted-foreground">
              {progress}% - Processing resume...
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4 w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 w-full">
          <AlertDescription className="text-green-600">
            Resume uploaded and processed successfully! You can now edit your
            profile and start using the job tools.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
