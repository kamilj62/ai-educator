import { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default function Document() {
  const timestamp = Date.now();
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={`/ai-ppt-logo.svg?t=${timestamp}`} type="image/svg+xml" sizes="any" />
        <link rel="icon" href={`/ai-ppt-logo.svg?t=${timestamp}`} type="image/svg+xml" />
        <link rel="shortcut icon" href={`/ai-ppt-logo.svg?t=${timestamp}`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`/ai-ppt-logo.svg?t=${timestamp}`} />
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
