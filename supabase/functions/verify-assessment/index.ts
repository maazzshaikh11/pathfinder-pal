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
    const { questions, userAnswers, track } = await req.json();

    if (!questions || !userAnswers || !Array.isArray(questions) || !Array.isArray(userAnswers)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Questions and userAnswers arrays are required' }),
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

    // Build verification prompt
    const questionsForVerification = questions.map((q: any, i: number) => {
      const userAnswer = userAnswers[i];
      let userAnswerText: string;
      
      if (q.type === 'mcq' && typeof userAnswer === 'number' && q.options) {
        userAnswerText = `Option ${userAnswer} ("${q.options[userAnswer]}")`;
      } else {
        userAnswerText = String(userAnswer);
      }

      return {
        index: i,
        question: q.question,
        type: q.type,
        options: q.options || null,
        originalCorrectAnswer: q.type === 'mcq' ? `Option ${q.correctAnswer} ("${q.options?.[q.correctAnswer]}")` : q.correctAnswer,
        userAnswer: userAnswerText,
        topic: q.topic,
        difficulty: q.difficulty,
      };
    });

    const systemPrompt = `You are an expert answer verifier for a ${track || 'technical'} assessment. Your job is to verify each answer with 100% accuracy.

For each question below, you must:
1. Determine the GENUINELY CORRECT answer (ignore the "originalCorrectAnswer" if it's wrong)
2. Check if the user's answer matches the correct answer
3. For short-answer/coding questions, accept equivalent answers (e.g., "O(n^2)" and "O(N^2)" are the same; "HashMap" and "Hash Map" are the same)
4. Provide a brief explanation for each

Return ONLY a JSON array (no markdown, no extra text):
[
  {
    "index": 0,
    "isCorrect": true,
    "correctAnswer": "The actual correct answer text",
    "explanation": "Why this is the correct answer",
    "topic": "Topic name"
  },
  ...
]

IMPORTANT:
- Be absolutely certain about each answer. If the original correct answer was wrong, override it.
- For MCQ, return the correct 0-based option INDEX as correctAnswer
- For coding/short-answer, return the correct text as correctAnswer
- Accept reasonable variations in short answers (case-insensitive, minor formatting differences)`;

    console.log(`Verifying ${questions.length} answers for track: ${track}`);

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
          { role: 'user', content: `Verify these assessment answers:\n\n${JSON.stringify(questionsForVerification, null, 2)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again.' }),
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
        JSON.stringify({ success: false, error: 'Verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    let verifiedResults;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        verifiedResults = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in verification response');
      }

      if (!Array.isArray(verifiedResults)) {
        throw new Error('Invalid verification results');
      }
    } catch (parseErr) {
      console.error('Failed to parse verification response:', parseErr, aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse verification. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correctCount = verifiedResults.filter((r: any) => r.isCorrect).length;
    const gaps = verifiedResults
      .filter((r: any) => !r.isCorrect)
      .map((r: any) => r.topic);

    console.log(`Verification complete: ${correctCount}/${questions.length} correct`);

    return new Response(
      JSON.stringify({
        success: true,
        results: verifiedResults,
        correctCount,
        totalQuestions: questions.length,
        gaps: [...new Set(gaps)],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
