/* ============================================================
   StreamVibe — ملف المحتوى (فاضي وجاهز)
   ------------------------------------------------------------
   حط هنا أي محتوى: أفلام، مسلسلات، كرتون، عربي أو إنجليزي.
   كل عنصر بالشكل ده:

   {
     id: "series-1",              // معرّف فريد (لازم يختلف عن أي عنصر تاني)
     title: "اسم العمل",
     searchName: "اسم العمل",     // نفس الاسم بحروف صغيرة عشان البحث
     img: "رابط صورة البوستر",
     poster: "رابط صورة البوستر",
     type: "series",              // "series" أو "movie"
     releaseYear: "2026",
     rating: "8.5",
     studio: "اسم الشركة/المنتج",
     genres: ["أكشن", "دراما"],
     seasons: "1 Season",
     classification: "+13",
     description: "وصف مختصر للعمل",
     episodeCount: 2,
     episodesLabel: "2 Episodes",
     episodes: [
       {
         id: "ep-1",
         title: "الحلقة 1",
         image: "رابط صورة الحلقة",
         servers: [
           { name: "Server 1", embed_url: "رابط تشغيل iframe" },
           { name: "Server 2", embed_url: "رابط تشغيل تاني" }
         ]
       }
     ]
   }

   للفيلم: خلي type: "movie" و episodes: [] وحط السيرفرات في servers مباشرة:
   { id: "movie-1", type: "movie", ..., servers: [{ name: "Server 1", embed_url: "..." }] }
   ============================================================ */

const MEDIA_DATA = [
  // مثال جاهز — امسحه أو عدّله:
  // {
  //   id: "movie-1",
  //   title: "Example Movie",
  //   searchName: "example movie",
  //   img: "https://placehold.co/300x450?text=Poster",
  //   poster: "https://placehold.co/300x450?text=Poster",
  //   type: "movie",
  //   releaseYear: "2026",
  //   rating: "8.0",
  //   studio: "",
  //   genres: ["Action"],
  //   seasons: "Movie",
  //   classification: "",
  //   description: "وصف الفيلم هنا.",
  //   episodes: [],
  //   episodeCount: 0,
  //   episodesLabel: "Movie",
  //   servers: [{ name: "Server 1", embed_url: "https://example.com/embed/xxxx" }]
  // }
];

/* أي عناصر تظهر في كل صفحة. سيبها فاضية = كل المحتوى يظهر في كل الصفحات.
   أو حط الـ id بتاع كل عمل في الصفحة اللي عايزه فيها. */
const PAGE_DATASETS = {
  home: [],
  series: [],
  movies: [],
  recommended: [],
  top: []
};

window.MEDIA_DATA = MEDIA_DATA;
window.PAGE_DATASETS = PAGE_DATASETS;
window.MEDIA_DB = {
  series: MEDIA_DATA.filter(x => x.type === 'series'),
  movies: MEDIA_DATA.filter(x => x.type === 'movie')
};

/* تحويل ملف db.json (لو بتشغّل السيرفر) لنفس شكل البيانات فوق */
window.normalizeAnimeDb = function (db) {
  if (!db || typeof db !== 'object') return [];
  const series = Array.isArray(db.series) ? db.series : [];
  const movies = Array.isArray(db.movies) ? db.movies : [];

  const normServer = (s, i) => {
    if (typeof s === 'string') return { name: 'Server ' + (i + 1), embed_url: s };
    if (!s || typeof s !== 'object') return null;
    const u = s.embed_url || s.url || s.link || s.src || '';
    return u ? { ...s, name: s.name || ('Server ' + (i + 1)), embed_url: u } : null;
  };

  const normEp = (raw, parent, i) => {
    const e = raw && typeof raw === 'object' ? { ...raw } : { url: typeof raw === 'string' ? raw : '' };
    const servers = Array.isArray(e.servers) ? e.servers.map(normServer).filter(Boolean) : [];
    const direct = e.url || e.video || e.link || e.src || '';
    return {
      ...e,
      id: e.id || parent.id + '-ep-' + (i + 1),
      title: e.title || ('Episode ' + (i + 1)),
      url: direct,
      servers: servers.length ? servers : (direct ? [{ name: 'Server 1', embed_url: direct }] : []),
      image: e.image || parent.poster || parent.img || ''
    };
  };

  const base = (r, type) => ({
    id: r.id,
    title: r.title || '',
    searchName: String(r.title || '').toLowerCase(),
    img: r.poster || r.img || '',
    poster: r.poster || r.img || '',
    url: r.url || '',
    type,
    releaseYear: r.releaseYear || '',
    rating: r.rating || '',
    studio: r.studio || '',
    genres: Array.isArray(r.genres) ? r.genres : [],
    classification: r.classification || '',
    fullStory: Array.isArray(r.fullStory) ? r.fullStory : [],
    quotes: Array.isArray(r.quotes) ? r.quotes : [],
    description: r.description || ''
  });

  const s = series.map(r => {
    const eps = Array.isArray(r.episodes) ? r.episodes.map((e, i) => normEp(e, r, i)) : [];
    return {
      ...base(r, 'series'),
      episodes: eps,
      episodeCount: eps.length,
      episodesLabel: eps.length + ' Episodes',
      seasons: r.seasons || '1 Season',
      episodesData: { 'Season 1': eps }
    };
  });

  const m = movies.map(r => ({
    ...base(r, 'movie'),
    episodes: [],
    episodeCount: 0,
    episodesLabel: 'Movie',
    seasons: 'Movie',
    servers: Array.isArray(r.servers) ? r.servers.map(normServer).filter(Boolean) : []
  }));

  return [...s, ...m];
};
