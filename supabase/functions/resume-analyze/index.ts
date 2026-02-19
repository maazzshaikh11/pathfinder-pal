import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Domain skill sets (source of truth) ────────────────────────────────────
const DOMAIN_SKILLS: Record<string, { required: string[]; bonus: string[] }> = {
  "Programming & DSA": {
    required: [
      "Data Structures", "Algorithms", "Dynamic Programming", "Graphs", "Trees",
      "Arrays", "Linked Lists", "Stacks", "Queues", "Recursion",
      "Sorting", "Searching", "Hash Maps", "Binary Search", "Time Complexity",
    ],
    bonus: [
      "C++", "Java", "Python", "Competitive Programming", "LeetCode",
      "CodeForces", "Big-O Notation", "Backtracking", "Greedy Algorithms",
    ],
  },
  "Data Science & ML": {
    required: [
      "Python", "Machine Learning", "Deep Learning", "Data Analysis", "Statistics",
      "Pandas", "NumPy", "Scikit-learn", "Data Visualization", "Feature Engineering",
      "Model Evaluation", "Regression", "Classification", "Neural Networks",
    ],
    bonus: [
      "TensorFlow", "PyTorch", "Keras", "NLP", "Computer Vision",
      "Jupyter Notebook", "Matplotlib", "Seaborn", "XGBoost", "Transformers",
    ],
  },
  "Database Management & SQL": {
    required: [
      "SQL", "Database Design", "Normalization", "Indexing", "Joins",
      "Stored Procedures", "ACID Properties", "Transactions", "Query Optimization",
      "ER Diagrams", "Relational Databases",
    ],
    bonus: [
      "MySQL", "PostgreSQL", "MongoDB", "Redis", "NoSQL",
      "Data Modeling", "Views", "Triggers", "Oracle", "Firebase",
    ],
  },
  "Backend / Web Dev": {
    required: [
      "REST API", "Node.js", "Express.js", "Authentication", "HTTP",
      "Git", "JavaScript", "TypeScript", "JSON", "MVC Architecture",
      "Database Integration", "Error Handling",
    ],
    bonus: [
      "Docker", "JWT", "OAuth", "Microservices", "GraphQL",
      "WebSockets", "CI/CD", "AWS", "Nginx", "Redis",
    ],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const pdfFile = formData.get("resume") as File | null;
    const domain = formData.get("domain") as string;

    if (!pdfFile) {
      return new Response(JSON.stringify({ error: "No resume file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!domain || !DOMAIN_SKILLS[domain]) {
      return new Response(JSON.stringify({ error: "Invalid domain selected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Convert PDF to base64 for Gemini vision (chunked to avoid stack overflow on large files)
    const pdfBuffer = await pdfFile.arrayBuffer();
    const bytes = new Uint8Array(pdfBuffer);
    const chunkSize = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const pdfBase64 = btoa(binary);

    const domainInfo = DOMAIN_SKILLS[domain];
    const allDomainSkills = [...domainInfo.required, ...domainInfo.bonus];

    const systemPrompt = `You are an expert resume parser and career analyst specializing in campus placements.

Your job:
1. Extract ALL skills, technologies, tools, frameworks, and concepts from the resume
2. Compare them against the required domain skills for "${domain}"
3. Provide a structured JSON analysis

Domain: ${domain}
Required Skills to check: ${domainInfo.required.join(", ")}
Bonus Skills to check: ${domainInfo.bonus.join(", ")}

Return ONLY valid JSON in this exact format:
{
  "extractedSkills": ["skill1", "skill2", ...],
  "matchedRequired": ["skill1", "skill2", ...],
  "matchedBonus": ["skill1", "skill2", ...],
  "missingRequired": ["skill1", "skill2", ...],
  "missingBonus": ["skill1", "skill2", ...],
  "skillMatchScore": <0-100 integer>,
  "projectQualityScore": <0-100 integer>,
  "experienceScore": <0-100 integer>,
  "resumeStructureScore": <0-100 integer>,
  "actionVerbsScore": <0-100 integer>,
  "overallScore": <0-100 integer>,
  "projectCount": <integer>,
  "yearsExperience": <number>,
  "hasSections": {
    "skills": <boolean>,
    "experience": <boolean>,
    "education": <boolean>,
    "projects": <boolean>,
    "summary": <boolean>
  },
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2",
    "Specific actionable suggestion 3",
    "Specific actionable suggestion 4",
    "Specific actionable suggestion 5"
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "candidateName": "<name if found, else null>",
  "summary": "<2-3 sentence AI summary of the candidate's profile fit for ${domain}>"
}

Scoring guidelines:
- skillMatchScore: (matched required / total required) * 70 + (matched bonus / total bonus) * 30
- projectQualityScore: based on number of projects, descriptions, GitHub/live links, tech complexity
- experienceScore: based on internships, jobs, years, relevant domain experience
- resumeStructureScore: based on presence of key sections, formatting cues, length appropriateness
- actionVerbsScore: based on use of strong action verbs (built, implemented, led, developed, optimized, etc.)
- overallScore: weighted = skillMatch*0.40 + projects*0.25 + experience*0.15 + structure*0.10 + actionVerbs*0.10

Be strict but fair. A fresh student with no experience should score low on experience but can score well on skills.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Parse error:", e, aiContent);
      throw new Error("Failed to parse AI analysis");
    }

    // Attach domain context
    analysis.domain = domain;
    analysis.domainRequiredSkills = domainInfo.required;
    analysis.domainBonusSkills = domainInfo.bonus;

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("resume-analyze error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
