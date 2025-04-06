# Wealtheon: Elite AI for Elite Investing

Wealtheon is an AI-powered investment platform that provides personalized investment advice, market forecasts, and strategic insights for crypto, NFTs, and DeFi. 

## Features

- **AI-Driven Market Predictions**: Get accurate crypto market trend forecasts.
- **Personalized Portfolio Management**: Receive custom recommendations based on your risk profile.
- **NFT Investment Advisor**: AI evaluation of NFT collections' growth potential.
- **DeFi & Yield Farming Insights**: Real-time analysis of yield farming opportunities.
- **Risk Management AI**: Automated risk assessment and mitigation strategies.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Blockchain Integration**: Moralis SDK, Solana blockchain
- **AI Integration**: OpenAI
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Phantom wallet for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wealtheon.git
cd wealtheon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your API keys.

4. Start the development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)

2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy to Vercel:
```bash
vercel
```

5. Configure environment variables in the Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_MORALIS_API_KEY`
   - `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## NFT Subscription Tiers

Wealtheon uses NFTs to grant access to different subscription tiers:

1. **Basic NFT**: Essential access to market insights and portfolio tracking.
2. **Advanced NFT**: Enhanced analytics, custom portfolio recommendations, and priority support.
3. **Premium NFT**: Elite AI-driven investment coaching, exclusive opportunities, and concierge support.

## License

ISC

## Project Structure

```
├── components          # UI components
│   ├── ui              # Base UI components
│   └── sections        # Page sections
├── hooks               # Custom React hooks
├── lib                 # Service integrations
│   ├── moralis.ts      # Moralis blockchain integration
│   ├── supabase.ts     # Supabase database integration
│   └── openai.ts       # OpenAI integration
├── app                 # Next.js app directory
│   ├── api             # API routes
│   └── ...             # Frontend pages
├── services            # Business logic services
├── utils               # Utility functions
├── constants           # Constant values
└── types               # TypeScript type definitions
``` 

## Environment Variables

This application requires the following environment variables to be set in a `.env.local` file:

1. Copy the example file to create your own environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update the values in `.env.local` with your own API keys:
   - `NEXT_PUBLIC_MORALIS_API_KEY` - Get from [Moralis](https://moralis.io)
   - `NEXT_PUBLIC_OPENAI_API_KEY` - Get from [OpenAI](https://platform.openai.com/api-keys)

These keys are essential for the analytics features to work properly. 