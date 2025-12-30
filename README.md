# BeyondChats Article Management System

A full-stack application for scraping, enhancing, and displaying blog articles from BeyondChats.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Diagram](#architecture-diagram)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Live Demo](#live-demo)

## Overview

This project was built for the BeyondChats Full Stack Web Developer Intern assignment. It consists of three main phases:

1. **Phase 1 (Backend)**: Express.js API with MongoDB for storing articles, plus web scraping functionality
2. **Phase 2 (Node Script)**: Automated script that enhances articles using Google Search and OpenAI
3. **Phase 3 (Frontend)**: React.js application with a responsive UI to display articles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js, MongoDB, Mongoose, Puppeteer |
| Node Script | Puppeteer, Cheerio, OpenAI API, SerpAPI |
| Frontend | React.js, Tailwind CSS, Axios, React Router |
| Database | MongoDB Atlas |

## Project Structure

```
BeyondChats/
├── backend/                    # Express.js API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/
│   │   │   └── articleController.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   └── Article.js      # Mongoose schema
│   │   ├── routes/
│   │   │   └── articleRoutes.js
│   │   ├── services/
│   │   │   └── scraperService.js
│   │   └── server.js
│   └── package.json
│
├── node-script/                # Article Enhancement Script
│   ├── src/
│   │   ├── services/
│   │   │   ├── googleSearch.js
│   │   │   ├── scraper.js
│   │   │   └── llm.js
│   │   └── index.js
│   └── package.json
│
├── frontend/                   # React.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ArticleCard.js
│   │   │   └── LoadingSpinner.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   └── ArticleDetail.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  BeyondChats    │
                    │  Blog Website   │
                    │ (Source Data)   │
                    └────────┬────────┘
                             │ Scrape Articles
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: BACKEND API                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Express.js Server (Port 5000)                                          │ │
│  │  • POST /api/articles/scrape  - Trigger web scraping                    │ │
│  │  • GET  /api/articles         - List all articles                       │ │
│  │  • GET  /api/articles/:id     - Get single article                      │ │
│  │  • POST /api/articles         - Create article                          │ │
│  │  • PUT  /api/articles/:id     - Update article                          │ │
│  │  • DELETE /api/articles/:id   - Delete article                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│                                    ▼                                          │
│                          ┌─────────────────┐                                  │
│                          │   MongoDB Atlas │                                  │
│                          │   (Database)    │                                  │
│                          └─────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                             │           ▲
              Fetch Articles │           │ Publish Enhanced
                             ▼           │
┌──────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2: NODE SCRIPT                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Fetch pending articles from API                                     │ │
│  │  2. Search Google for similar articles (SerpAPI)                        │ │
│  │  3. Scrape content from top 2 results (Puppeteer)                       │ │
│  │  4. Enhance article with LLM (OpenAI GPT)                               │ │
│  │  5. Publish enhanced version via API                                    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│         ┌───────────┐    ┌───────────┐    ┌───────────┐                      │
│         │  Google   │    │   Web     │    │  OpenAI   │                      │
│         │  Search   │───▶│  Scraper  │───▶│   GPT     │                      │
│         │ (SerpAPI) │    │(Puppeteer)│    │   API     │                      │
│         └───────────┘    └───────────┘    └───────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 3: REACT FRONTEND                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  • Home Page: Display all articles with filters                         │ │
│  │  • Article Detail: Toggle between original & enhanced versions          │ │
│  │  • Responsive design with Tailwind CSS                                  │ │
│  │  • Filter by: All / Original / Enhanced                                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│                      Fetch via REST API                                       │
│                                    ▼                                          │
│                          ┌─────────────────┐                                  │
│                          │  Backend API    │                                  │
│                          │  (Port 5000)    │                                  │
│                          └─────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js v18+ 
- MongoDB Atlas account (free tier works)
- OpenAI API key (for article enhancement)
- SerpAPI key (for Google search - optional)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/beyondchats-assignment.git
cd beyondchats-assignment
```

### Step 2: Setup Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB URI:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beyondchats

# Start the server
npm run dev
```

The API will be available at `http://localhost:5000`

### Step 3: Setup Frontend

```bash
cd frontend
npm install

# Start React app
npm start
```

The frontend will be available at `http://localhost:3000`

### Step 4: Setup Node Script (Optional - for article enhancement)

```bash
cd node-script
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your API keys:
# OPENAI_API_KEY=your_openai_key
# SERPAPI_KEY=your_serpapi_key

# Run the enhancement script
npm start
```

## API Documentation

### Base URL
`http://localhost:5000/api`

### Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/articles` | Get all articles | Query: `page`, `limit`, `enhanced` |
| GET | `/articles/:id` | Get single article | - |
| POST | `/articles` | Create article | `{ title, content, sourceUrl, ... }` |
| PUT | `/articles/:id` | Update article | Article fields to update |
| DELETE | `/articles/:id` | Delete article | - |
| POST | `/articles/scrape` | Scrape from BeyondChats | `{ count: 5 }` |
| GET | `/articles/pending` | Get unenhanced articles | - |

### Example Requests

```bash
# Scrape 5 articles from BeyondChats
curl -X POST http://localhost:5000/api/articles/scrape \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'

# Get all enhanced articles
curl http://localhost:5000/api/articles?enhanced=true

# Get single article
curl http://localhost:5000/api/articles/507f1f77bcf86cd799439011
```

## Live Demo

🔗 **Frontend**: [Your Deployed Link Here]

🔗 **API**: [Your API Link Here]

## Features

- ✅ Web scraping from BeyondChats blog
- ✅ MongoDB storage with Mongoose
- ✅ Full CRUD API operations
- ✅ Article enhancement with LLM
- ✅ Google search integration
- ✅ Responsive React frontend
- ✅ Toggle between original/enhanced versions
- ✅ Reference citations
- ✅ Filter by article status

## Screenshots

### Home Page
![Home Page](screenshots/home.png)

### Article Detail
![Article Detail](screenshots/article.png)

## Author

Built for BeyondChats Full Stack Web Developer Intern Assignment

## License

MIT
