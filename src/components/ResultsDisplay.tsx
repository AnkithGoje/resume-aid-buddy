import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Star, TrendingUp, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { generateFaangResume } from "@/utils/pdfGenerator";

interface ResultsDisplayProps {
  results: any;
  onReset: () => void;
  originalFileName?: string;
}

const ResultsDisplay = ({ results, onReset, originalFileName }: ResultsDisplayProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    initial_resume_quality_rating,
    strategic_assessment,
    optimized_resume,
    final_quality_scores,
  } = results;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const resumeContent = typeof optimized_resume === 'string' ? optimized_resume : optimized_resume?.content || '';
      generateFaangResume(resumeContent, originalFileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Preprocess content to match PDF filtering and formatting
  const preprocessResumeContent = (content: string) => {
    if (!content) return "";

    // Header keywords from pdfGenerator.ts
    const SECTION_HEADERS = [
      'EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE',
      'SUMMARY', 'PROFILE SUMMARY', 'PROFESSIONAL SUMMARY', 'PROJECTS', 'SKILLS',
      'TECHNICAL SKILLS', 'EDUCATION', 'CERTIFICATIONS',
      'ACHIEVEMENTS'
    ];

    const lines = content.split('\n');
    let processedLines: string[] = [];
    let hasProcessedName = false;
    let isSkippingSection = false;
    let hasSeenFirstSection = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) {
        processedLines.push("");
        continue;
      }

      // Headers to inline bold
      const INLINE_HEADERS_TO_BOLD = [
        "Programming Languages:",
        "Frameworks and Libraries:",
        "Machine Learning & AI Techniques:",
        "Soft Skills:"
      ];

      // Apply inline bolding for specific headers
      INLINE_HEADERS_TO_BOLD.forEach(header => {
        // Case insensitive check
        const regex = new RegExp(`(${header})`, 'gi');
        // Only replace if not already bolded
        if (line.match(regex) && !line.includes(`**${header}`)) {
          line = line.replace(regex, '**$1**');
        }
      });

      // Skip Contact Info Label
      if (/^Contact Information[:]*$/i.test(line)) continue;

      // Skip Languages Section (as per PDF logic)
      if (line.replace(/\*/g, '').toUpperCase().trim() === 'LANGUAGES') {
        isSkippingSection = true;
        continue;
      }

      // Detect new section to stop skipping
      // Check for Markdown Header OR Exact Uppercase Keyword
      // Detect new section to stop skipping
      // Check for Markdown Header OR Exact Uppercase Keyword
      // Robust cleaning: remove * (bold), : (colon), and # (markdown header), then collapse spaces and trim
      const cleanLine = line.replace(/[*:#]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

      const isHeader = line.startsWith('## ') || SECTION_HEADERS.includes(cleanLine);

      if (isHeader) {
        isSkippingSection = false;
        hasSeenFirstSection = true;

        let headerText = cleanLine;

        // Normalize Summary headers
        if (['PROFESSIONAL SUMMARY', 'PROFILE SUMMARY'].includes(headerText)) {
          headerText = 'SUMMARY';
        }

        processedLines.push(`## ${headerText}`);
        continue;
      }

      if (isSkippingSection) continue;

      // Simplify LinkedIn/Contact lines
      const isContactLine = line.length < 200 && (line.includes('@') || line.toLowerCase().includes('linkedin.com') || line.toLowerCase().includes('github.com'));
      if (isContactLine) {
        let processed = line.replace(/^LinkedIn[:]*\s*/i, '');
        processed = processed
          .replace(/[•●▪]/g, '|')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/\s*\|\s*/g, ' | ');
        processedLines.push(processed);
        continue;
      }

      // Name (First non-empty line)
      if (!hasProcessedName) {
        hasProcessedName = true;
        let nameText = line.replace(/^#\s*/, '').replace(/\*\*/g, '');
        processedLines.push(`# ${nameText}`);
        continue;
      }

      // Job Title / Headline (Between Name and First Section, not contact)
      // Use H4 for centered headline
      if (hasProcessedName && !hasSeenFirstSection && !isContactLine) {
        processedLines.push(`#### ${line}`);
        continue;
      }

      // Check if line is a bullet but missing markdown space
      if (/^[-*•]/.test(line) && !/^[-*•]\s/.test(line)) {
        processedLines.push(line.replace(/^([-*•])/, '$1 '));
      } else {
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  };

  const resumeContent = typeof optimized_resume === 'string' ? optimized_resume : optimized_resume?.content || '';
  const processedContent = preprocessResumeContent(resumeContent);

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
              {Array.isArray(strategic_assessment?.optimization_strategy_applied) ? (
                <ul className="space-y-2">
                  {strategic_assessment.optimization_strategy_applied.map((strategy: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{strategy}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {strategic_assessment?.optimization_strategy_applied}
                </p>
              )}
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
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPdf ? "Generating..." : "Download PDF"}
            </Button>
          </div>

          <div
            className="prose prose-sm max-w-none bg-white text-black p-8 rounded-lg"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "#000",
                    textAlign: "center"
                  }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginTop: "16px",
                    marginBottom: "4px",
                    color: "#000",
                    borderBottom: "1px solid #000",
                    paddingBottom: "2px",
                    textTransform: "uppercase"
                  }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => {
                  const text = typeof children === 'string' ? children : '';
                  if (text.includes('|')) {
                    const [left, right] = text.split('|').map(s => s.trim());
                    return (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", marginBottom: "2px" }}>
                        <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#000", margin: 0 }}>{left}</h3>
                        <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#000", margin: 0 }}>{right}</h3>
                      </div>
                    );
                  }
                  return <h3 style={{ fontSize: "11px", fontWeight: "bold", marginTop: "10px", marginBottom: "2px", color: "#000" }}>{children}</h3>;
                },
                h4: ({ children }) => (
                  <h4 style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "6px",
                    color: "#000",
                    marginTop: "2px"
                  }}>
                    {children}
                  </h4>
                ),
                p: ({ children }) => {
                  // Clean text check
                  let text = "";
                  if (typeof children === 'string') text = children;
                  else if (Array.isArray(children)) {
                    text = children.map(c => typeof c === 'string' ? c : '').join('');
                  }

                  const isContactInfo = text.includes('@') || text.includes('|');
                  return (
                    <p style={{
                      marginBottom: "4px",
                      color: "#000",
                      lineHeight: "1.4",
                      fontSize: "10px",
                      textAlign: isContactInfo ? "center" : "left"
                    }}>
                      {children}
                    </p>
                  );
                },

                ul: ({ children }) => <ul style={{ listStyleType: "disc", paddingLeft: "16px", marginBottom: "8px" }}>{children}</ul>,
                li: ({ children }) => <li style={{ color: "#000", marginBottom: "2px", lineHeight: "1.4", fontSize: "10px" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ fontWeight: "bold", color: "#000" }}>{children}</strong>,
                a: ({ href, children }) => (
                  <a href={href} style={{ color: "#000", textDecoration: "none" }}>
                    {children}
                  </a>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </Card>
      </div >
    </div >
  );
};

export default ResultsDisplay;
