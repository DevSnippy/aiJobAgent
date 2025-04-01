"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Percent,
  CheckCircle,
  XCircle,
  MessageSquare,
  BookOpen,
  Info,
  Briefcase,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  className?: string;
}

// Component for the funny loading messages
function AnalyzingMessages() {
  const messages = [
    "Scanning job description for hidden requirements...",
    "Comparing your skills to what they actually need...",
    "Calculating your chances of getting an interview...",
    "Translating corporate jargon into plain English...",
    "Detecting unrealistic expectations...",
    "Measuring the coffee-to-code ratio requirements...",
    "Analyzing whether 'competitive salary' actually means competitive...",
    "Checking if 'fast-paced environment' means 'constantly on fire'...",
    "Determining if 'self-starter' means 'no training provided'...",
    "Evaluating if 'flexible hours' means 'available 24/7'...",
    "Decoding what 'other duties as assigned' really means...",
    "Checking if 'ninja/rockstar/guru' is in the job title...",
    "Measuring buzzword density in the job description...",
    "Calculating years of experience required for technologies that don't exist yet...",
    "Determining if 'work hard, play hard' means 'no work-life balance'...",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="min-h-[60px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center text-muted-foreground italic"
        >
          {messages[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function JobAnalyzer() {
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    if (!url) {
      setError("Please enter a job posting URL");
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(false);
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:8000/api/analyze-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job posting");
      }

      const data = await response.json();
      setAnalysis(data.analysis);

      // Small delay before showing results to ensure animation looks good
      setTimeout(() => {
        setShowResults(true);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const extractContent = (tag: string, content: string): string => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i");
    const match = content?.match(regex);
    return match ? match[1].trim() : "";
  };

  const sections: AnalysisSection[] = analysis
    ? [
        {
          title: "Job Description",
          content: extractContent("JobDescription", analysis),
          icon: <Briefcase className="h-5 w-5" />,
          className:
            "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900",
        },
        {
          title: "Match Percentage",
          content: extractContent("FitPercentile", analysis),
          icon: <Percent className="h-5 w-5" />,
          className:
            "border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-900",
        },
        {
          title: "Matching Skills",
          content: extractContent("MatchingSkills", analysis),
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          className:
            "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900",
        },
        {
          title: "Missing Skills",
          content: extractContent("MissingSkills", analysis),
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          className:
            "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900",
        },
        {
          title: "Interview Tips",
          content: extractContent("InterviewTips", analysis),
          icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
          className:
            "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900",
        },
        {
          title: "Areas to Improve",
          content: extractContent("ImprovementAdvice", analysis),
          icon: <BookOpen className="h-5 w-5 text-amber-500" />,
          className:
            "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900",
        },
        {
          title: "Essential Knowledge",
          content: extractContent("EssentialKnowledge", analysis),
          icon: <Info className="h-5 w-5 text-cyan-500" />,
          className:
            "border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-900",
        },
        {
          title: "Job Requirements",
          content: extractContent("JobRequirements", analysis),
          icon: <Briefcase className="h-5 w-5 text-slate-500" />,
          className:
            "border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-900",
        },
      ]
    : [];

  const renderContent = (content: string) => {
    if (!content) return null;

    return content.split("\n").map((line, index) => {
      // Check if it's a list item
      if (line.trim().startsWith("-")) {
        return (
          <li key={index} className="ml-6 list-disc">
            {line.trim().substring(1).trim()}
          </li>
        );
      }
      // Regular paragraph
      return line.trim() ? (
        <p key={index} className="mb-2">
          {line.trim()}
        </p>
      ) : null;
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Job Posting Analysis</h2>
        <p className="text-muted-foreground">
          Enter a job posting URL to analyze how well your profile matches the
          requirements
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter job posting URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <AnalyzingMessages />
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {analysis && showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              staggerChildren: 0.1,
            }}
            className="space-y-6 mt-6"
          >
            {/* Match percentage badge at the top */}
            {extractContent("FitPercentile", analysis).includes("85%") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-lg font-semibold bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-800"
                >
                  <Percent className="h-5 w-5 mr-2" />
                  85% Match
                </Badge>
              </motion.div>
            )}

            {/* Render each section */}
            {sections.map((section, index) =>
              section.content ? (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1, // Stagger the animations
                  }}
                >
                  <Card
                    className={`overflow-hidden border-l-4 ${section.className}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        {section.icon}
                        <h3 className="text-lg font-semibold">
                          {section.title}
                        </h3>
                      </div>
                      <div className="prose max-w-none dark:prose-invert">
                        {renderContent(section.content)}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null,
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
