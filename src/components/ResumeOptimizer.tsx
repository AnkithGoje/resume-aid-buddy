import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ResultsDisplay from "./ResultsDisplay";

const ResumeOptimizer = () => {
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setResumeFile(file);
      toast.success("Resume uploaded successfully");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetRole || !resumeFile) {
      toast.error("Please fill in target role and upload your resume");
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("targetRole", targetRole);
      if (jobDescription) formData.append("jobDescription", jobDescription);
      if (experienceLevel) formData.append("experienceLevel", experienceLevel);
      formData.append("resume", resumeFile);

      const response = await fetch(
        "https://n8n.n8n-flm.in/webhook/bcf28816-9172-4992-b15a-66383cffdf51",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process resume");
      }

      const data = await response.json();
      setResults(data[0]?.output || data);
      toast.success("Resume optimized successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to optimize resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (results) {
    return <ResultsDisplay results={results} onReset={() => setResults(null)} />;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-secondary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Trusted by 40,000+ students</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Land Your Dream Job with a{" "}
            <span className="text-secondary">Winning Resume</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get your resume professionally reviewed and improved by experts. Tailored to your target role, optimized for ATS, and designed to impress recruiters.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-medium">Expert Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-medium">ATS Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-medium">Role-Specific</span>
            </div>
          </div>
        </div>

        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  1
                </div>
                <div className="flex-1">
                  <Label htmlFor="targetRole" className="text-lg font-semibold mb-2 block">
                    Tell us about your target role
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    What position are you applying for?
                  </p>
                  <Input
                    id="targetRole"
                    placeholder="e.g., Software Developer, Data Analyst, Marketing Head"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  2
                </div>
                <div className="flex-1">
                  <Label htmlFor="jobDescription" className="text-lg font-semibold mb-2 block">
                    Share the job description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Paste the full job description so we can tailor your resume perfectly.
                  </p>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full min-h-[150px] resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  3
                </div>
                <div className="flex-1">
                  <Label htmlFor="experienceLevel" className="text-lg font-semibold mb-2 block">
                    Your experience level <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    This helps us customize the format and content for your career stage.
                  </p>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger id="experienceLevel">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5-10 years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  4
                </div>
                <div className="flex-1">
                  <Label htmlFor="resumeFile" className="text-lg font-semibold mb-2 block">
                    Upload your current resume
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your resume (PDF or DOC/DOCX, max 10MB)
                  </p>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="resumeFile"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="resumeFile" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      {resumeFile ? (
                        <div>
                          <p className="font-medium text-foreground">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click to upload a different file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-foreground">
                            Drop your resume here, or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            PDF or DOC/DOCX – Maximum 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Processing Your Resume...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Get a winning edge before you click submit and align your resume to land your dream job
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResumeOptimizer;
