import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssessmentData {
  studentUsername: string;
  track: string;
  correctAnswers: number;
  totalQuestions: number;
  gaps: string[];
  questionResponses: Array<{
    questionId: string;
    topic: string;
    isCorrect: boolean;
    difficulty: string;
  }>;
  resumeScore?: number;
  skillsFound?: string[];
}

interface PredictionResult {
  level: "Beginner" | "Intermediate" | "Ready";
  confidence: number;
  skillGaps: Array<{
    skill: string;
    gapType: "Conceptual" | "Practical";
    priority: "High" | "Medium" | "Low";
  }>;
  recommendations: string[];
  estimatedReadinessWeeks: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const assessmentData: AssessmentData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { 
      studentUsername, 
      track, 
      correctAnswers, 
      totalQuestions, 
      gaps, 
      questionResponses,
      resumeScore = 0,
      skillsFound = []
    } = assessmentData;

    // Calculate weighted score
    const assessmentScorePercent = (correctAnswers / totalQuestions) * 100;
    
    // Difficulty-weighted score: Hard=3, Medium=2, Easy=1
    const difficultyWeights: Record<string, number> = { Hard: 3, Medium: 2, Easy: 1 };
    let weightedCorrect = 0;
    let totalWeight = 0;
    
    questionResponses.forEach(response => {
      const weight = difficultyWeights[response.difficulty] || 1;
      totalWeight += weight;
      if (response.isCorrect) {
        weightedCorrect += weight;
      }
    });
    
    const weightedScore = totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : assessmentScorePercent;

    // Prepare prompt for AI analysis
    const prompt = `You are an expert placement readiness classifier for engineering students.

Analyze this student's assessment performance and predict their placement readiness level.

**Student Data:**
- Username: ${studentUsername}
- Track: ${track}
- Raw Score: ${correctAnswers}/${totalQuestions} (${assessmentScorePercent.toFixed(1)}%)
- Weighted Score (difficulty-adjusted): ${weightedScore.toFixed(1)}%
- Resume Score: ${resumeScore}%
- Skills from Resume: ${skillsFound.length > 0 ? skillsFound.join(", ") : "Not provided"}

**Question-by-Question Breakdown:**
${questionResponses.map((q, i) => `${i + 1}. Topic: ${q.topic} | Difficulty: ${q.difficulty} | Result: ${q.isCorrect ? "✓ Correct" : "✗ Wrong"}`).join("\n")}

**Identified Skill Gaps:**
${gaps.length > 0 ? gaps.join(", ") : "None"}

**Classification Guidelines:**
- **Beginner (0-40% weighted)**: Needs fundamental training. Multiple core concept gaps.
- **Intermediate (41-70% weighted)**: Good foundation but needs targeted improvement.
- **Ready (71-100% weighted)**: Placement-ready with minor refinements needed.

**Your Task:**
1. Classify the student as Beginner, Intermediate, or Ready
2. Calculate a confidence score (0-100%)
3. Categorize each skill gap as "Conceptual" (theory/knowledge) or "Practical" (application/coding)
4. Prioritize gaps as High/Medium/Low based on industry relevance
5. Provide 3 specific, actionable recommendations
6. Estimate weeks to reach "Ready" level (0 if already Ready)

Respond ONLY with valid JSON in this exact format:
{
  "level": "Beginner" | "Intermediate" | "Ready",
  "confidence": number,
  "skillGaps": [
    { "skill": "string", "gapType": "Conceptual" | "Practical", "priority": "High" | "Medium" | "Low" }
  ],
  "recommendations": ["string", "string", "string"],
  "estimatedReadinessWeeks": number
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are an expert ML-based placement readiness classifier. Always respond with valid JSON only, no markdown." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please contact support." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI prediction service unavailable");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse AI response - handle potential markdown code blocks
    let prediction: PredictionResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback to rule-based classification
      prediction = {
        level: weightedScore >= 70 ? "Ready" : weightedScore >= 40 ? "Intermediate" : "Beginner",
        confidence: 75,
        skillGaps: gaps.map(gap => ({
          skill: gap,
          gapType: gap.includes("Evaluation") || gap.includes("Security") || gap.includes("Mechanism") ? "Conceptual" as const : "Practical" as const,
          priority: "Medium" as const
        })),
        recommendations: [
          `Focus on mastering ${gaps[0] || track} fundamentals`,
          "Practice with real-world projects and coding challenges",
          "Review missed concepts and attempt mock assessments"
        ],
        estimatedReadinessWeeks: weightedScore >= 70 ? 0 : weightedScore >= 40 ? 4 : 8
      };
    }

    // Validate and sanitize the prediction
    const validLevels = ["Beginner", "Intermediate", "Ready"];
    if (!validLevels.includes(prediction.level)) {
      prediction.level = weightedScore >= 70 ? "Ready" : weightedScore >= 40 ? "Intermediate" : "Beginner";
    }
    
    prediction.confidence = Math.min(100, Math.max(0, prediction.confidence || 75));
    prediction.estimatedReadinessWeeks = Math.max(0, prediction.estimatedReadinessWeeks || 0);

    return new Response(JSON.stringify({
      success: true,
      prediction,
      metadata: {
        rawScore: assessmentScorePercent,
        weightedScore,
        track,
        analyzedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Skill prediction error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
