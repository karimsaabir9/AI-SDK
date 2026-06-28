import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, UIMessage, isStepCount } from 'ai';
import { z } from 'zod';
import { executeDatabaseQuery } from '@/lib/tools/databaseTool';
import { searchMovies } from '@/lib/tools/movieTool';
import { getRandomJoke, searchJokes } from '@/lib/tools/jokeTool';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    

    const safeMessages = messages.map((m: any) => {
      if (m.parts) return m;
      return {
        ...m,
        parts: m.content ? [{ type: 'text', text: m.content }] : []
      };
    }) as any;

    const modelMessages = await convertToModelMessages(safeMessages);

    const result = streamText({
      model: openai('gpt-4o'),
      messages: modelMessages,
      stopWhen: isStepCount(5),
      system: `You are an AI Multi-Tool Studio assistant with access to three powerful tools:

1. **queryDatabase** — Query a MongoDB database containing movies, users, and reviews.
   - Use for: "Show me sci-fi movies", "Find users older than 25", "Movies rated above 8.5", "Count movies by genre", "Show all users", "Show reviews"
   - Always call this tool when the user asks about data from the database.

2. **searchMovies** — Search the TMDB movie database for detailed movie information.
   - Use for: "Search for Inception", "Find the movie Interstellar", "What is the plot of The Matrix?", "Who directed Parasite?"
   - Call this tool when the user wants live movie details, cast info, posters, or external movie data.
   - IMPORTANT: The UI automatically renders a beautiful custom card for the movie results (including the poster, ratings, etc.) right below your text. Therefore, your text response should be very brief (e.g. "Here is what I found:"). You MUST NOT output markdown images for posters or repeat all the movie details in your text.
   - Distinguish from queryDatabase: use searchMovies for live external lookup, queryDatabase for local DB queries.

3. **getJoke** — Fetch a random dad joke or search for jokes by keyword.
   - Use for: "Tell me a joke", "Give me a programming joke", "I need a laugh", "Joke about cats"
   - Pass a keyword when the user wants a specific topic.

CRITICAL RULES:
- ALWAYS call the appropriate tool — never just describe what the tool would do.
- For database queries about local data (genres, ratings, users), use queryDatabase.
- For specific movie lookups or cast/plot questions, use searchMovies.
- After tool results, briefly summarize what was found in a friendly, conversational tone.
- If a tool returns an error, explain it clearly and suggest alternatives.`,
      tools: {
        queryDatabase: tool({
          description:
            'Query the MongoDB database for movies, users, or reviews using natural language. Supports: genre filters, rating filters, age filters, director filters, and aggregations.',
          inputSchema: z.object({
            query: z
              .string()
              .describe(
                'Natural language query, e.g. "Show me all sci-fi movies", "Find users older than 25", "Get movies with rating above 8.5", "Count movies by genre"'
              ),
            collection: z
              .enum(['movies', 'users', 'reviews', 'auto'])
              .default('auto')
              .describe('Target collection, or "auto" to detect from query'),
          }),
          execute: async ({ query, collection }) => {
            return executeDatabaseQuery(query, collection);
          },
        }),


        searchMovies: tool({
          description:
            'Search TMDB for detailed movie information including poster, backdrop, recommendations, cast, director, plot, ratings, and runtime. Results are cached in MongoDB.',
          inputSchema: z.object({
            title: z
              .string()
              .describe('Movie title or keyword to search for'),
            year: z
              .string()
              .optional()
              .describe('Optional release year to narrow the search (e.g. "2010")'),
          }),
          execute: async ({ title, year }) => {
            return searchMovies(title, year);
          },
        }),


        getJoke: tool({
          description:
            'Fetch a random dad joke or search for jokes by keyword. Stores jokes in MongoDB and falls back to cached jokes if the API is unavailable.',
          inputSchema: z.object({
            keyword: z
              .string()
              .optional()
              .describe('Optional keyword to search for themed jokes, e.g. "programming", "cat", "food"'),
          }),
          execute: async ({ keyword }) => {
            if (keyword && keyword.trim()) {
              return searchJokes(keyword.trim());
            }
            return getRandomJoke();
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}