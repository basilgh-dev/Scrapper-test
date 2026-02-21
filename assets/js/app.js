/**
 * assets/js/app.js
 * ================
 * ⚠️  LEGACY STUB — NOT IN USE
 *
 * This file was the original ES module version of the app.
 * It was superseded by a single IIFE <script> block embedded directly
 * in index.html to work on the file:// protocol without a dev server.
 *
 * ES module imports (see line below) are blocked by browsers when
 * loading via file://, which caused a CORS error during Phase 1 testing.
 * (Self-Anneal SA-01, 2026-02-21)
 *
 * DO NOT import or require this file. Reference index.html instead.
 * Kept for reference only.
 */

import { FEED_REGISTRY, fetchFeed } from './feed.js';

// ─── Constants ─────────────────────────────────────────────────────────────

const STORAGE_CACHE_KEY = 'scruper_cache';
const STORAGE_SAVED_KEY = 'scruper_saved';
const STORAGE_LAST_FETCH_KEY = 'scruper_last_fetch';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── State ─────────────────────────────────────────────────────────────────

const state = {
    articles: [],      // All articles in cache
    savedIds: new Set(), // Set of saved article IDs
    activeTab: 'all',  // Current tab
    loading: {},       // { [source]: 'loading' | 'loaded' | 'error' }
    errors: {},        // { [source]: errorMessage }
    lastFetch: null,   // Date object
};

// ─── LocalStorage ──────────────────────────────────────────────────────────

function loadFromStorage() {
    try {
        const cache = JSON.parse(localStorage.getItem(STORAGE_CACHE_KEY) || '{}');
        const savedIds = JSON.parse(localStorage.getItem(STORAGE_SAVED_KEY) || '[]');
        const lastFetch = localStorage.getItem(STORAGE_LAST_FETCH_KEY);
        state.articles = cache.articles || [];
        state.savedIds = new Set(savedIds);
        state.lastFetch = lastFetch ? new Date(lastFetch) : null;
    } catch (e) {
        console.error('Failed to load from storage:', e);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify({ articles: state.articles }));
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify([...state.savedIds]));
        localStorage.setItem(STORAGE_LAST_FETCH_KEY, state.lastFetch?.toISOString() || '');
    } catch (e) {
        console.error('Failed to save to storage:', e);
    }
}

// ─── Data Logic ────────────────────────────────────────────────────────────

function mergeArticles(existing, newArticles) {
    const map = new Map(existing.map(a => [a.id, a]));
    for (const article of newArticles) {
        if (map.has(article.id)) {
            // Preserve saved state
            article.is_saved = map.get(article.id).is_saved;
        }
        map.set(article.id, article);
    }
    return [...map.values()].sort(
        (a, b) => new Date(b.published_at) - new Date(a.published_at)
    );
}

function isWithin24h(article) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(article.published_at).getTime() >= cutoff;
}

function getFilteredArticles() {
    const tab = state.activeTab;
    if (tab === 'saved') {
        return state.articles.filter(a => state.savedIds.has(a.id));
    }
    const fresh = state.articles.filter(a => isWithin24h(a) || state.savedIds.has(a.id));
    if (tab === 'all') return fresh;
    return fresh.filter(a => a.source === tab);
}

function shouldRefetch() {
    if (!state.lastFetch) return true;
    return Date.now() - state.lastFetch.getTime() > REFRESH_INTERVAL_MS;
}

// ─── Fetch Logic ───────────────────────────────────────────────────────────

async function fetchAllFeeds(force = false) {
    if (!force && !shouldRefetch()) {
        console.log('Cache is fresh, skipping fetch');
        return;
    }

    setGlobalLoading(true);

    // Mark all feeds as loading
    for (const feed of FEED_REGISTRY) {
        state.loading[feed.source] = 'loading';
        state.errors[feed.source] = null;
    }
    renderSourceStatus();

    const promises = FEED_REGISTRY.map(async (feed) => {
        try {
            const articles = await fetchFeed(feed);
            state.loading[feed.source] = 'loaded';
            state.articles = mergeArticles(state.articles, articles);
            console.log(`✓ ${feed.source_label}: ${articles.length} articles`);
        } catch (e) {
            state.loading[feed.source] = 'error';
            state.errors[feed.source] = e.message;
            console.error(`✗ ${feed.source_label}:`, e);
        }
        renderSourceStatus();
        renderArticles();
        saveToStorage();
    });

    await Promise.allSettled(promises);

    state.lastFetch = new Date();
    saveToStorage();
    setGlobalLoading(false);
    updateLastFetchTime();
}

// ─── UI: Toggle Save ───────────────────────────────────────────────────────

function toggleSave(articleId) {
    if (state.savedIds.has(articleId)) {
        state.savedIds.delete(articleId);
        // Update article
        const article = state.articles.find(a => a.id === articleId);
        if (article) article.is_saved = false;
    } else {
        state.savedIds.add(articleId);
        const article = state.articles.find(a => a.id === articleId);
        if (article) article.is_saved = true;
    }
    saveToStorage();
    renderArticles();
}

// ─── Formatters ────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatAbsTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

// ─── Render: Article Card ──────────────────────────────────────────────────

