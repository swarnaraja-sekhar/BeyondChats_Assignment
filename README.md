# BeyondChats Article Management System

A full-stack application for scraping, enhancing, and displaying blog articles from BeyondChats.

## Project Structure

```
BeyondChats/
├── backend/          # Express.js API server (Phase 1)
├── node-script/      # Article enhancement script (Phase 2)
├── frontend/         # React.js frontend (Phase 3)
└── README.md
```

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Node Script**: Puppeteer, Cheerio, OpenAI API
- **Frontend**: React.js, Tailwind CSS, Axios

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   BeyondChats   │     │   Google Search │     │    OpenAI API   │
│     Blogs       │     │     Results     │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Node Script (Phase 2)                        │
│  • Fetches articles from API                                        │
│  • Searches Google for similar articles                             │
│  • Scrapes content from top results                                 │
│  • Uses LLM to enhance articles                                     │
└────────────────────────────────────────────────────────────────────┘
         │                                               │
         │ Publish                                       │ Fetch
         ▼                                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Backend API (Phase 1)                           │
│  • CRUD operations for articles                                     │
│  • Web scraping endpoint                                            │
│  • MongoDB storage                                                  │
└────────────────────────────────────────────────────────────────────┘
         │                                               ▲
         │ Store/Retrieve                                │ Fetch
         ▼                                               │
┌─────────────────┐                           ┌─────────────────┐
│    MongoDB      │                           │ React Frontend  │
│    Database     │                           │   (Phase 3)     │
└─────────────────┘                           └─────────────────┘
```

## Data Flow

1. **Scraping Phase**: Backend scrapes 5 oldest articles from BeyondChats blogs
2. **Storage Phase**: Articles stored in MongoDB with CRUD APIs
3. **Enhancement Phase**: Node script fetches articles, searches Google, scrapes similar articles, uses LLM to enhance
4. **Display Phase**: React frontend displays original and enhanced articles

## Local Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- OpenAI API key
- SerpAPI key (for Google Search)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Node Script Setup
```bash
cd node-script
npm install
cp .env.example .env
# Configure your .env file
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/beyondchats
```

### Node Script (.env)
```
API_BASE_URL=http://localhost:5000/api
OPENAI_API_KEY=your_openai_api_key
SERPAPI_KEY=your_serpapi_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/articles | Get all articles |
| GET | /api/articles/:id | Get article by ID |
| POST | /api/articles | Create new article |
| PUT | /api/articles/:id | Update article |
| DELETE | /api/articles/:id | Delete article |
| POST | /api/scrape | Scrape articles from BeyondChats |

## Live Link

[Frontend Demo](YOUR_DEPLOYED_LINK_HERE)

## License

MIT
