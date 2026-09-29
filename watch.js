const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

function findAnime(id) {
    const data = window.MEDIA_DATA || [];
    return data.find(item => item.id === id || item.jsonId === id);
}

if (!animeId) {
    window.location.href = 'index.html';
} else {
    const anime = findAnime(animeId) || JSON.parse(localStorage.getItem('selectedAnime') || 'null');
    if (!anime) {
        document.body.innerHTML = '<main style="padding:40px;color:#fff;font-family:system-ui">Anime not found. Return to home and choose an anime again.</main>';
        throw new Error('Anime not found: ' + animeId);
    }

    localStorage.setItem('selectedAnime', JSON.stringify(anime));

    const videoPlayer = document.getElementById('videoPlayer');
    const videoPlayerNative = document.getElementById('videoPlayerNative');
    const videoWrapper = document.getElementById('videoWrapper');
    const videoPosterImage = document.getElementById('videoPosterImage');
    const episodesTrack = document.getElementById('episodesTrack');
    const episodesViewport = document.getElementById('episodesViewport');
    const coverImage = document.getElementById('coverImage');
    const profileImage = document.getElementById('profileImage');
    const mainEl = document.querySelector('main');
    const modal = document.getElementById('episodeModal');
    const modalGrid = document.getElementById('modalGrid');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const watchLaterBtn = document.getElementById('headerWatchLaterBtn');
    const tabsContainer = document.getElementById('watchTabsContainer');
    const serverList = document.getElementById('serverList');

    const quoteEnglishEl = document.getElementById('quoteEnglish');
    const quoteArabicEl = document.getElementById('quoteArabic');

    const title = anime.title || 'Anime';
    const image = anime.img || anime.poster || '';
    const isMovie = anime.type === 'movie' || anime.type === 'Movie';

    document.getElementById('animeTitle').textContent = title;
    document.getElementById('animeDesc').textContent =
        anime.description || (anime.fullStory && anime.fullStory[0] && anime.fullStory[0].content) || 'No description available.';

    const episodeArray = Array.isArray(anime.episodes) ? anime.episodes : [];
    const episodeCount = anime.episodeCount || episodeArray.length;
    document.getElementById('metaChips').innerHTML = `
        <div class="chip"><span class="chip-icon">📅</span><span class="value">${anime.releaseYear || 'N/A'}</span></div>
        <div class="chip"><span class="chip-icon">🛡</span><span class="value red">${anime.classification || 'General'}</span></div>
        <div class="chip"><span class="chip-icon">🎬</span><span class="value purple">${isMovie ? 'Movie' : (episodeCount || 'N/A') + ' Episodes'}</span></div>
        <div class="chip"><span class="chip-icon">📺</span><span class="value">${isMovie ? 'Movie' : (anime.seasons || '1 Season')}</span></div>
        <div class="chip"><span class="chip-icon">★</span><span class="value gold">${anime.rating || 'N/A'}${anime.rating ? ' / 10' : ''}</span></div>
        <div class="chip"><span class="chip-icon">🏢</span><span class="value">${anime.studio || 'N/A'}</span></div>`;

    document.getElementById('genreList').innerHTML = (anime.genres || []).map(g => `<div class="genre">${g}</div>`).join('');
    if (coverImage) { coverImage.src = image; coverImage.alt = title; }
    if (videoPosterImage) { videoPosterImage.src = image; videoPosterImage.alt = title; }
    if (profileImage) { profileImage.src = image; profileImage.alt = title; }

    function updateQuote() {
        let en = "The world isn't perfect. But it's worth fighting for.";
        let ar = 'العالم ليس مثالياً، لكنه يستحق القتال من أجله.';
        if (Array.isArray(anime.quotes) && anime.quotes.length) {
            const q = anime.quotes[Math.floor(Math.random() * anime.quotes.length)];
            en = q.en || en; ar = q.ar || ar;
        }
        if (quoteEnglishEl) quoteEnglishEl.textContent = `“${en}”`;
        if (quoteArabicEl) quoteArabicEl.textContent = `“${ar}”`;
    }
    updateQuote();

    function normalizeServer(s, index) {
        if (typeof s === 'string') return { name: `Server ${index + 1}`, embed_url: s };
        if (!s || typeof s !== 'object') return null;
        const url = s.embed_url || s.url || s.link || s.src || '';
        if (!url) return null;
        return { ...s, name: s.name || `Server ${index + 1}`, embed_url: url };
    }

    function normalizeEpisode(item, index) {
        if (typeof item === 'string') {
            return { id: `${anime.id}-ep-${index + 1}`, url: item, title: `Episode ${index + 1}`, image, servers: [normalizeServer(item, 0)] };
        }
        const ep = item && typeof item === 'object' ? { ...item } : {};
        const direct = ep.url || ep.video || ep.link || ep.src || '';
        let servers = Array.isArray(ep.servers) ? ep.servers.map(normalizeServer).filter(Boolean) : [];
        if (!servers.length && direct) servers = [normalizeServer(direct, 0)];
        return {
            ...ep,
            id: ep.id || `${anime.id}-ep-${index + 1}`,
            url: direct || (servers[0] && servers[0].embed_url) || '',
            title: ep.title || ep.name || `Episode ${index + 1}`,
            image: ep.image || ep.img || image,
            servers
        };
    }

    function getSeasonData() {
        if (anime.episodesData && typeof anime.episodesData === 'object') return anime.episodesData;
        if (Array.isArray(anime.episodes) && anime.episodes.length) return { 'Season 1': anime.episodes };
        if (isMovie && Array.isArray(anime.servers) && anime.servers.length) {
            return { Movie: [{ id: `${anime.id}-movie`, title: title, url: '', image, servers: anime.servers }] };
        }
        if (anime.video && Array.isArray(anime.video) && anime.video.length) return { 'Season 1': anime.video };
        return {};
    }

    const seasonData = getSeasonData();
    const seasonNames = Object.keys(seasonData);
    let currentSeason = seasonNames[0] || 'Season 1';
    let currentView = 'episodes';
    let currentEpisode = null;
    let currentServer = null;
    let episodeOffset = 0;
    let seasonOffset = 0;

    function getEpisodes(seasonName) {
        const raw = seasonData[seasonName];
        if (Array.isArray(raw)) return raw.map(normalizeEpisode).filter(e => e.url || e.servers.length);
        if (raw && typeof raw === 'object') return Object.values(raw).map(normalizeEpisode).filter(e => e.url || e.servers.length);
        return [];
    }

    function isDirectVideoFile(url) { return /\.(mp4|webm|m3u8)($|\?)/i.test(url) && !/drive\.google\.com/i.test(url); }
    function toEmbedUrl(url) {
        const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
        return m ? `https://drive.google.com/file/d/${m[1]}/preview` : url;
    }

    function renderServers(episode) {
        if (!serverList) return;
        const servers = (episode && episode.servers) || [];
        if (!servers.length) {
            serverList.innerHTML = '<div class="server-empty">No servers are available for this episode.</div>';
            return;
        }
        serverList.innerHTML = `
            <div class="server-title"><span>Servers</span><small>${servers.length} available</small></div>
            <div class="server-buttons">${servers.map((s, i) => `
                <button type="button" class="server-btn ${i === 0 ? 'active' : ''}" data-server-index="${i}">
                    <span>${s.name || `Server ${i + 1}`}</span>
                </button>`).join('')}</div>`;
        serverList.querySelectorAll('.server-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const server = servers[Number(btn.dataset.serverIndex)];
                serverList.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                playServer(server, true);
            });
        });
    }

    function playServer(server, keepScroll = false) {
        if (!server) return;
        const url = server.embed_url || server.url || server.link || '';
        if (!url) return;
        currentServer = server;
        if (isDirectVideoFile(url)) {
            videoPlayer.removeAttribute('src');
            videoPlayer.style.display = 'none';
            videoPlayerNative.style.display = 'block';
            videoPlayerNative.src = url;
            videoPlayerNative.muted = true;
            videoPlayerNative.play().catch(() => {});
        } else {
            videoPlayerNative.pause();
            videoPlayerNative.removeAttribute('src');
            videoPlayerNative.style.display = 'none';
            videoPlayer.style.display = 'block';
            const embed = toEmbedUrl(url);
            videoPlayer.src = embed;
        }
        videoWrapper?.classList.add('has-video');
        if (!keepScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function playEpisode(episode, keepScroll = false) {
        if (!episode) return;
        currentEpisode = episode;
        renderServers(episode);
        const first = episode.servers && episode.servers[0];
        if (first) playServer(first, keepScroll);
        else if (episode.url) playServer({ name: 'Direct', embed_url: episode.url }, keepScroll);
    }

    function renderTrailerTabs() {
        if (!tabsContainer) return;
        const videos = Array.isArray(anime.video) ? anime.video.filter(v => v && v.url) : [];
        tabsContainer.innerHTML = videos.map((v,i) => `<button class="watch-tab ${i===0?'active':''}" type="button" data-video-index="${i}">${v.label || `Video ${i+1}`}</button>`).join('');
        tabsContainer.querySelectorAll('.watch-tab').forEach(btn => btn.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.watch-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
            playServer({name: btn.textContent, embed_url: videos[Number(btn.dataset.videoIndex)].url});
        }));
    }
    renderTrailerTabs();

    function renderSeasons() {
        if (!seasonNames.length) { episodesTrack.innerHTML = '<div class="episode-empty">No seasons available.</div>'; return; }
        episodesTrack.innerHTML = seasonNames.map((s,i) => `<article class="episode-card season-card ${s===currentSeason?'active':''}" data-season="${i}"><div class="episode-thumb season-thumb"><div class="season-icon">📺</div><span class="season-episode-count">${getEpisodes(s).length} Episodes</span><span class="episode-play">▶</span></div><div class="episode-info"><div class="episode-number">${s}</div><div class="episode-name">${getEpisodes(s).length} Episodes</div></div></article>`).join('');
        episodesTrack.querySelectorAll('.season-card').forEach(card => card.addEventListener('click', () => { currentSeason=seasonNames[Number(card.dataset.season)]; currentView='episodes'; renderEpisodes(); }));
        updateTrackOffset(true);
    }

    function renderEpisodes() {
        const episodes = getEpisodes(currentSeason);
        if (!episodes.length) { episodesTrack.innerHTML = `<div class="episode-empty">No episodes available for ${currentSeason}.</div>`; renderServers(null); return; }
        episodesTrack.innerHTML = episodes.map((ep,i) => `<article class="episode-card ${currentEpisode && currentEpisode.id===ep.id ? 'active' : (!currentEpisode && i===0 ? 'active':'')}" data-index="${i}"><div class="episode-thumb"><img src="${ep.image || image}" alt="${ep.title}" loading="lazy"><span class="episode-play">▶</span></div><div class="episode-info"><div class="episode-number">Episode ${i+1}</div><div class="episode-name">${ep.title}</div><div class="episode-server-count">${ep.servers.length} server${ep.servers.length===1?'':'s'}</div></div></article>`).join('');
        episodesTrack.querySelectorAll('.episode-card').forEach(card => card.addEventListener('click', () => {
            const ep=episodes[Number(card.dataset.index)]; episodesTrack.querySelectorAll('.episode-card').forEach(c=>c.classList.remove('active')); card.classList.add('active'); playEpisode(ep);
        }));
        updateTrackOffset(false);
        if (!currentEpisode) playEpisode(episodes[0], true);
    }

    function updateTrackOffset(seasons=false) {
        const cards=episodesTrack.querySelectorAll('.episode-card'); if(!cards.length) return;
        const w=cards[0].getBoundingClientRect().width+16, viewport=episodesViewport.clientWidth, max=Math.max(0,episodesTrack.scrollWidth-viewport), idx=Math.ceil(max/w);
        if(seasons){seasonOffset=Math.min(seasonOffset,idx); episodesTrack.style.transform=`translateX(-${seasonOffset*w}px)`;} else {episodeOffset=Math.min(episodeOffset,idx); episodesTrack.style.transform=`translateX(-${episodeOffset*w}px)`;}
    }

    document.getElementById('episodeNext')?.addEventListener('click', () => { const cards=episodesTrack.querySelectorAll('.episode-card'); if(!cards.length)return; const w=cards[0].getBoundingClientRect().width+16,max=Math.max(0,episodesTrack.scrollWidth-episodesViewport.clientWidth),idx=Math.ceil(max/w); if(currentView==='episodes')episodeOffset=Math.min(episodeOffset+1,idx); else seasonOffset=Math.min(seasonOffset+1,idx); episodesTrack.style.transform=`translateX(-${(currentView==='episodes'?episodeOffset:seasonOffset)*w}px)`; });
    document.getElementById('episodePrev')?.addEventListener('click', () => { if(currentView==='episodes')episodeOffset=Math.max(0,episodeOffset-1); else seasonOffset=Math.max(0,seasonOffset-1); updateTrackOffset(currentView==='seasons'); });

    document.getElementById('watchNowBtn')?.addEventListener('click', () => playEpisode(getEpisodes(currentSeason)[0]));
    document.getElementById('seasonsBtn')?.addEventListener('click', () => { currentView=currentView==='episodes'?'seasons':'episodes'; const b=document.getElementById('seasonsBtn'); b.textContent=currentView==='seasons'?'▱ Episodes':'▱ Seasons'; b.classList.toggle('active',currentView==='seasons'); currentView==='seasons'?renderSeasons():renderEpisodes(); });
    document.getElementById('downloadBtn')?.addEventListener('click', () => { const ep=currentEpisode || getEpisodes(currentSeason)[0]; const url=(currentServer&&currentServer.embed_url)||ep?.url||anime.download||anime.url; if(url) window.open(url,'_blank','noopener,noreferrer'); });

    function updateWatchLaterButton(){ if(!watchLaterBtn)return; const list=JSON.parse(localStorage.getItem('animeWatchLater')||'[]'); const yes=list.includes(anime.id); watchLaterBtn.classList.toggle('active',yes); watchLaterBtn.innerHTML=`<span class="bookmark-icon">🔖</span><span class="header-watch-text">${yes?'Added':'Watch Later'}</span>`; }
    watchLaterBtn?.addEventListener('click',()=>{let list=JSON.parse(localStorage.getItem('animeWatchLater')||'[]'); if(list.includes(anime.id))list=list.filter(x=>x!==anime.id);else list.push(anime.id);localStorage.setItem('animeWatchLater',JSON.stringify(list));updateWatchLaterButton();}); updateWatchLaterButton();

    function openModal(){const eps=getEpisodes(currentSeason);if(!eps.length)return;modalGrid.innerHTML=eps.map((e,i)=>`<div class="modal-episode-card" data-index="${i}"><div class="modal-episode-number">Episode ${i+1}</div><div class="modal-episode-title">${e.title}</div><div class="modal-episode-title">${e.servers.length} servers</div></div>`).join('');modalGrid.querySelectorAll('.modal-episode-card').forEach(c=>c.addEventListener('click',()=>{playEpisode(eps[Number(c.dataset.index)]);closeModal();}));modal.classList.add('active');mainEl?.classList.add('blurred');document.body.style.overflow='hidden';}
    function closeModal(){modal?.classList.remove('active');mainEl?.classList.remove('blurred');document.body.style.overflow='';}
    document.getElementById('viewAllBtn')?.addEventListener('click',openModal); closeModalBtn?.addEventListener('click',closeModal); modal?.addEventListener('click',e=>{if(e.target===modal||e.target.classList.contains('modal-overlay'))closeModal();}); document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('active'))closeModal();});

    renderEpisodes();
    if (isMovie && !currentEpisode) { const ep=getEpisodes(currentSeason)[0]; if(ep) playEpisode(ep,true); }
    window.addEventListener('resize',()=>updateTrackOffset(currentView==='seasons'));
}

/* ====================================================
   Animated search bar
   ==================================================== */
(function initAnimatedSearch() {
    const search = document.getElementById('animatedSearch');
    const form = document.getElementById('animatedSearchForm');
    const input = document.getElementById('animatedSearchInput');
    const button = search ? search.querySelector('.animated-search-button') : null;

    if (!search || !form || !input || !button) return;

    function openSearch() {
        search.classList.add('is-open');
        window.setTimeout(() => input.focus(), 120);
    }

    function closeSearch() {
        if (!input.value.trim()) search.classList.remove('is-open');
    }

    button.addEventListener('click', () => {
        if (!search.classList.contains('is-open')) {
            openSearch();
            return;
        }

        if (input.value.trim()) {
            form.requestSubmit();
        } else {
            input.focus();
        }
    });

    input.addEventListener('blur', closeSearch);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = input.value.trim();
        if (!query) {
            input.focus();
            return;
        }

        // يفتح صفحة Home مع كلمة البحث لتقدر تستخدمها مع بحث الموقع الموجود عندك.
        window.location.href = 'index.html?search=' + encodeURIComponent(query);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            input.value = '';
            input.blur();
            search.classList.remove('is-open');
        }
    });
})();
