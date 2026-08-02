import React from 'react';

/**
 * Tiny, dep-free markdown → React renderer.
 * Supports: fenced code blocks, ATX headers (#, ##, ###), ordered + unordered
 * lists, paragraphs, **bold**, `inline code`, hard line breaks.
 */

const renderInline = (text, keyPrefix) => {
  const tokens = [];
  const codeRe = /`([^`\n]+)`/g;
  let lastIndex = 0;
  let match;
  while ((match = codeRe.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    tokens.push({ type: 'code', value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', value: text.slice(lastIndex) });

  return tokens.map((t, i) => {
    const key = `${keyPrefix}-${i}`;
    if (t.type === 'code') {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.82em] font-medium text-indigo-600 dark:text-indigo-300 border border-slate-200/60 dark:border-slate-700/60"
        >
          {t.value}
        </code>
      );
    }
    // bold
    const parts = t.value.split(/\*\*([^*]+)\*\*/g);
    return parts.map((p, j) =>
      j % 2 === 1 ? (
        <strong key={`${key}-b${j}`} className="font-semibold text-slate-900 dark:text-slate-100">
          {p}
        </strong>
      ) : (
        <React.Fragment key={`${key}-t${j}`}>{p}</React.Fragment>
      )
    );
  });
};

const renderBlock = (block, idx, opts = {}) => {
  const { streaming = false, isLast = false } = opts;
  const cursor = streaming && isLast ? <span className="streaming-cursor" /> : null;

  if (block.type === 'code') {
    return (
      <div key={idx} className="my-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
        <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          <span>{block.lang || 'code'}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(block.content)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="p-3.5 bg-slate-950 text-slate-200 overflow-x-auto text-xs font-mono leading-relaxed select-text">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  if (block.type === 'h1') {
    return <h1 key={idx} className="text-base font-semibold mt-4 mb-2 text-slate-900 dark:text-white tracking-tight">{renderInline(block.text, `h1-${idx}`)}{cursor}</h1>;
  }
  if (block.type === 'h2') {
    return <h2 key={idx} className="text-sm font-semibold mt-3.5 mb-1.5 text-slate-900 dark:text-white tracking-tight">{renderInline(block.text, `h2-${idx}`)}{cursor}</h2>;
  }
  if (block.type === 'h3') {
    return <h3 key={idx} className="text-xs font-semibold mt-3 mb-1 text-indigo-600 dark:text-indigo-400 tracking-tight">{renderInline(block.text, `h3-${idx}`)}{cursor}</h3>;
  }
  if (block.type === 'ul') {
    return (
      <ul key={idx} className="list-disc pl-4 my-2 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        {block.items.map((it, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(it, `ul-${idx}-${i}`)}
            {streaming && isLast && i === block.items.length - 1 ? cursor : null}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === 'ol') {
    return (
      <ol key={idx} className="list-decimal pl-4 my-2 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        {block.items.map((it, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(it, `ol-${idx}-${i}`)}
            {streaming && isLast && i === block.items.length - 1 ? cursor : null}
          </li>
        ))}
      </ol>
    );
  }
  if (block.type === 'blank') {
    return <div key={idx} className="h-1.5" />;
  }
  // paragraph
  return (
    <p key={idx} className="text-xs sm:text-sm leading-relaxed mb-2 text-slate-700 dark:text-slate-300">
      {renderInline(block.text, `p-${idx}`)}
      {cursor}
    </p>
  );
};

export const parseMarkdown = (text = '') => {
  if (!text) return [];

  const segments = text.split(/(```[\w-]*\n[\s\S]*?```)/g);
  const blocks = [];

  for (const seg of segments) {
    if (!seg) continue;
    const fenceMatch = seg.match(/^```(\w[\w-]*)?\n([\s\S]*?)```$/);
    if (fenceMatch) {
      blocks.push({ type: 'code', lang: fenceMatch[1] || '', content: fenceMatch[2] });
      continue;
    }
    const lines = seg.split('\n');
    let para = '';
    let ul = [];
    let ol = [];

    const flushPara = () => {
      if (para.trim()) blocks.push({ type: 'p', text: para.trim() });
      para = '';
    };
    const flushUl = () => {
      if (ul.length) blocks.push({ type: 'ul', items: ul });
      ul = [];
    };
    const flushOl = () => {
      if (ol.length) blocks.push({ type: 'ol', items: ol });
      ol = [];
    };

    for (const line of lines) {
      if (line.startsWith('### ')) {
        flushPara(); flushUl(); flushOl();
        blocks.push({ type: 'h3', text: line.slice(4) });
      } else if (line.startsWith('## ')) {
        flushPara(); flushUl(); flushOl();
        blocks.push({ type: 'h2', text: line.slice(3) });
      } else if (line.startsWith('# ')) {
        flushPara(); flushUl(); flushOl();
        blocks.push({ type: 'h1', text: line.slice(2) });
      } else if (/^\s*[-*]\s+/.test(line)) {
        flushPara(); flushOl();
        ul.push(line.replace(/^\s*[-*]\s+/, ''));
      } else if (/^\s*\d+\.\s+/.test(line)) {
        flushPara(); flushUl();
        ol.push(line.replace(/^\s*\d+\.\s+/, ''));
      } else if (!line.trim()) {
        flushPara(); flushUl(); flushOl();
        blocks.push({ type: 'blank' });
      } else {
        flushUl(); flushOl();
        para += (para ? ' ' : '') + line;
      }
    }
    flushPara(); flushUl(); flushOl();
  }

  return blocks;
};

export const Markdown = ({ text, streaming = false }) => {
  const blocks = parseMarkdown(text);
  return (
    <div className="space-y-0.5">
      {blocks.map((b, i) => renderBlock(b, i, { streaming, isLast: i === blocks.length - 1 }))}
    </div>
  );
};

export default Markdown;

