(() => {
    'use strict';

    const search = document.getElementById('animeSearch');
    const form = document.getElementById('animeSearchForm');
    const input = document.getElementById('animeSearchInput');
    const button = document.getElementById('animeSearchButton');
    const results = document.getElementById('animeSearchResults');

    if (!search || !form || !input || !button || !results) return;

    const getData = () => Array.isArray(window.animeData) ? window.animeData : [];

    const normalize = (value) => String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const itemText = (item) => normalize([
        item.title,
        item.searchName,
        item.releaseYear,
        item.studio,
        ...(Array.isArray(item.genres) ? item.genres : [])
    ].join(' '));

    function openSearch() {
        search.classList.add('is-open');
        setTimeout(() => input.focus(), 120);
    }

    function closeSearch() {
        if (!input.value.trim()) {
            search.classList.remove('is-open');
            results.classList.remove('show');
            results.innerHTML = '';
        }
    }

    function goToAnime(item) {
        if (!item || !item.id) return;
        localStorage.setItem('selectedAnime', JSON.stringify(item));
        window.location.href = 'watch.html?id=' + encodeURIComponent(item.id);
    }

    function renderResults(term) {
        const query = normalize(term);
        const data = getData();

        if (!query) {
            results.innerHTML = '';
            results.classList.remove('show');
            return;
        }

        const matches = data.filter(item => itemText(item).includes(query)).slice(0, 8);

        if (!matches.length) {
            results.innerHTML = '<div class="search-empty">No results found</div>';
            results.classList.add('show');
            return;
        }

        results.innerHTML = matches.map((item, index) => `
            <button class="search-result" type="button" data-index="${index}">
                <img src="${item.img || ''}" alt="" loading="lazy">
                <span class="search-result-info">
                    <strong>${escapeHtml(item.title || 'Untitled')}</strong>
                    <small>${escapeHtml(item.releaseYear || 'N/A')} · ★ ${escapeHtml(item.rating || 'N/A')}</small>
                </span>
            </button>
        `).join('');

        results.classList.add('show');
        results.querySelectorAll('.search-result').forEach((el, index) => {
            el.addEventListener('click', () => goToAnime(matches[index]));
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    button.addEventListener('click', (event) => {
        event.preventDefault();
        if (!search.classList.contains('is-open')) openSearch();
        else input.focus();
    });

    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('focus', () => {
        search.classList.add('is-open');
        if (input.value.trim()) renderResults(input.value);
    });
    input.addEventListener('blur', () => setTimeout(closeSearch, 180));

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const first = results.querySelector('.search-result');
        if (first) first.click();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            input.value = '';
            results.innerHTML = '';
            results.classList.remove('show');
            search.classList.remove('is-open');
            input.blur();
        }
    });
})();
