# 🚀 AI Multi-Tool Studio

Welcome to **AI Multi-Tool Studio**, a full-stack AI application powered by the Vercel AI SDK, Next.js, and MongoDB. This intelligent chat assistant can translate natural language into complex MongoDB queries, fetch live movie data from TMDB (with local caching), and deliver dad jokes!

## 🌟 Key Features

1. **Database Chat Tool 🧠**
   - Ask natural language questions like *"Show me all sci-fi movies"* or *"Find users older than 25"*.
   - The AI dynamically constructs and executes Mongoose queries safely.
   - Beautifully renders results in a clean UI table.

2. **Movie Database Tool 🎬**
   - Ask about any movie (e.g., *"Search for Inception"*).
   - Fetches live data (posters, cast, director, ratings, recommendations) from the **TMDB API**.
   - Caches results in MongoDB to save API calls and speed up future requests.
   - Includes a Circuit Breaker pattern to ensure the app doesn't crash if the TMDB API goes down.

3. **Dad Jokes Tool 😂**
   - Need a laugh? Ask for a joke (e.g., *"Tell me a programming joke"*).
   - Fetches jokes from the `icanhazdadjoke` API and caches them.
   - Features a thumbs up/down rating system stored directly in MongoDB.

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **AI Integration:** Vercel AI SDK, OpenAI (GPT-4o)
- **Database:** MongoDB Atlas, Mongoose
- **Styling:** Tailwind CSS, Lucide Icons
- **External APIs:** TMDB (The Movie Database), icanhazdadjoke

## ⚙️ Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/karimsaabir9/AI-SDK.git
cd ai_sdk_exercise_5
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root of your project and add the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
TMDB_API_TOKEN=your_tmdb_api_read_access_token_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

🌐 **Live Demo:** You can also view the deployed project here: [https://ai-sdk-iota-wheat.vercel.app/](https://ai-sdk-iota-wheat.vercel.app/)

**Important:** Whether running locally or on the live demo, click the **"Seed DB"** button in the top right corner of the app to populate your MongoDB with initial sample data!


---
*Built with ❤️ for the Dugsiiye Mentorship Program.*
