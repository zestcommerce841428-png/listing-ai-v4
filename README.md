## Development
To start development server:

```bash
npm run dev
```

Then open http://localhost:3000

## Setup Checklist

1. **Configure environment** — copy `.env.local` and fill in:
   - `DATABASE_URL` — your MySQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from [clerk.com](https://clerk.com) (free)

2. **Setup MySQL** — run:
   ```bash
   npx prisma db push
   ```

3. **Get free AI key** — visit [console.groq.com](https://console.groq.com) — free 14,400 requests/day

## Production with Docker

```bash
# Start all services (MySQL, Redis, Kafka, Nginx, App)
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma db push
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | MySQL 8 + Prisma ORM |
| Caching | Redis 7 |
| Queue | Kafka + Zookeeper |
| Real-time | Socket.io |
| Scraper | Playwright (headless Chrome) |
| Proxy | Nginx |
| Containers | Docker + docker-compose |
| AI Providers | Groq, Gemini, OpenAI, AWS Bedrock, Ollama |

## Supported AI Models

- **Groq** (FREE): Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma2 9B
- **Gemini** (FREE): 2.0 Flash, 1.5 Flash, 1.5 Pro
- **Ollama** (FREE local): gemma2:2b, llama3.2:3b, mistral, any model
- **AWS Bedrock**: Claude 3.5 Sonnet/Haiku, Llama 3.3 70B, Nova Micro/Lite/Pro, Mistral, Titan, Cohere, AI21 — 44 models across 31 regions
- **OpenAI**: GPT-3.5 Turbo, GPT-4o Mini, GPT-4o
