import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl, profileText, track } = await req.json();

    if (!profileText || profileText.trim().length < 30) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please paste your LinkedIn profile content (About, Experience, Skills, Education sections). LinkedIn blocks automated scraping, so we need you to copy-paste the text from your profile page.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentToAnalyze = profileText;

    console.log('Analyzing LinkedIn profile with AI...');

    const trackContext = track ? `The student is targeting the "${track}" career track.` : '';
    
    const systemPrompt = `You are an expert career analyst for placement preparation. Analyze the following LinkedIn profile content and provide a detailed assessment. ${trackContext}

Return your analysis in the following JSON format (and ONLY the JSON, no extra text):
{
  "overallScore": <number 0-100>,
  "headline": "<person's headline or title if found>",
  "name": "<person's name if found>",
  "skillMatchScore": <number 0-100>,
  "projectQualityScore": <number 0-100>,
  "experienceScore": <number 0-100>,
  "profileCompletenessScore": <number 0-100>,
  "networkStrengthScore": <number 0-100>,
  "contentQualityScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "summary": "<2-3 sentence summary of the profile>"
}

Score criteria:
- overallScore: weighted average of all scores
- skillMatchScore: relevance of skills to the target track or general industry demand
- projectQualityScore: quality and relevance of projects/portfolio mentioned
- experienceScore: depth and relevance of work experience
- profileCompletenessScore: how complete the profile appears (about, experience, education, skills sections)
- networkStrengthScore: connections, recommendations, endorsements indicators
- contentQualityScore: quality of descriptions, headlines, about section

Be thorough and fair in your assessment. If limited information is provided, note that in the summary and adjust scores accordingly.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this LinkedIn profile:\n\n${contentToAnalyze.substring(0, 10000)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr, aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI analysis. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis complete for:', analysis.name || 'Unknown');

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('LinkedIn analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
