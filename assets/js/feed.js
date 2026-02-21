/**
 * assets/js/feed.js
 * =================
 * ⚠️  LEGACY STUB — NOT IN USE
 *
 * This file was the original ES module RSS parser.
 * It was superseded by the equivalent logic embedded directly
 * in index.html as part of the IIFE script block.
 *
 * ES module exports at the bottom of this file cannot be consumed
 * when loading via file:// protocol (CORS restriction on modules).
 * (Self-Anneal SA-01, 2026-02-21)
 *
 * DO NOT import or require this file. Reference index.html instead.
 * Kept for reference only.
 *
 * Per gemini.md Article Schema:
 * { id, title, summary, url, source, source_label, published_at,
 *   fetched_at, image_url, tags, is_saved }
 */

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const CORS_PROXY_ALT = 'https://corsproxy.io/?';

const FEED_REGISTRY = [
    {
        source: 'bensbites',
        source_label: "Ben's Bites",
        url: 'https://bensbites.substack.com/feed',
        color: '#818cf8',
        icon: '🍔',
        description: 'AI tools, startups & investing insights',
    },
    {
        source: 'rundown_ai',
        source_label: 'The AI Rundown',
        url: 'https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml',
        color: '#fb923c',
        icon: '⚡',
        description: 'Daily AI news briefing for professionals',
    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeId(url) {
    // Simple hash from URL string
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

function stripHtml(html) {
    if (!html) return '';
    // Remove script/style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Remove Beehiiv template variables {{ ... }}
    text = text.replace(/\{\{.*?\}\}/g, '');
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = text;
    text = div.textContent || div.innerText || '';
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function truncate(text, length = 300) {
    if (text.length <= length) return text;
    return text.substring(0, length).replace(/\s+\S*$/, '') + '…';
}

function extractImage(itemEl) {
    // Check media:content
    const mediaContent = itemEl.querySelector('content[url]') ||
        itemEl.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0];
    if (mediaContent) {
        const url = mediaContent.getAttribute('url');
        if (url) return url;
    }
    // Check enclosure
    const enclosure = itemEl.querySelector('enclosure[type^="image"]');
    if (enclosure) return enclosure.getAttribute('url');
    // Parse from content HTML
    const contentEl = itemEl.querySelector('encoded') ||
        [...itemEl.children].find(el => el.tagName === 'CONTENT\\:ENCODED') ||
        itemEl.querySelector('[nodeName="content:encoded"]');
    const rawHtml = contentEl?.textContent || itemEl.querySelector('description')?.textContent || '';
    const imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
        const src = imgMatch[1];
        if (!src.includes('pixel') && !src.includes('track') && src.startsWith('http')) {
            return src;
        }
    }
    return null;
}

function parseDate(pubDateStr) {
    if (!pubDateStr) return null;
    const cleaned = pubDateStr.trim();
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d;
}

function parseRSS(xmlText, feedMeta) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'application/xml');
    const fetchedAt = new Date().toISOString();

    // Check for parse error
    if (xml.querySelector('parsererror')) {
        throw new Error('XML parse error in feed: ' + feedMeta.source_label);
    }

    const items = Array.from(xml.querySelectorAll('item'));
    const articles = [];

    for (const item of items) {
        const title = item.querySelector('title')?.textContent?.trim();
        const link = item.querySelector('link')?.textContent?.trim() ||
            item.querySelector('guid')?.textContent?.trim();

        if (!title || !link) continue;

        const articleId = makeId(link);
        const pubDateStr = item.querySelector('pubDate')?.textContent;
        const publishedDate = parseDate(pubDateStr);
        const publishedAt = publishedDate ? publishedDate.toISOString() : fetchedAt;

        // Get content for summary
        const contentEncoded = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0];
        const rawHtml = contentEncoded?.textContent || item.querySelector('description')?.textContent || '';
        const summary = truncate(stripHtml(rawHtml));
        const imageUrl = extractImage(item);

        // Tags
        const categories = Array.from(item.querySelectorAll('category'));
        const tags = categories.map(c => c.textContent.trim()).filter(Boolean);

        articles.push({
            id: articleId,
            title,
            summary,
            url: link,
            source: feedMeta.source,
            source_label: feedMeta.source_label,
            published_at: publishedAt,
            fetched_at: fetchedAt,
            image_url: imageUrl,
            tags,
            is_saved: false,
        });
    }

    return articles;
}

// ─── Fetch with CORS proxy ─────────────────────────────────────────────────

async function fetchFeedWithProxy(feedMeta, proxyUrl = CORS_PROXY) {
    const proxied = proxyUrl + encodeURIComponent(feedMeta.url);
    const res = await fetch(proxied, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} from proxy`);
    const data = await res.json();
    const xmlText = data.contents;
    if (!xmlText) throw new Error('Empty response from proxy');
    return parseRSS(xmlText, feedMeta);
}

async function fetchFeed(feedMeta) {
    // Try primary proxy, fall back to secondary
    try {
        return await fetchFeedWithProxy(feedMeta, CORS_PROXY);
    } catch (e) {
        console.warn(`Primary proxy failed for ${feedMeta.source_label}, trying fallback...`, e.message);
        try {
            return await fetchFeedWithProxy(feedMeta, CORS_PROXY_ALT);
        } catch (e2) {
            throw new Error(`Both proxies failed for ${feedMeta.source_label}: ${e2.message}`);
        }
    }
}

export { FEED_REGISTRY, fetchFeed };
