import React from 'react';

/** Rende un testo tradotto in cui le parti tra **doppi asterischi** vanno in grassetto. */
export function RichText({ text, strongClassName }: { text: string; strongClassName?: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className={strongClassName}>{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