function articleCardHTML(article) {
    const isSaved = state.savedIds.has(article.id);
    const feedMeta = FEED_REGISTRY.find(f => f.source === article.source);
    const color = feedMeta?.color || '#6366f1';
    const icon = feedMeta?.icon || '📰';
    const saveBtnClass = isSaved ? 'save-btn saved' : 'save-btn';
    const saveIcon = isSaved ? '★' : '☆';
    const saveLabel = isSaved ? 'Saved' : 'Save';

    const imageHtml = article.image_url
        ? `<div class="card-image">
        <img src="${article.image_url}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
       </div>`
        : '';

    const tagsHtml = article.tags?.length
        ? `<div class="card-tags">${article.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</div>`
        : '';

    return `
    <article class="article-card" data-id="${article.id}" data-source="${article.source}">
      ${imageHtml}
      <div class="card-body">
        <div class="card-header">
          <span class="source-badge" style="--source-color: ${color}">
            ${icon} ${article.source_label}
          </span>
          <span class="card-time" title="${formatAbsTime(article.published_at)}">
            ${timeAgo(article.published_at)}
          </span>
        </div>
        <h2 class="card-title">
          <a href="${article.url}" target="_blank" rel="noopener noreferrer">
            ${article.title}
          </a>
        </h2>
        ${article.summary ? `<p class="card-summary">${article.summary}</p>` : ''}
        ${tagsHtml}
        <div class="card-footer">
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more-btn">
            Read Article →
          </a>
          <button 
            class="${saveBtnClass}" 
            data-id="${article.id}"
            aria-label="${saveLabel} article"
            title="${saveLabel}"
          >
            <span class="save-icon">${saveIcon}</span>
            <span class="save-label">${saveLabel}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

// ─── Render: Articles Grid ─────────────────────────────────────────────────

function renderArticles() {
    const grid = document.getElementById('articles-grid');
    const emptyState = document.getElementById('empty-state');
    const articles = getFilteredArticles();

    if (articles.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'flex';
        updateTabCounts();
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = articles.map(articleCardHTML).join('');

    // Attach save button listeners
    grid.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            toggleSave(id);
            // Button animation
            btn.classList.add('bounce');
            setTimeout(() => btn.classList.remove('bounce'), 400);
        });
    });

    // Animate cards in
    const cards = grid.querySelectorAll('.article-card');
    cards.forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
        card.classList.add('animate-in');
    });

    updateTabCounts();
}

// ─── Render: Source Status Pills ───────────────────────────────────────────

function renderSourceStatus() {
    const container = document.getElementById('source-status');
    if (!container) return;
    container.innerHTML = FEED_REGISTRY.map(feed => {
        const status = state.loading[feed.source] || 'idle';
        const error = state.errors[feed.source];
        const count = state.articles.filter(a => a.source === feed.source && isWithin24h(a)).length;

        let statusClass = 'status-idle';
        let statusText = '—';
        if (status === 'loading') { statusClass = 'status-loading'; statusText = '●'; }
        else if (status === 'loaded') { statusClass = 'status-ok'; statusText = `${count} articles`; }
        else if (status === 'error') { statusClass = 'status-error'; statusText = 'Error'; }

        return `
      <div class="source-pill ${statusClass}" title="${error || feed.description}">
        <span class="source-icon">${feed.icon}</span>
        <span class="source-name">${feed.source_label}</span>
        <span class="source-count">${statusText}</span>
        ${status === 'error' ? `<button class="retry-btn" data-source="${feed.source}">↻</button>` : ''}
      </div>
    `;
    }).join('');

    // Retry buttons
    container.querySelectorAll('.retry-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            fetchAllFeeds(true);
        });
    });
}

// ─── Render: Tabs ──────────────────────────────────────────────────────────

function updateTabCounts() {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;

    const counts = {
        all: state.articles.filter(a => new Date(a.published_at).getTime() >= cutoff).length,
        saved: state.savedIds.size,
    };
    for (const feed of FEED_REGISTRY) {
        counts[feed.source] = state.articles.filter(
            a => a.source === feed.source && new Date(a.published_at).getTime() >= cutoff
        ).length;
    }

    document.querySelectorAll('[data-tab]').forEach(tab => {
        const key = tab.dataset.tab;
        const badge = tab.querySelector('.tab-count');
        if (badge && counts[key] !== undefined) {
            badge.textContent = counts[key];
            badge.style.display = counts[key] > 0 ? 'inline-flex' : 'none';
        }
    });
}

function setActiveTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    renderArticles();
}

// ─── Render: Meta ──────────────────────────────────────────────────────────

function updateLastFetchTime() {
    const el = document.getElementById('last-fetch-time');
    if (!el) return;
    if (state.lastFetch) {
        el.textContent = `Last updated: ${timeAgo(state.lastFetch.toISOString())}`;
    } else {
        el.textContent = 'Not yet fetched';
    }
}

function setGlobalLoading(isLoading) {
    const btn = document.getElementById('refresh-btn');
    if (!btn) return;
    btn.classList.toggle('spinning', isLoading);
    btn.disabled = isLoading;
}

// ─── Init ──────────────────────────────────────────────────────────────────

function init() {
    // Load persisted state
    loadFromStorage();

    // Initial render from cache
    renderSourceStatus();
    renderArticles();
    updateLastFetchTime();

    // Set up tab navigation
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        fetchAllFeeds(true);
    });

    // Kick off fetch
    fetchAllFeeds();

    // Auto-refresh every 24h while page is open
    setInterval(() => fetchAllFeeds(), REFRESH_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', init);
