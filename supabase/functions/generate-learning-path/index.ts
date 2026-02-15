import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skillGaps, track, courses } = await req.json();

    if (!skillGaps || !Array.isArray(skillGaps) || !courses || !Array.isArray(courses)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing skillGaps or courses" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const courseSummary = courses.map((c: any, i: number) => 
      `[${i}] "${c.title}" | Platform: ${c.platform} | Skill: ${c.skill_covered} | Track: ${c.track} | Difficulty: ${c.difficulty_level} | Free: ${c.is_free} | Rating: ${c.rating || 'N/A'} | Hours: ${c.duration_hours || 'N/A'}`
    ).join("\n");

    const gapsSummary = skillGaps.map((g: any) => 
      `- ${g.skill} (Gap: ${g.gapType}, Priority: ${g.priority})`
    ).join("\n");

    const prompt = `You are a career counselor AI. A student just completed an assessment in "${track}" and has these skill gaps:

${gapsSummary}

Here are all available courses:
${courseSummary}

Select the BEST courses (up to 8) that address the student's skill gaps. For each selected course, provide:
1. The course index number from the list above
2. Which skill gap it addresses
3. A brief reason why this course helps (1 sentence)
4. Priority order (1 = most important)

Also suggest 2-3 general study tips for their weak areas.

Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "courseIndex": 0,
      "addressesGap": "skill name",
      "reason": "why this course helps",
      "priority": 1
    }
  ],
  "studyTips": ["tip1", "tip2", "tip3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful career advisor. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(content);

    // Map course indices back to full course data
    const recommendations = (parsed.recommendations || [])
      .filter((r: any) => r.courseIndex >= 0 && r.courseIndex < courses.length)
      .map((r: any) => ({
        course: courses[r.courseIndex],
        addressesGap: r.addressesGap,
        reason: r.reason,
        priority: r.priority,
      }))
      .sort((a: any, b: any) => a.priority - b.priority);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        studyTips: parsed.studyTips || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Learning path generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
