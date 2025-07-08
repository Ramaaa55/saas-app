import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://24870f763a6ba9c70f33fdc6fa92f7f8@o4509629647552512.ingest.us.sentry.io/4509629752934400',
  tracesSampleRate: 1.0,
});

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
