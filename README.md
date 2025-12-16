# ARISE - Solo Leveling Habit Tracker

A gamified habit-tracking web application inspired by Solo Leveling, where you complete quests (habits) to gain XP, level up, and become a Hunter.

## Features

- **Player Progression**: Level up, gain XP, and rank up from E-Rank to Monarch
- **Quest System**: Daily, Weekly, and Side quests with XP rewards and stat bonuses
- **Dungeon Challenges**: Timed challenges with bigger rewards
- **Stats System**: STR, AGI, INT, VIT, LCK - allocate points as you level up
- **Achievements**: Unlock achievements with passive bonuses
- **Real-time Sync**: See other players' progress live
- **Dark Theme UI**: Beautiful Solo Leveling inspired design

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, CSS Modules
- **Backend**: Express.js, Node.js, Socket.io
- **Database**: MySQL (TiDB Cloud)
- **Deployment**: Vercel (Frontend) + Render (Backend)

## Setup

### Prerequisites
- Node.js 18+
- MySQL database (TiDB Cloud recommended)

### Backend Setup

`ash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
`

### Frontend Setup

`ash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URLs
npm run dev
`

### Database Setup

Run the schema in ackend/database/schema.sql in your MySQL database.

## Environment Variables

### Backend (.env)
- PORT - Server port (default: 5000)
- DB_HOST - TiDB host
- DB_PORT - TiDB port (default: 4000)
- DB_USER - Database user
- DB_PASSWORD - Database password
- DB_NAME - Database name
- JWT_SECRET - JWT secret key
- FRONTEND_URL - Frontend URL for CORS

### Frontend (.env.local)
- NEXT_PUBLIC_API_URL - Backend API URL
- NEXT_PUBLIC_SOCKET_URL - Backend Socket.io URL

## Deployment

### Deploy to Render (Backend)
1. Connect your GitHub repo
2. Select the /backend directory
3. Set environment variables
4. Deploy!

### Deploy to Vercel (Frontend)
1. Import your GitHub repo
2. Set root directory to /frontend
3. Add environment variables
4. Deploy!

## License

MIT
