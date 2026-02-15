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
    const { track, numQuestions = 5 } = await req.json();

    if (!track) {
      return new Response(
        JSON.stringify({ success: false, error: 'Track is required' }),
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

    const systemPrompt = `You are an expert assessment question generator for placement preparation. Generate exactly ${numQuestions} unique questions for the "${track}" track.

IMPORTANT RULES:
- Generate a MIX of MCQ and short-answer (coding) questions
- Include a variety of difficulty levels: Easy, Medium, Hard
- Each question must test a DIFFERENT topic within the track
- MCQ questions must have exactly 4 options
- For MCQ, correctAnswer is the 0-based index of the correct option
- For coding/short-answer questions, correctAnswer is the exact text answer (keep it short: a number, a term, Big-O notation, etc.)
- Questions should be challenging, relevant, and varied — never repeat the same question pattern
- Each question needs a clear explanation of the correct answer

Return ONLY a JSON array with this exact structure (no extra text):
[
  {
    "id": "q-1",
    "type": "mcq",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "topic": "Topic Name",
    "explanation": "Brief explanation of why this is correct.",
    "difficulty": "Easy"
  },
  {
    "id": "q-2",
    "type": "coding",
    "question": "Question text here?",
    "correctAnswer": "answer",
    "topic": "Different Topic",
    "explanation": "Brief explanation.",
    "difficulty": "Medium"
  }
]

Track-specific guidelines:
- "Programming & DSA": Arrays, Linked Lists, Trees, Graphs, Sorting, Searching, DP, Recursion, Stacks, Queues, Heaps, Hashing, String algorithms, Complexity analysis
- "Data Science & ML": Statistics, Probability, Regression, Classification, Clustering, Neural Networks, NLP, Feature Engineering, Model Evaluation, Dimensionality Reduction, Ensemble Methods
- "Database Management & SQL": SQL queries, Joins, Normalization, Indexing, Transactions, ACID, NoSQL, Query optimization, ER diagrams, Stored procedures, Triggers
- "Backend / Web Dev": REST APIs, HTTP methods/status codes, Authentication (JWT, OAuth), Node.js, Express, Middleware, Databases, Caching, WebSockets, Microservices, Docker`;

    console.log(`Generating ${numQuestions} questions for track: ${track}`);

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
          { role: 'user', content: `Generate ${numQuestions} fresh, unique assessment questions for the "${track}" track. Make them different from typical textbook questions. Use a random seed: ${Date.now()}-${Math.random().toString(36).substring(7)}` },
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
        JSON.stringify({ success: false, error: 'Failed to generate questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    let questions;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in AI response');
      }

      // Validate structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions array');
      }

      // Ensure each question has required fields
      questions = questions.map((q: any, i: number) => ({
        id: q.id || `q-${i + 1}`,
        type: q.type === 'coding' ? 'coding' : 'mcq',
        question: q.question,
        options: q.type === 'mcq' ? q.options : undefined,
        correctAnswer: q.correctAnswer,
        topic: q.topic || 'General',
        explanation: q.explanation || 'No explanation provided.',
        difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
      }));

    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr, aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse generated questions. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(
      JSON.stringify({ success: true, questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Question generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
