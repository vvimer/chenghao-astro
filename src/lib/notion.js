import { Client } from '@notionhq/client';

const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });

export async function getPageBlocks(pageId) {
  const blocks = [];
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

function richTextToHtml(richTexts) {
  if (!richTexts) return '';
  return richTexts
    .map((rt) => {
      let text = escapeHtml(rt.plain_text || '');
      if (rt.annotations?.bold) text = `<strong>${text}</strong>`;
      if (rt.annotations?.italic) text = `<em>${text}</em>`;
      if (rt.annotations?.strikethrough) text = `<del>${text}</del>`;
      if (rt.annotations?.code) text = `<code>${text}</code>`;
      if (rt.annotations?.underline) text = `<u>${text}</u>`;
      if (rt.annotations?.color && rt.annotations.color !== 'default') {
        const color = rt.annotations.color;
        if (color.endsWith('_background')) {
          text = `<span style="background-color: var(--notion-${color.replace('_background', '')}-bg)">${text}</span>`;
        } else {
          text = `<span style="color: var(--notion-${color})">${text}</span>`;
        }
      }
      if (rt.href) text = `<a href="${escapeHtml(rt.href)}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function blocksToHtml(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const type = block.type;

    // Close list if switching away from list type
    if (listType && type !== 'bulleted_list_item' && type !== 'numbered_list_item') {
      html += listType === 'bulleted_list_item' ? '</ul>' : '</ol>';
      listType = null;
    }

    switch (type) {
      case 'paragraph':
        html += `<p>${richTextToHtml(block.paragraph.rich_text)}</p>`;
        break;

      case 'heading_1':
        html += `<h2>${richTextToHtml(block.heading_1.rich_text)}</h2>`;
        break;

      case 'heading_2':
        html += `<h3>${richTextToHtml(block.heading_2.rich_text)}</h3>`;
        break;

      case 'heading_3':
        html += `<h4>${richTextToHtml(block.heading_3.rich_text)}</h4>`;
        break;

      case 'bulleted_list_item':
        if (listType !== 'bulleted_list_item') {
          html += '<ul>';
          listType = 'bulleted_list_item';
        }
        html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>`;
        break;

      case 'numbered_list_item':
        if (listType !== 'numbered_list_item') {
          html += '<ol>';
          listType = 'numbered_list_item';
        }
        html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>`;
        break;

      case 'quote':
        html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
        break;

      case 'code':
        const lang = block.code.language || '';
        html += `<pre><code class="language-${lang}">${escapeHtml(
          block.code.rich_text.map((r) => r.plain_text).join('')
        )}</code></pre>`;
        break;

      case 'divider':
        html += '<hr />';
        break;

      case 'image':
        const imgUrl =
          block.image.type === 'external'
            ? block.image.external.url
            : block.image.file.url;
        const caption = block.image.caption?.length
          ? richTextToHtml(block.image.caption)
          : '';
        html += `<figure><img src="${escapeHtml(imgUrl)}" alt="${caption}" loading="lazy" />${
          caption ? `<figcaption>${caption}</figcaption>` : ''
        }</figure>`;
        break;

      case 'callout':
        const icon = block.callout.icon?.emoji || '💡';
        html += `<div class="callout"><span class="callout-icon">${icon}</span><div>${richTextToHtml(
          block.callout.rich_text
        )}</div></div>`;
        break;

      case 'toggle':
        html += `<details><summary>${richTextToHtml(block.toggle.rich_text)}</summary></details>`;
        break;

      case 'bookmark':
        const url = block.bookmark.url;
        html += `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></p>`;
        break;

      default:
        break;
    }
  }

  // Close any remaining list
  if (listType) {
    html += listType === 'bulleted_list_item' ? '</ul>' : '</ol>';
  }

  return html;
}
