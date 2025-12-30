import jsPDF from "jspdf";

export const generateFaangResume = (content: string, originalFileName?: string) => {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // Standard 1-inch margins (approx 25.4mm, but 20 is safe)
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    const lineHeight = 5; // Base line height for body text

    const checkPageBreak = (heightBytes: number) => {
        if (yPosition + heightBytes > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }
    };

    // Helper to render text with inline bolding (**text**)
    // Handles wrapping and basic mixed styling
    const renderStyledText = (text: string, x: number, y: number, maxWidth: number, fontSize: number): number => {
        // Split by **
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        let currentX = x;
        let currentY = y;
        let currentLineHeight = 5;

        // Flatten parts into words to handle wrapping correctly
        interface StyledWord {
            text: string;
            isBold: boolean;
            width: number;
        }

        let allWords: StyledWord[] = [];

        parts.forEach(part => {
            const isBold = part.startsWith('**') && part.endsWith('**');
            const cleanContent = isBold ? part.slice(2, -2) : part;

            // Set font to measure correctly
            pdf.setFont("helvetica", isBold ? "bold" : "normal");
            pdf.setFontSize(fontSize);

            const words = cleanContent.split(/(\s+)/); // Split keep delimiters (spaces)

            words.forEach(word => {
                if (word === '') return;
                allWords.push({
                    text: word,
                    isBold: isBold,
                    width: pdf.getTextWidth(word)
                });
            });
        });

        // Reset font for drawing
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(fontSize);

        // Render loop
        for (let i = 0; i < allWords.length; i++) {
            const word = allWords[i];

            // Check wrap (except if spacing)
            if (currentX + word.width > x + maxWidth && word.text.trim() !== '') {
                currentY += currentLineHeight;
                currentX = x;

                // Check page break
                if (currentY > pageHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }
            }

            pdf.setFont("helvetica", word.isBold ? "bold" : "normal");
            pdf.text(word.text, currentX, currentY);
            currentX += word.width;
        }

        return currentY + 5; // Return next Y position
    };

    const lines = content.split('\n');

    let hasProcessedName = false;
    let isSkippingSection = false;
    let hasSeenFirstSection = false;

    // Headers to inline bold
    const INLINE_HEADERS_TO_BOLD = [
        "Programming Languages:",
        "Frameworks and Libraries:",
        "Machine Learning & AI Techniques:",
        "Soft Skills:"
    ];

    for (const line of lines) {
        let trimmedLine = line.trim();

        // Filter out "Contact Information" label lines
        if (/^Contact Information[:]*$/i.test(trimmedLine)) {
            continue;
        }

        // Strip "LinkedIn:" prefix if present
        trimmedLine = trimmedLine.replace(/^LinkedIn[:]*\s*/i, '');

        if (!trimmedLine) {
            yPosition += 2; // Small gap for empty lines
            continue;
        }

        console.log(`[PDF DEBUG] Line: '${trimmedLine}' | Len: ${trimmedLine.length} | HasSummary: ${trimmedLine.toUpperCase().includes('SUMMARY')} | IsShort: ${trimmedLine.length < 40}`);

        // Apply inline bolding for specific headers
        INLINE_HEADERS_TO_BOLD.forEach(header => {
            // Case insensitive check
            const regex = new RegExp(`(${header})`, 'gi');
            // Only replace if not already bolded
            if (trimmedLine.match(regex) && !trimmedLine.includes(`**${header}`)) {
                trimmedLine = trimmedLine.replace(regex, '**$1**');
            }
        });

        // --- H1: Name (Big, Bold, Centered) ---
        // Treat as Name if it starts with # OR if it's the very first non-empty line
        if (trimmedLine.startsWith('# ') || !hasProcessedName) {
            hasProcessedName = true;
            checkPageBreak(15);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            let text = trimmedLine.replace(/^#\s*/, '');
            // Remove any bold markdown from name if present
            text = text.replace(/\*\*/g, '');
            const textWidth = pdf.getTextWidth(text);
            const xPos = (pageWidth - textWidth) / 2;
            pdf.text(text, xPos, yPosition);
            yPosition += 6; // Reduced from 10 to 6
            continue; // Skip the rest of the loop for this line
        }

        // --- H2: Explicit Handling for Summary (Catch-all) ---
        // Catch "Professional Summary", "Career Summary", "Summary", "Objective" if they failed strict check
        // Check if line contains "SUMMARY" or "OBJECTIVE" and is short (< 40 chars)
        // Check if line contains "SUMMARY" or "OBJECTIVE" using alpha-only check
        else if (
            (trimmedLine.replace(/[^A-Za-z]/g, '').toUpperCase().includes('SUMMARY') ||
                trimmedLine.replace(/[^A-Za-z]/g, '').toUpperCase().includes('OBJECTIVE')) &&
            trimmedLine.length < 50 &&
            !trimmedLine.includes('|') // Ensure it's not contact info
        ) {
            console.log("Matched Fallback Summary Check for line: " + trimmedLine);
            let headerText = 'SUMMARY';

            // Check if it is "LANGUAGES" -> Remove it (just in case)
            if (trimmedLine.toUpperCase().includes('LANGUAGES')) {
                isSkippingSection = true;
                continue;
            }

            isSkippingSection = false;
            hasSeenFirstSection = true;

            checkPageBreak(15);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);

            pdf.text(headerText, margin, yPosition);

            yPosition += 2;
            pdf.setDrawColor(0, 0, 0); // Black line
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 6;
        }



        // --- H2: Section Headers (Uppercase, Bold, Border) ---
        // Matches "## Header" OR specific keywords like "EXPERIENCE", "SKILLS" etc.
        else if (
            trimmedLine.startsWith('## ') ||
            // Dictionary of all possible section headers (bolded & uppercase)
            // Aggressive cleaning: retain only letters and spaces, then collapse spaces and trim
            ['EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE', 'SUMMARY', 'PROFILE SUMMARY', 'PROFESSIONAL SUMMARY', 'OBJECTIVE', 'CAREER OBJECTIVE', 'PROJECTS', 'SKILLS', 'TECHNICAL SKILLS', 'EDUCATION', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'LANGUAGES'].includes(trimmedLine.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim())
        ) {
            // Clean the header text using the same logic to normalize it
            let headerText = trimmedLine.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();

            // Normalize Summary headers
            if (['PROFESSIONAL SUMMARY', 'PROFILE SUMMARY', 'OBJECTIVE', 'CAREER OBJECTIVE'].includes(headerText)) {
                headerText = 'SUMMARY';
            }

            // Check if it is "LANGUAGES" -> Remove it
            if (headerText === 'LANGUAGES') {
                isSkippingSection = true;
                continue;
            }

            // If we hit any other header, we are done skipping (unless we enter another skip section later, but usually not nested)
            isSkippingSection = false;
            hasSeenFirstSection = true;

            checkPageBreak(15);
            // yPosition += 0; // Removed extra spacing entirely
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);

            pdf.text(headerText, margin, yPosition);

            yPosition += 2;
            pdf.setDrawColor(0, 0, 0); // Black line
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 6;
        }

        // --- H3: Job Title / School (Bold) ---
        else if (trimmedLine.startsWith('### ')) {
            if (isSkippingSection) continue;
            checkPageBreak(8);
            yPosition += 2;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10.5);
            let text = trimmedLine.replace(/^###\s*/, '');

            // Check for right-aligned date (separated by |)
            if (text.includes('|')) {
                const parts = text.split('|');
                const leftText = parts[0].trim();
                const rightText = parts[1].trim();

                pdf.text(leftText, margin, yPosition);

                const rightWidth = pdf.getTextWidth(rightText);
                pdf.text(rightText, pageWidth - margin - rightWidth, yPosition);
            } else {
                pdf.text(text, margin, yPosition);
            }

            yPosition += 5;
        }

        // --- Bullets (Indented) ---
        else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
            if (isSkippingSection) continue;
            checkPageBreak(5);
            const bulletText = trimmedLine.replace(/^[-*•]\s*/, '');
            // Render bullet
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            pdf.text('•', margin, yPosition);

            // Render content styled
            yPosition = renderStyledText(bulletText, margin + 5, yPosition, contentWidth - 5, 9.5);
        }

        // --- Bold Lines (Dates, Locations, Company Names) ---
        else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            if (isSkippingSection) continue;
            checkPageBreak(6);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            const text = trimmedLine.replace(/\*\*/g, '');
            pdf.text(text, margin, yPosition);
            yPosition += 5;
        }

        // --- Regular Text (with likely contact info or inline bolding) ---
        else {
            if (isSkippingSection) continue;
            checkPageBreak(5);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            const cleanText = trimmedLine; // Don't strip stars early

            // Detect likely contact info line (contains email or linkedin/github url)
            if (cleanText.length < 200 && (cleanText.includes('@') || cleanText.toLowerCase().includes('linkedin.com') || cleanText.toLowerCase().includes('github.com'))) {
                // Sanitize common problematic connectors to simple pipes
                // Replace various dash/dot/bullet types with |
                const safeText = cleanText
                    .replace(/[•●▪]/g, '|')                 // Bullets to pipes
                    .replace(/[\u2013\u2014]/g, '-')        // Dashes to hyphen
                    .replace(/[^\x20-\x7E]+/g, ' ')         // Replace non-ASCII with space
                    .replace(/\s+/g, ' ')                   // Collapse multiple spaces
                    .replace(/\s*\|\s*/g, ' | ')            // Normalize pipes
                    .replace(/^\|\s*/, '')
                    .replace(/\s*\|\s*$/, '');

                // Split by pipe with spaces
                const parts = safeText.split('|');

                let currentX = margin;
                const spacing = 3; // mm space between parts

                // Calculate total width including spacing
                let totalWidth = 0;
                parts.forEach((part, index) => {
                    totalWidth += pdf.getTextWidth(part.trim());
                    if (index < parts.length - 1) totalWidth += pdf.getTextWidth(' | ') + spacing;
                });

                const centeredX = (pageWidth - totalWidth) / 2;
                if (centeredX > margin) {
                    currentX = centeredX;
                }

                parts.forEach((part, index) => {
                    const trimmedPart = part.trim();
                    const partWidth = pdf.getTextWidth(trimmedPart);

                    // Detect Email
                    const emailMatch = trimmedPart.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                    const urlMatch = trimmedPart.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|(linkedin\.com\/[^\s]+)|(github\.com\/[^\s]+)/);

                    if (emailMatch) {
                        pdf.textWithLink(trimmedPart, currentX, yPosition, { url: `mailto:${emailMatch[0].trim()}` });
                    } else if (urlMatch) {
                        let url = urlMatch[0].trim();
                        if (!url.startsWith('http')) url = 'https://' + url;
                        pdf.textWithLink(trimmedPart, currentX, yPosition, { url: url });
                    } else {
                        pdf.text(trimmedPart, currentX, yPosition);
                    }

                    currentX += partWidth;

                    // Add separator if not last
                    if (index < parts.length - 1) {
                        const separator = " | ";
                        const sepWidth = pdf.getTextWidth(separator);
                        pdf.text(separator, currentX, yPosition);
                        currentX += sepWidth;
                    }
                });
                yPosition += 5;
            }
            // HEADLINE / JOB TITLE CENTERED (If before first section)
            else if (hasProcessedName && !hasSeenFirstSection) {
                pdf.setFont("helvetica", "bold");
                // Bold or Normal? User said "move data analyst to center", bold looks better for headline
                pdf.setFontSize(11);

                const textWidth = pdf.getTextWidth(cleanText);
                const xPos = (pageWidth - textWidth) / 2;
                pdf.text(cleanText, xPos, yPosition);
                yPosition += 6;
            }
            else {
                // Use new renderStyledText for standard paragraphs
                yPosition = renderStyledText(cleanText, margin, yPosition, contentWidth, 10);
            }
        }
    }

    let filename = "optimized-faang-resume.pdf";
    if (originalFileName) {
        // Remove extension if present
        const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
        filename = `${nameWithoutExt}_modified.pdf`;
    }
    pdf.save(filename);
};
