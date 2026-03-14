import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OPENAI_API_KEY is not set. Add it to your environment to use the prioritizer.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { tasks?: unknown }).tasks)
  ) {
    return new Response(
      JSON.stringify({ error: "Request body must include a tasks array." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const tasks = (body as { tasks: unknown[] }).tasks
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0);

  if (tasks.length === 0) {
    return new Response(
      JSON.stringify({ error: "Please provide at least one non-empty task." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const systemPrompt =
    "You are an expert personal productivity coach. " +
    "Given a list of tasks for today, you must prioritize them from highest priority to lowest. " +
    "Prioritization should consider urgency (deadlines today or soon), impact, dependencies, and realistic time constraints. " +
    "Always explain clearly why a task is ranked where it is, focusing on why it is high or low priority.";

  const userPrompt = `
Here is a list of tasks the user is considering for today:

${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return a JSON object with this shape:
{
  "prioritizedTasks": [
    {
      "task": "string - the original task text",
      "rank": number,            // 1 is highest priority
      "priorityLabel": "string", // e.g. "High", "Medium", "Low"
      "reason": "string"         // explain *why* this task is ranked where it is, including why it is high or low compared to others
    }
  ],
  "summary": "Short overall strategy for the day"
}

Only return valid JSON. Do not include any explanation outside of the JSON.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          error: "No response from OpenAI. Please try again.",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while prioritizing your tasks. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

