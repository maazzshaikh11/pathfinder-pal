import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, resumeAnalysis, username } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with resume context
    const systemPrompt = `You are an expert AI Career Coach helping ${username || 'a student'} with their resume and career growth.

${resumeAnalysis ? `
## Resume Analysis Data
- **Overall Score:** ${resumeAnalysis.overallScore}%
- **Domain:** ${(resumeAnalysis as any).domain || 'General'}
- **Skill Match:** ${resumeAnalysis.skillMatchScore}% | **Projects:** ${resumeAnalysis.projectQualityScore}% | **Experience:** ${resumeAnalysis.experienceScore}%
- **Resume Structure:** ${resumeAnalysis.resumeStructureScore}% | **Action Verbs:** ${resumeAnalysis.actionVerbsScore}%
- **Skills Found:** ${resumeAnalysis.matchedSkills?.join(', ') || 'None detected'}
- **Missing Skills:** ${resumeAnalysis.missingSkills?.join(', ') || 'None'}
- **Top Recommendations:** ${resumeAnalysis.recommendations?.slice(0,3).join(' | ') || 'None'}
` : 'No resume analyzed yet. Encourage the user to upload their resume first.'}

## Response Rules
1. Be **concise** — keep responses under 150 words unless the user asks for detail
2. Use **bullet points** and **bold** for key terms — avoid long paragraphs
3. Be **encouraging** but **honest** — give specific, actionable advice
4. If asked about scores, reference the actual numbers above
5. If asked about missing skills, name them specifically and suggest a learning resource
6. Respond in a **friendly, professional tone** — like a career mentor

Format example for skill advice:
**Missing: Docker**
- Learn: "Docker for Beginners" on YouTube
- Practice: containerize a personal project`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("resume-chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
