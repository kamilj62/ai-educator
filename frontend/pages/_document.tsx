import { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" 
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366F1" />
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
