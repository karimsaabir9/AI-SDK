# AI Multi-Tool Studio

A full-stack AI application powered by Next.js, the AI SDK, MongoDB, and modern APIs (TMDB & icanhazdadjoke).

## Features
- **Database Chat Tool**: Query the local MongoDB using natural language (e.g., "Show me sci-fi movies").
- **Movie Database Tool**: Live TMDB lookups with robust caching, resilient fallback, and circuit breakers.
- **Dad Joke Tool**: Fetch random dad jokes or search by keywords with a thumbs up/down rating system.
- **Modern UI**: Dark-mode themed UI using Tailwind CSS with animations and smooth transitions.

## 🚀 Installation & Setup

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   MONGODB_URI=mongodb://localhost:27017/ai_studio
   TMDB_API_TOKEN=your_tmdb_read_access_token
   ```

3. **MongoDB Setup**:
   Ensure MongoDB Community Server is running locally. You can use **MongoDB Compass** to connect to `mongodb://localhost:27017/ai_studio`.
   The application uses Mongoose as the ODM.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Seed the Database**:
   Once the UI loads at `http://localhost:3000`, click the "Seed DB" button in the header to generate sample movies, users, and reviews.

## 📁 Folder Structure

```text
app/                 # Next.js App Router (Pages & API routes)
  api/               # API Endpoints (Chat, DB seed, Joke rate)
components/          # Shared React Components (if any)
lib/
  db/                # MongoDB connection and schemas
    models/          # Mongoose Models (Movie, User, Joke, etc.)
  tools/             # AI SDK tool definitions (databaseTool, movieTool, jokeTool)
__tests__/           # Unit and Integration tests (Vitest)
public/              # Static assets
```

## 🛠️ API & Tool Documentation

### Database Tool (`lib/tools/databaseTool.ts`)
Converts natural language into MongoDB queries using the AI SDK's `generateObject`. Supports filtering, limit, sorting, and aggregations across `movies`, `users`, and `reviews` collections.

### Movie Tool (`lib/tools/movieTool.ts`)
Integrates with the TMDB API (`api.themoviedb.org`).
- Uses `append_to_response` to fetch details, credits, and recommendations in a single request.
- Implements a circuit breaker pattern: If TMDB is unreachable after 3 consecutive failures, it falls back to MongoDB cache.

### Dad Joke Tool (`lib/tools/jokeTool.ts`)
Integrates with `icanhazdadjoke.com`.
- Supports fetching random jokes and searching by keyword.
- Caches all fetched jokes to MongoDB.
- Includes a voting mechanism where ratings (thumbs up/down) are stored locally in the DB.

## 🧪 Testing

The project uses `vitest` for robust testing of all AI tools.
```bash
npm run test
```
To run tests with coverage:
```bash
npm run test:coverage
```

## 🚨 Troubleshooting

- **MongoDB Timeout**: Make sure MongoDB is running on port 27017 and Compass can connect to it.
- **TMDB 401 Unauthorized**: Ensure your `TMDB_API_TOKEN` is correct. You need the Read Access Token (Bearer Token), not just the API Key.
- **AI Route Errors**: Ensure `OPENAI_API_KEY` is properly set. Check the Next.js terminal console for detailed validation logs if the AI SDK encounters parsing errors.
# AI-SDK
