import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Star, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ResultsDisplayProps {
  results: any;
  onReset: () => void;
}

const ResultsDisplay = ({ results, onReset }: ResultsDisplayProps) => {
  const {
    initial_resume_quality_rating,
    strategic_assessment,
    optimized_resume,
    final_quality_scores,
  } = results;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={onReset}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Submit Another Resume
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Resume Optimized Successfully!</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Your Enhanced Resume</h1>
          <p className="text-muted-foreground">
            Here's your professionally optimized resume tailored for {initial_resume_quality_rating?.target_role_and_experience_level}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Initial Score</h3>
                <p className="text-2xl font-bold text-primary">
                  {initial_resume_quality_rating?.current_resume_score}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {initial_resume_quality_rating?.brief_rationale}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Optimized Score</h3>
                <p className="text-2xl font-bold text-secondary">
                  {final_quality_scores?.optimized_resume_score}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ATS Compatibility</span>
                <span className="font-semibold">{final_quality_scores?.ats_compatibility_score}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Strategic Assessment</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Key Opportunity Areas</h3>
              <div className="flex flex-wrap gap-2">
                {strategic_assessment?.key_opportunity_areas?.map((area: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Position Alignment Analysis</h3>
              <p className="text-muted-foreground">
                {strategic_assessment?.position_alignment_analysis}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Optimization Strategy</h3>
              <p className="text-muted-foreground">
                {strategic_assessment?.optimization_strategy_applied}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Key Improvements</h3>
            <ul className="space-y-2">
              {final_quality_scores?.key_improvements?.map((improvement: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Optimized Resume</h2>
            <Button
              onClick={() => {
                const blob = new Blob([optimized_resume?.content], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "optimized-resume.md";
                a.click();
              }}
            >
              Download Resume
            </Button>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-foreground">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                a: ({ href, children }) => (
                  <a href={href} className="text-secondary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {optimized_resume?.content}
            </ReactMarkdown>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDisplay;
