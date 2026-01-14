# Atypica Bet - Prediction Experiment

An independent prediction experiment using atypica.ai for market analysis. A Next.js application for tracking and analyzing Polymarket prediction markets with position snapshots and historical performance tracking.

**Note:** This is an independent project and is not affiliated with or endorsed by Atypica.

## Features

- 📊 Track prediction markets from Polymarket
- 💰 Monitor NFT position holdings and profit/loss
- 📈 Historical position snapshots (hourly tracking)
- 🎯 Admin panel for market management
- 🔒 Basic authentication for admin access
- ⏰ Automated hourly position snapshots via Vercel Cron

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **UI**: React, Tailwind CSS, Recharts
- **Deployment**: Vercel
- **APIs**: Polymarket API integration

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Polymarket wallet address
- Vercel account (for deployment)

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Polymarket
POLYMARKET_WALLET_ADDRESS="your_wallet_address"

# Proxy (optional, for Polymarket API access)
PROXY_URL="your_proxy_url"

# Admin Basic Auth
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"

# Cron Job Security
CRON_SECRET="your_random_secret_key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Public APIs

- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `GET /api/positions/history?limit=6` - Get position history

### Protected APIs (require authentication)

- `GET /api/positions/snapshot` - Create position snapshot (requires Authorization header)
- `GET /admin` - Admin panel (requires basic auth)

## Hourly Position Snapshots

The application tracks position performance by creating hourly snapshots of your Polymarket holdings.

### Vercel Cron Job (Recommended)

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/positions/snapshot",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Setup:**
1. Set `CRON_SECRET` in Vercel environment variables (Production environment)
2. Deploy to Vercel - cron runs automatically
3. Vercel automatically sends `CRON_SECRET` as `Authorization` header
4. View logs: Vercel Dashboard → Deployments → Cron Logs

**Security**: Vercel automatically injects the `CRON_SECRET` environment variable as an Authorization header when invoking the cron job. No need to manually pass it in the URL.

**Free Plan Limits**: 100 calls/day (24 hourly snapshots = well within limit)

### Alternative: Manual/External Cron

If not using Vercel Cron, you can set up external scheduling:

**Option 1: Server Cron Job**
```bash
# Add to crontab
0 * * * * curl -H "Authorization: Bearer your_secret" "https://your-app.vercel.app/api/positions/snapshot"
```

**Option 2: GitHub Actions**
Create `.github/workflows/snapshot.yml`:
```yaml
name: Hourly Snapshot
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - run: curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" "https://your-app.vercel.app/api/positions/snapshot"
```

**Option 3: cron-job.org**
- URL: `https://your-app.vercel.app/api/positions/snapshot`
- Method: GET
- Headers: `Authorization: Bearer your_secret`
- Schedule: Every hour

### Testing Snapshot Creation

```bash
# Local
curl -H "Authorization: Bearer your_secret" "http://localhost:3000/api/positions/snapshot"

# Production
curl -H "Authorization: Bearer your_secret" "https://your-app.vercel.app/api/positions/snapshot"
```

## Admin Panel

Access the admin panel at `/admin` with basic authentication.

**Features:**
- View all markets
- Create/edit markets
- Import from Polymarket
- Resolve market outcomes

**Credentials:** Set in environment variables
- Username: `ADMIN_USERNAME`
- Password: `ADMIN_PASSWORD`

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

Vercel will automatically:
- Run database migrations
- Set up cron jobs
- Deploy to production

### Environment Variables (Production)

Required in Vercel:
- `DATABASE_URL`
- `POLYMARKET_WALLET_ADDRESS`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CRON_SECRET`
- `PROXY_URL` (if needed)

## Database Schema

### Key Models

- `Market` - Prediction markets
- `Option` - Market options/outcomes
- `PositionSnapshot` - Hourly position snapshots

### Snapshot Data

Each snapshot captures:
- `percentRealizedPnl` - Profit/loss percentage
- `currentValue` - Current position value
- `winValue` - Win value
- `timestamp` - Hourly timestamp

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
