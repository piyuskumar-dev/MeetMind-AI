import React from 'react';

/**
 * Tiny, dep-free markdown → React renderer.
 * Supports: fenced code blocks, ATX headers (#, ##, ###), ordered + unordered
 * lists, paragraphs, **bold**, `inline code`, hard line breaks.
 * Not a full CommonMark impl — covers what MeetMind surfaces (LLM summary,
 * action items, chat replies). Heavy markdown is better served by `marked`
 * if/when we add it.
 */


const _escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderInline = (text, keyPrefix) => {
  // Order matters: code first (so its content isn't re-parsed), then bold.
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
          className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono text-[0.85em] text-violet-600 dark:text-violet-300"
        >
          {t.value}
        </code>
      );
    }
    // bold
    const parts = t.value.split(/\*\*([^*]+)\*\*/g);
    return parts.map((p, j) =>
      j % 2 === 1 ? (
        <strong key={`${key}-b${j}`} className="font-semibold text-zinc-900 dark:text-zinc-100">
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
      <div key={idx} className="my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          <span>{block.lang || 'code'}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(block.content)}
            className="text-zinc-500 hover:text-violet-500 transition-colors"
          >
            copy
          </button>
        </div>
        <pre className="p-4 bg-zinc-950 text-zinc-200 overflow-x-auto text-xs font-mono leading-relaxed">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  if (block.type === 'h1') {
    return <h1 key={idx} className="text-lg font-bold mt-6 mb-3 text-zinc-900 dark:text-zinc-100 font-syne">{renderInline(block.text, `h1-${idx}`)}{cursor}</h1>;
  }
  if (block.type === 'h2') {
    return <h2 key={idx} className="text-base font-bold mt-5 mb-2 text-zinc-900 dark:text-zinc-100 font-syne">{renderInline(block.text, `h2-${idx}`)}{cursor}</h2>;
  }
  if (block.type === 'h3') {
    return <h3 key={idx} className="text-sm font-bold mt-4 mb-2 text-violet-600 dark:text-violet-300">{renderInline(block.text, `h3-${idx}`)}{cursor}</h3>;
  }
  if (block.type === 'ul') {
    return (
      <ul key={idx} className="list-disc pl-5 my-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
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
      <ol key={idx} className="list-decimal pl-5 my-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
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
    return <div key={idx} className="h-2" />;
  }
  // paragraph
  return (
    <p key={idx} className="text-sm leading-relaxed mb-2 text-zinc-700 dark:text-zinc-300">
      {renderInline(block.text, `p-${idx}`)}
      {cursor}
    </p>
  );
};

/** Parse markdown text into a block array. */
export const parseMarkdown = (text = '') => {
  if (!text) return [];

  // Split on fenced code blocks first.
  const segments = text.split(/(```[\w-]*\n[\s\S]*?```)/g);
  const blocks = [];

  for (const seg of segments) {
    if (!seg) continue;
    const fenceMatch = seg.match(/^```(\w[\w-]*)?\n([\s\S]*?)```$/);
    if (fenceMatch) {
      blocks.push({ type: 'code', lang: fenceMatch[1] || '', content: fenceMatch[2] });
      continue;
    }
    // Line-by-line parsing of the non-code segment.
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

/** Convenience render: text → React nodes. */
export const Markdown = ({ text, streaming = false }) => {
  const blocks = parseMarkdown(text);
  return (
    <div className="space-y-0.5">
      {blocks.map((b, i) => renderBlock(b, i, { streaming, isLast: i === blocks.length - 1 }))}
    </div>
  );
};

export default Markdown;
