This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Vercel environment

For the production deployment at `https://leadgenj.vercel.app`, set these variables in Vercel Project Settings:

```env
AUTH_URL=https://leadgenj.vercel.app
NEXTAUTH_URL=https://leadgenj.vercel.app
APP_URL=https://leadgenj.vercel.app
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
# If you connected Vercel/Neon Postgres, POSTGRES_PRISMA_URL / POSTGRES_URL are also supported.
LINKEDIN_REDIRECT_URI=https://leadgenj.vercel.app/api/linkedin/callback
OPENROUTER_APP_URL=https://leadgenj.vercel.app
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key
OPENROUTER_MODEL=deepseek/deepseek-v4-flash:free
LINKEDIN_ACTION_PROVIDER=manual
CRON_SECRET=use-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
AUTH_SECRET=use-a-long-random-auth-secret
NEXTAUTH_SECRET=use-the-same-value-as-auth-secret
```

`DATABASE_URL` must be the pooled runtime connection string for the deployed app. Vercel/Neon `POSTGRES_PRISMA_URL` and `POSTGRES_URL` are also supported at runtime. Use `DIRECT_URL` or `POSTGRES_URL_NON_POOLING` for Prisma schema pushes/migrations when your provider gives you a separate direct/session connection string.

After setting database variables, run the schema push against production:

```bash
npx prisma db push
```

Check production readiness at:

```txt
https://leadgenj.vercel.app/api/health
```

Also add this authorized redirect URI in Google Cloud Console for the same OAuth client:

```txt
https://leadgenj.vercel.app/api/auth/callback/google
```

Also add the same production LinkedIn callback URL in LinkedIn Developer settings:

```txt
https://leadgenj.vercel.app/api/linkedin/callback
```

Privacy policy URL:

```txt
https://leadgenj.vercel.app/privacy
```

## Campaign engine and LinkedIn access

The campaign engine stores every due LinkedIn action in the database and Vercel Cron calls:

```txt
https://leadgenj.vercel.app/api/cron/campaign-engine
```

Use `LINKEDIN_ACTION_PROVIDER=manual` in production until you connect an approved LinkedIn or partner sending API. Use `LINKEDIN_ACTION_PROVIDER=demo` only for local demos because it marks due actions as sent without contacting LinkedIn.

LinkedIn OAuth keys come from the LinkedIn Developer Portal. Create an app, add your verified company page, then request the API products your use case needs. OAuth app creation is free, but product access is approval-based. LinkedIn does not provide a free general API for arbitrary connection-request and private-message automation.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
