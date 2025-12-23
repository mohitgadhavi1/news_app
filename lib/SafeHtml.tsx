// SafeHTML.tsx


import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {


  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html),
      }}
    />
  );
}

export default SafeHTML;