import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const isOverall = !domain || domain === "Overall";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch domain skills from database (rule-based source of truth)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let domainRequired: string[] = [];
    let domainBonus: string[] = [];

    if (!isOverall) {
      const { data: skillRows, error: skillError } = await supabase
        .from("domain_skills")
        .select("skill, skill_type")
        .eq("domain", domain);

      if (skillError) {
        console.error("DB skill fetch error:", skillError);
        // Fallback: continue with empty arrays and let AI do its best
      } else if (skillRows) {
        domainRequired = skillRows.filter(r => r.skill_type === "required").map(r => r.skill);
        domainBonus = skillRows.filter(r => r.skill_type === "bonus").map(r => r.skill);
      }
    }

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

    const effectiveDomain = isOverall ? "Overall" : domain;

    const systemPrompt = isOverall
      ? `You are an expert resume parser and career analyst for campus placements.

Analyze the resume holistically WITHOUT domain-specific matching. Evaluate:
1. Extract ALL skills, technologies, tools, frameworks, and concepts
2. Assess overall quality: projects, experience, structure, language quality
3. Provide a structured JSON analysis

Return ONLY valid JSON:
{
  "extractedSkills": ["skill1", "skill2", ...],
  "matchedRequired": [],
  "matchedBonus": [],
  "missingRequired": [],
  "missingBonus": [],
  "skillMatchScore": <0-100, breadth/depth of skills>,
  "projectQualityScore": <0-100>,
  "experienceScore": <0-100>,
  "resumeStructureScore": <0-100>,
  "actionVerbsScore": <0-100>,
  "overallScore": <skillMatch*0.40 + projects*0.25 + experience*0.15 + structure*0.10 + actionVerbs*0.10>,
  "projectCount": <integer>,
  "yearsExperience": <number>,
  "hasSections": { "skills": bool, "experience": bool, "education": bool, "projects": bool, "summary": bool },
  "suggestions": ["suggestion1","suggestion2","suggestion3","suggestion4","suggestion5"],
  "strengths": ["strength1","strength2","strength3"],
  "candidateName": "<name or null>",
  "summary": "<2-3 sentence overall assessment of the candidate>"
}`
      : `You are an expert resume parser and career analyst specializing in campus placements.

TASK:
1. Extract ALL skills, technologies, tools, frameworks, and concepts from the resume
2. Use ML-style matching: match semantically (e.g. "NodeJS" matches "Node.js", "ML" matches "Machine Learning")  
3. Compare against these DB-sourced domain skill sets for "${domain}":

Required Skills (rule-based from database): ${domainRequired.join(", ")}
Bonus Skills (rule-based from database): ${domainBonus.join(", ")}

Return ONLY valid JSON:
{
  "extractedSkills": ["skill1", ...],
  "matchedRequired": ["skills from Required that candidate HAS"],
  "matchedBonus": ["skills from Bonus that candidate HAS"],
  "missingRequired": ["skills from Required that candidate LACKS"],
  "missingBonus": ["skills from Bonus that candidate LACKS"],
  "skillMatchScore": <(matchedRequired/totalRequired)*70 + (matchedBonus/totalBonus)*30>,
  "projectQualityScore": <0-100>,
  "experienceScore": <0-100>,
  "resumeStructureScore": <0-100>,
  "actionVerbsScore": <0-100>,
  "overallScore": <skillMatch*0.40 + projects*0.25 + experience*0.15 + structure*0.10 + actionVerbs*0.10>,
  "projectCount": <integer>,
  "yearsExperience": <number>,
  "hasSections": { "skills": bool, "experience": bool, "education": bool, "projects": bool, "summary": bool },
  "suggestions": ["suggestion1","suggestion2","suggestion3","suggestion4","suggestion5"],
  "strengths": ["strength1","strength2","strength3"],
  "candidateName": "<name or null>",
  "summary": "<2-3 sentence profile fit summary for ${domain}>"
}

Use semantic/fuzzy matching (ML-style): "React.js" = "React", "ML" = "Machine Learning", "Mongo" = "MongoDB". Be strict but fair.`;

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
              { type: "text", text: systemPrompt },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Parse error:", e, aiContent);
      throw new Error("Failed to parse AI analysis");
    }

    // Attach domain metadata from DB
    analysis.domain = effectiveDomain;
    analysis.domainRequiredSkills = domainRequired;
    analysis.domainBonusSkills = domainBonus;

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
