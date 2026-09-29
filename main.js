// StreamVibe — Shared UI
// Home / Series / Movies / Recommended / Top Rated

(() => {
    'use strict';

    const PAGE_CONFIG = {
        home: {
            label: '📺 Total Titles',
            heading: null,
            sub: null,
            noResults: 'Sorry, nothing matched your search! 😅'
        },
        series: {
            label: '📜 Total Series',
            heading: '📜 Series',
            sub: 'Browse every TV series available on StreamVibe.',
            noResults: 'Sorry, nothing matched your search! 😅'
        },
        movies: {
            label: '🎬 Total Movies',
            heading: '🎬 Movies',
            sub: 'Feature films and one-shots, all in one place.',
            noResults: 'Sorry, no movie matched your search! 😅'
        },
        recommended: {
            label: '⭐ Recommended',
            heading: '⭐ Recommended For You',
            sub: 'Hand-picked titles worth your time.',
            noResults: 'Sorry, no recommended title matched your search! 😅'
        },
        top: {
            label: '🏆 Top Rated',
            heading: '🏆 Top Rated',
            sub: 'The highest rated titles on StreamVibe.',
            noResults: 'Sorry, no top title matched your search! 😅'
        }
    };

    const pageType = document.body.dataset.page || 'home';
    const config = PAGE_CONFIG[pageType] || PAGE_CONFIG.home;

    const animeGrid = document.getElementById('animeGrid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('no-results');
    const totalAnimeEl = document.getElementById('totalAnime');

    if (!animeGrid || !searchInput || !noResults || !totalAnimeEl) {
        console.warn('StreamVibe: required UI elements are missing.');
        return;
    }

    const pageIds = (window.PAGE_DATASETS && window.PAGE_DATASETS[pageType]) || (window.PAGE_DATASETS && window.PAGE_DATASETS.home) || [];
    const MEDIA_DATA = window.MEDIA_DATA || [];
    let currentData = pageIds.length
        ? pageIds.map(id => MEDIA_DATA.find(item => item.id === id)).filter(Boolean)
        : MEDIA_DATA.slice();

    window.currentAnimeData = currentData;
    window.animeData = currentData;

    let activeCategory = 'Show All';

    /* ---------------------------------------------------------
       Helpers
       --------------------------------------------------------- */
    function seasonsToNumber(seasons) {
        const n = parseInt(String(seasons || '').replace(/[^\d]/g, ''), 10);
        return Number.isNaN(n) ? 0 : n;
    }

    function ratingValue(anime) {
        const n = parseFloat(anime && anime.rating);
        return Number.isNaN(n) ? 0 : n;
    }

    function metaLine(anime) {
        if (anime.type === 'movie') {
            return `Movie • ${anime.releaseYear || ''}`.trim();
        }
        const count = Array.isArray(anime.episodes) ? anime.episodes.length : (anime.episodeCount || anime.episodes || 'N/A');
        return `TV Series • ${count} Episodes`;
    }

    function getFavorites() {
        try {
            const favorites = JSON.parse(localStorage.getItem('animeFavorites'));
            return Array.isArray(favorites) ? favorites : [];
        } catch {
            return [];
        }
    }

    function saveFavorites(favorites) {
        localStorage.setItem('animeFavorites', JSON.stringify(favorites));
    }

    function getWatchLater() {
        try {
            const list = JSON.parse(localStorage.getItem('animeWatchLater'));
            return Array.isArray(list) ? list : [];
        } catch {
            return [];
        }
    }

    function saveWatchLater(list) {
        localStorage.setItem('animeWatchLater', JSON.stringify(list));
    }

    function updateStats() {
        totalAnimeEl.textContent = currentData.length;
        const labelEl = document.getElementById('totalAnimeLabel');
        if (labelEl) labelEl.textContent = config.label;
    }

    function applyPageHeader() {
        const headingEl = document.getElementById('pageHeading');
        const subEl = document.getElementById('pageSub');
        if (headingEl && config.heading) headingEl.textContent = config.heading;
        if (subEl && config.sub) subEl.textContent = config.sub;
    }

    function openAnimeDetail(id) {
        const anime = currentData.find(item => item.id === id)
            || MEDIA_DATA.find(item => item.id === id);

        if (!anime) return;

        localStorage.setItem('selectedAnime', JSON.stringify(anime));
        window.location.href = `watch.html?id=${encodeURIComponent(id)}`;
    }

    /* ---------------------------------------------------------
       Card building (shared by grid + horizontal rows)
       --------------------------------------------------------- */
    function buildCard(anime, variant) {
        const favorites = getFavorites();
        const watchLater = getWatchLater();
        const genres = Array.isArray(anime.genres) ? anime.genres : [];
        const searchData = [
            anime.title, anime.searchName, anime.seasons, anime.releaseYear,
            anime.studio, ...genres
        ].filter(Boolean).join(' ');

        const isFavorite = favorites.includes(anime.id);
        const isWatchLater = watchLater.includes(anime.id);

        const card = document.createElement('div');
        card.className = variant === 'row' ? 'anime-card row-card' : 'anime-card';
        card.dataset.id = anime.id;
        card.dataset.search = searchData.toLowerCase();

        card.innerHTML = `
            <div class="card-media">
                <img src="${anime.img}" alt="${anime.title}" loading="lazy">

                <div class="rating-badge">
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ${anime.rating || 'N/A'}
                </div>

                <div class="card-actions">
                    <button class="icon-btn ${isFavorite ? 'active' : ''}" type="button" data-action="favorite" data-id="${anime.id}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${isFavorite ? '❤️' : '🤍'}</button>
                    <button class="icon-btn ${isWatchLater ? 'active' : ''}" type="button" data-action="watchlater" data-id="${anime.id}" aria-label="${isWatchLater ? 'Remove from watch later' : 'Add to watch later'}">${isWatchLater ? '🔖' : '📌'}</button>
                </div>

                <button class="detail-btn" type="button" data-action="details" data-id="${anime.id}" aria-label="Open ${anime.title}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                </button>
            </div>

            <div class="card-body">
                <h3 class="card-title">${anime.title}</h3>
                <p class="card-meta">${metaLine(anime)}</p>
            </div>
        `;

        return card;
    }

    function renderAnimeCards(data) {
        animeGrid.querySelectorAll('.anime-card').forEach(card => card.remove());
        const fragment = document.createDocumentFragment();
        data.forEach(anime => fragment.appendChild(buildCard(anime, 'grid')));
        animeGrid.insertBefore(fragment, noResults);
    }

    function renderRow(trackId, data) {
        const track = document.getElementById(trackId);
        if (!track) return;
        track.innerHTML = '';
        const fragment = document.createDocumentFragment();
        data.forEach(anime => fragment.appendChild(buildCard(anime, 'row')));
        track.appendChild(fragment);
    }

    function refreshCardStates() {
        const favorites = getFavorites();
        const watchLater = getWatchLater();
        document.querySelectorAll('.anime-card').forEach(card => {
            const id = card.dataset.id;
            const favBtn = card.querySelector('[data-action="favorite"]');
            const wlBtn = card.querySelector('[data-action="watchlater"]');
            if (favBtn) {
                const active = favorites.includes(id);
                favBtn.classList.toggle('active', active);
                favBtn.innerHTML = active ? '❤️' : '🤍';
            }
            if (wlBtn) {
                const active = watchLater.includes(id);
                wlBtn.classList.toggle('active', active);
                wlBtn.innerHTML = active ? '🔖' : '📌';
            }
        });
    }

    /* ---------------------------------------------------------
       Filtering (grid only)
       --------------------------------------------------------- */
    function applyFilters() {
        const term = searchInput.value.trim().toLowerCase();
        const cards = animeGrid.querySelectorAll('.anime-card');
        const favorites = getFavorites();
        const watchLater = getWatchLater();

        let visibleCount = 0;

        cards.forEach(card => {
            const searchData = card.dataset.search || '';
            const matchesSearch = !term || searchData.includes(term);

            let matchesCategory = true;

            if (activeCategory === 'Favorites') {
                matchesCategory = favorites.includes(card.dataset.id);
            } else if (activeCategory === 'Watch Later') {
                matchesCategory = watchLater.includes(card.dataset.id);
            } else if (activeCategory !== 'Show All') {
                matchesCategory = searchData.includes(activeCategory.toLowerCase());
            }

            const visible = matchesSearch && matchesCategory;
            card.classList.toggle('hidden', !visible);
            if (visible) visibleCount++;
        });

        if (visibleCount === 0) {
            noResults.style.display = 'block';
            if (activeCategory === 'Favorites') {
                noResults.textContent = '💔 You haven\'t added any titles to favorites yet!';
            } else if (activeCategory === 'Watch Later') {
                noResults.textContent = '📌 You haven\'t added any titles to watch later yet!';
            } else if (activeCategory !== 'Show All') {
                noResults.textContent = `Sorry, no titles of type "${activeCategory}" currently available! 😅`;
            } else {
                noResults.textContent = config.noResults;
            }
        } else {
            noResults.style.display = 'none';
        }
    }

    function toggleFavorite(animeId) {
        const favorites = getFavorites();
        const index = favorites.indexOf(animeId);
        if (index !== -1) favorites.splice(index, 1); else favorites.push(animeId);
        saveFavorites(favorites);
        refreshCardStates();
        applyFilters();
    }

    function toggleWatchLater(animeId) {
        const watchLater = getWatchLater();
        const index = watchLater.indexOf(animeId);
        if (index !== -1) watchLater.splice(index, 1); else watchLater.push(animeId);
        saveWatchLater(watchLater);
        refreshCardStates();
        applyFilters();
    }

    function toggleFilterDropdown() {
        const dropdown = document.getElementById('filterDropdown');
        const btn = document.getElementById('filterToggleBtn');
        if (!dropdown || !btn) return;
        dropdown.classList.toggle('active');
        btn.classList.toggle('active', dropdown.classList.contains('active'));
    }

    function filterCategory(type) {
        activeCategory = type;
        const dropdown = document.getElementById('filterDropdown');
        const btn = document.getElementById('filterToggleBtn');
        if (dropdown) dropdown.classList.remove('active');
        if (btn) btn.classList.remove('active');

        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.toggle('active-filter', b.dataset.filter === type);
        });

        applyFilters();
    }

    /* ---------------------------------------------------------
       Hero slider (home page only)
       --------------------------------------------------------- */
    function initHero() {
        const heroTrack = document.getElementById('heroTrack');
        const dotsWrap = document.getElementById('heroDots');
        if (!heroTrack || !dotsWrap) return;

        const slides = [...currentData].sort((a, b) => ratingValue(b) - ratingValue(a)).slice(0, 5);
        if (!slides.length) return;

        heroTrack.innerHTML = slides.map((anime, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                <div class="hero-bg" style="background-image:url('${anime.img}')"></div>
                <div class="hero-content">
                    <span class="hero-badge">${i === 0 ? '🔥 #1 Trending Now' : `⭐ ${anime.rating || 'N/A'} Rating`}</span>
                    <h1 class="hero-title">${anime.title}</h1>
                    <p class="hero-desc">${anime.studio ? `Produced by ${anime.studio}. ` : ''}${metaLine(anime)}${anime.releaseYear ? ' · ' + anime.releaseYear : ''}</p>
                    <div class="hero-btns">
                        <button class="btn-primary" type="button" data-hero-action="watch" data-id="${anime.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Watch Now
                        </button>
                        <button class="btn-secondary" type="button" data-hero-action="list" data-id="${anime.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            My List
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        dotsWrap.innerHTML = slides.map((_, i) => `<span class="hero-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></span>`).join('');

        let current = 0;
        let timer = null;

        function goTo(index) {
            current = (index + slides.length) % slides.length;
            heroTrack.querySelectorAll('.hero-slide').forEach((el, i) => el.classList.toggle('active', i === current));
            dotsWrap.querySelectorAll('.hero-dot').forEach((el, i) => el.classList.toggle('active', i === current));
        }

        function nextSlide() { goTo(current + 1); }
        function prevSlide() { goTo(current - 1); }

        function restartTimer() {
            clearInterval(timer);
            timer = setInterval(nextSlide, 6500);
        }

        document.getElementById('heroPrev')?.addEventListener('click', () => { prevSlide(); restartTimer(); });
        document.getElementById('heroNext')?.addEventListener('click', () => { nextSlide(); restartTimer(); });

        dotsWrap.addEventListener('click', event => {
            const dot = event.target.closest('.hero-dot');
            if (!dot) return;
            goTo(parseInt(dot.dataset.dot, 10));
            restartTimer();
        });

        heroTrack.addEventListener('click', event => {
            const btn = event.target.closest('[data-hero-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.dataset.heroAction === 'watch') {
                openAnimeDetail(id);
            } else {
                toggleFavorite(id);
            }
        });

        restartTimer();
    }

    /* ---------------------------------------------------------
       Curated rows (home page only)
       --------------------------------------------------------- */
    function initRows() {
        const sorted = [...currentData].sort((a, b) => ratingValue(b) - ratingValue(a));
        if (document.getElementById('trendingRow')) {
            renderRow('trendingRow', sorted.slice(0, 12));
        }
        if (document.getElementById('popularRow')) {
            const rest = sorted.slice(12, 12 + 40);
            const popular = [...rest].sort(() => Math.random() - 0.5).slice(0, 12);
            renderRow('popularRow', popular.length ? popular : sorted.slice(0, 12));
        }
    }

    function wireRowScrollers() {
        document.querySelectorAll('.row-wrapper').forEach(wrapper => {
            const track = wrapper.querySelector('.row-track');
            const prev = wrapper.querySelector('.row-scroll-btn.prev');
            const next = wrapper.querySelector('.row-scroll-btn.next');
            if (!track) return;
            prev?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
            next?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
        });
    }

    /* ---------------------------------------------------------
       Mobile sidebar
       --------------------------------------------------------- */
    function initMobileSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const hamburger = document.getElementById('hamburgerBtn');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !hamburger) return;

        function open() {
            sidebar.classList.add('mobile-open');
            overlay?.classList.add('show');
        }
        function close() {
            sidebar.classList.remove('mobile-open');
            overlay?.classList.remove('show');
        }

        hamburger.addEventListener('click', () => {
            sidebar.classList.contains('mobile-open') ? close() : open();
        });
        overlay?.addEventListener('click', close);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    /* ---------------------------------------------------------
       Generic dropdown toggles (notifications / profile-theme)
       --------------------------------------------------------- */
    function initDropdowns() {
        const triggers = document.querySelectorAll('[data-dropdown-trigger]');
        triggers.forEach(trigger => {
            const panel = document.getElementById(trigger.dataset.dropdownTrigger);
            if (!panel) return;
            trigger.addEventListener('click', event => {
                event.stopPropagation();
                const willShow = !panel.classList.contains('show');
                document.querySelectorAll('.dropdown-panel.show').forEach(p => p.classList.remove('show'));
                panel.classList.toggle('show', willShow);
            });
        });

        document.addEventListener('click', event => {
            document.querySelectorAll('.dropdown-panel.show').forEach(panel => {
                const trigger = document.querySelector(`[data-dropdown-trigger="${panel.id}"]`);
                const inside = panel.contains(event.target) || (trigger && trigger.contains(event.target));
                if (!inside) panel.classList.remove('show');
            });
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') document.querySelectorAll('.dropdown-panel.show').forEach(p => p.classList.remove('show'));
        });
    }

    /* ---------------------------------------------------------
       Global card click delegation (grid + all rows)
       --------------------------------------------------------- */
    document.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (button) {
            const id = button.dataset.id;
            if (!id) return;
            if (button.dataset.action === 'favorite') toggleFavorite(id);
            else if (button.dataset.action === 'watchlater') toggleWatchLater(id);
            else if (button.dataset.action === 'details') openAnimeDetail(id);
            return;
        }

        const card = event.target.closest('.anime-card');
        if (card && card.dataset.id) openAnimeDetail(card.dataset.id);
    });

    searchInput.addEventListener('input', applyFilters);

    document.addEventListener('click', event => {
        const wrapper = document.querySelector('.filter-wrapper');
        const dropdown = document.getElementById('filterDropdown');
        const btn = document.getElementById('filterToggleBtn');
        if (!wrapper || !dropdown || !btn) return;
        if (dropdown.classList.contains('active') && !wrapper.contains(event.target)) {
            dropdown.classList.remove('active');
            btn.classList.remove('active');
        }
    });

    window.seasonsToNumber = seasonsToNumber;
    window.updateStats = updateStats;
    window.openAnimeDetail = openAnimeDetail;
    window.renderAnimeCards = renderAnimeCards;
    window.toggleFavorite = toggleFavorite;
    window.toggleWatchLater = toggleWatchLater;
    window.toggleFilterDropdown = toggleFilterDropdown;
    window.filterCategory = filterCategory;
    window.applyAnimeFilters = applyFilters;

    applyPageHeader();
    renderAnimeCards(currentData);
    initHero();
    initRows();
    wireRowScrollers();
    initMobileSidebar();
    initDropdowns();
    updateStats();
    applyFilters();

    async function hydrateFromApi() {
        if (window.location.protocol === 'file:' || !window.normalizeAnimeDb) return;
        try {
            const response = await fetch('/api/db', { cache: 'no-store' });
            if (!response.ok) throw new Error('API ' + response.status);
            const db = await response.json();
            const liveData = window.normalizeAnimeDb(db);
            if (!Array.isArray(liveData) || !liveData.length) return;
            window.MEDIA_DATA = liveData;
            const liveIds = liveData.map(item => item.id);
            window.PAGE_DATASETS = {
                home: liveIds,
                series: liveData.filter(x => x.type === 'series').map(x => x.id),
                movies: liveData.filter(x => x.type === 'movie').map(x => x.id),
                recommended: liveData.filter(x => x.type === 'series').slice(0, 24).map(x => x.id),
                top: liveData.slice().sort((a,b) => (parseFloat(b.rating)||0) - (parseFloat(a.rating)||0)).slice(0,24).map(x => x.id)
            };
            currentData = liveData.filter(item => window.PAGE_DATASETS[pageType]?.includes(item.id));
            if (!currentData.length) currentData = liveData;
            window.currentAnimeData = currentData;
            window.animeData = currentData;
            renderAnimeCards(currentData);
            initHero();
            initRows();
            updateStats();
            applyFilters();
        } catch (error) {
            console.warn('Live JSON API unavailable; using bundled data.', error);
        }
    }
    hydrateFromApi();

    // Quick-links from the sidebar (My List / Watch Later) land here with a
    // ?filter= param so the grid opens pre-filtered.
    const urlFilter = new URLSearchParams(window.location.search).get('filter');
    if (urlFilter === 'favorites') filterCategory('Favorites');
    else if (urlFilter === 'watchlater') filterCategory('Watch Later');
    if (urlFilter) {
        setTimeout(() => animeGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
})();
