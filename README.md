# WeXare On-Ramp Test

Test MoonPay on-ramp via Privy for Paraguay.

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and set your Privy App ID
3. Install dependencies and run:

```bash
cp .env.example .env
# Edit .env with your VITE_PRIVY_APP_ID
npm install
npm run dev
```

## Configuration

- Enable **Pay with card (MoonPay)** in your Privy dashboard under Account Funding
- Add `localhost` to Allowed Domains in Privy dashboard
