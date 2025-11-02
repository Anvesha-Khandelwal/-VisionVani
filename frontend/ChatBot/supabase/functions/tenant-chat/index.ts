import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's knowledge base (tenant-specific data)
    const { data: knowledgeBase, error: kbError } = await supabaseClient
      .from("knowledge_base_items")
      .select("title, content, category")
      .eq("user_id", user.id);

    if (kbError) {
      console.error("Knowledge base fetch error:", kbError);
      return new Response(JSON.stringify({ error: "Failed to fetch knowledge base" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from knowledge base
    let knowledgeContext = "";
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = "\n\nYour Knowledge Base:\n" + 
        knowledgeBase.map((item) => 
          `Title: ${item.title}\n${item.category ? `Category: ${item.category}\n` : ""}Content: ${item.content}`
        ).join("\n\n");
    } else {
      knowledgeContext = "\n\n(Note: The user hasn't added any knowledge base items yet. Let them know they should add some in the dashboard to get better responses.)";
    }

    // System prompt with tenant-specific context
    const systemPrompt = `You are a helpful AI assistant specialized for this specific user/tenant. 
You have access to their custom knowledge base and should prioritize information from it when answering questions.

When answering:
1. First check if the answer is in the knowledge base below
2. If found, use that information to provide accurate, domain-specific answers
3. If not found in the knowledge base, provide general helpful information but mention that adding relevant info to the knowledge base would improve answers

${knowledgeContext}

Always be helpful, concise, and reference the knowledge base when applicable.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("tenant-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});