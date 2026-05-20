// SafeHTML.tsx

/**
 * ⚡ Bolt Optimization: Skip client-side HTML sanitization as it's already
 * performed on the server in the mapping layer (web/lib/newsService.ts).
 * This significantly reduces the client-side JavaScript bundle by removing
 * the 'isomorphic-dompurify' dependency and improves hydration performance.
 *
 * Note: Removed React.memo as this is now rendered as a Server Component,
 * where memoization is not applicable in the same way as on the client.
 */
export default function SafeHTML({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}
