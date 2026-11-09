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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Advertising rollout

Ad slots default to `AUDIT_PRE_APPROVAL`, which reserves layout space without
loading advertising scripts. Set `NEXT_PUBLIC_AD_MODE=LIVE_ADSENSE` only after
the site has the required publisher approval and consent setup for its audience,
and configure `NEXT_PUBLIC_ADSENSE_CLIENT_ID` plus the relevant numeric slot
IDs from `.env.example`. Use `DISABLED` to remove ad slots entirely. Review the
live site's policies, consent flow, and Google publisher settings before enabling
ads; no implementation can guarantee an approval outcome.

### Analytics and performance

Vercel Speed Insights is included for production deployments; enable it in the
Vercel project dashboard to review real-user performance and Core Web Vitals.
Google Tag Manager is optional. Create a web container, configure the GA4
Measurement ID as a Google tag in that container, set `NEXT_PUBLIC_GTM_ID` in
the deployment environment, and redeploy. The GTM container loads only after a
visitor opts into analytics; visitors can change that choice in the footer.
Until a valid container ID is configured, GTM and Google Analytics do not load.
Do not also install a separate copy of the same GA4 tag outside GTM.

### Google Search Console

Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the verification token provided by
Google Search Console, then deploy the site if you need to change the current
HTML verification token. Keep at least one valid ownership method active (for
example, the Search Console DNS record). Verify the
`https://www.digicybercafe.online` property in Search Console; do not use a
placeholder token.

### Search discovery

The XML sitemap includes the canonical public tools, the tools directory, and
the practical guides. Sign-in, registration, dashboard, and redirect-only
aliases are intentionally not listed. Submitting a sitemap or requesting a
crawl does not guarantee that Google or Bing will index every URL. See
`BING-WEBMASTER-SETUP.md` for owner-side verification and indexing checks.
