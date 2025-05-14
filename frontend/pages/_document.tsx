import { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default function Document() {
  const timestamp = Date.now();
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={`/api/favicon?t=${timestamp}`} type="image/x-icon" />
        <link rel="shortcut icon" href={`/api/favicon?t=${timestamp}`} type="image/x-icon" />
        <link rel="icon" type="image/svg+xml" href={`/favicon.svg?t=${timestamp}`} />
        <link rel="apple-touch-icon" href={`/api/favicon?t=${timestamp}`} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366F1" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Add this to ensure proper server-side rendering of styles
Document.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await ctx.defaultGetInitialProps(ctx);
  return {
    ...initialProps,
    styles: <>{initialProps.styles}</>,
  };
};
