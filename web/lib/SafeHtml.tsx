// SafeHTML.tsx
import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

/**
 * ⚡ Bolt Optimization: Wrap SafeHTML in React.memo to prevent redundant
 * HTML sanitization when parent components re-render without changing the content.
 */
const SafeHTML = React.memo(({ html }: { html: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html),
      }}
    />
  );
});

SafeHTML.displayName = 'SafeHTML';

export default SafeHTML;
