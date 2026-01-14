module.exports = {
    name: 'Fundación Tacal',
    keywords: [
        'discapacidad',
        'trabajo para personas con discapacidad',
        'capacitación de personas con discapacidad',
        'aplicación de la Ley de Inclusión Laboral N° 21.015',
        'ley 21.015 Chile',
        'casos de éxito en la contratación de personas con discapacidad Chile',
        'inclusión laboral Chile',
        'senadis Chile',
        'fundación tacal Chile',
        'accesibilidad Chile',
        'credencial de discapacidad Chile',
        'gestor de inclusión Chile'
    ],
    categories: {
        'Fundación Tacal': ['fundación tacal', 'tacal', 'andrea zondek'],
        'Ley de Inclusión (21.015)': ['21.015', 'ley de inclusión', 'gestor de inclusión', 'cuota de inclusión', 'multas inclusión'],
        'Capacitación y Empleo': ['capacitación', 'empleo con apoyo', 'contratación inclusiva', 'ofertas laborales', 'sence', 'organismo técnico'],
        'Casos de Éxito': ['historia de vida', ' testimonio ', 'reconocimiento', 'empresa inclusiva', 'premio inclusión'],
        'Discapacidad General': ['discapacidad', 'cdn', 'credencial', 'compin', 'pensión de invalidez'],
        'Accesibilidad': ['accesibilidad universal', 'rampas', 'lengua de señas', 'braille', 'tecnologías asistivas'],
        'Políticas Públicas': ['senadis', 'ministerio de desarrollo social', 'politica nacional', 'subsidio']
    },
    rssFeeds: [
        // New specific feeds based on user request
        { url: 'https://news.google.com/rss/search?q="trabajo+para+personas+con+discapacidad"+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Trabajo Discapacidad' },
        { url: 'https://news.google.com/rss/search?q="capacitación+de+personas+con+discapacidad"+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Capacitación Discapacidad' },
        { url: 'https://news.google.com/rss/search?q=("Ley+de+Inclusión+Laboral"+OR+"Ley+21.015")+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Ley 21.015' },
        { url: 'https://news.google.com/rss/search?q=("casos+de+éxito"+contratación+discapacidad)+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Casos Éxito' },
        'https://www.google.com/alerts/feeds/08397670603095634428/5318811460532813958',
        'https://www.google.com/alerts/feeds/08397670603095634428/5033396631359850017',
        'https://www.google.com/alerts/feeds/08397670603095634428/8295167973895683185',
        'https://mdstrm.com/feeds/grupo-copesa/informacion-privilegiada',

        'https://www.ciperchile.cl/feed/',
        'https://www.theclinic.cl/feed/',
        'https://www.elciudadano.com/feed/',
        { url: 'https://news.google.com/rss/search?q=discapacidad+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Discapacidad' },
        { url: 'https://news.google.com/rss/search?q="fundación+tacal"&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Tacal' },
        { url: 'https://news.google.com/rss/search?q=("ley+21015"+OR+"ley+21.015")+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Ley 21.015' },
        { url: 'https://news.google.com/rss/search?q="inclusión+laboral"+Chile&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Google News - Inclusión Laboral' },
        { url: 'https://news.google.com/rss/search?q=site:emol.com+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Emol' },
        { url: 'https://news.google.com/rss/search?q=site:meganoticias.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Meganoticias' },
        { url: 'https://news.google.com/rss/search?q=site:24horas.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: '24 Horas' },
        { url: 'https://news.google.com/rss/search?q=site:t13.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'T13' },
        { url: 'https://news.google.com/rss/search?q=site:chvnoticias.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'CHV Noticias' },
        { url: 'https://news.google.com/rss/search?q=site:cnnchile.com+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'CNN Chile' },
        { url: 'https://news.google.com/rss/search?q=site:elmostrador.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'El Mostrador' },
        { url: 'https://news.google.com/rss/search?q=site:eldinamo.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'El Dínamo' },
        { url: 'https://news.google.com/rss/search?q=site:pauta.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Pauta' },
        {
            "url": "https://news.google.com/rss/search?q=site:lacuarta.com+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "La Cuarta"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:Lun.com+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "Las Últimas Noticias"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:biobiochile.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "BioBioChile"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:cooperativa.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "Cooperativa"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:adnradio.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "ADN Radio"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:df.cl+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "Diario Financiero"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:elmercurio.com+discapacidad&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "El Mercurio"
        },
        {
            "url": "https://news.google.com/rss/search?q=site:senadis.gob.cl&hl=es-CL&gl=CL&ceid=CL:es-419",
            "sourceName": "Senadis"
        }
    ],
    sites: [
        {
            name: 'El Desconcierto',
            url: 'https://eldesconcierto.cl/?s=discapacidad',
            selector: 'article, .post, h2, h3',
            titleSelector: 'a',
            linkSelector: 'a',
            summarySelector: 'p, .excerpt'
        },
        {
            name: 'Interferencia',
            url: 'https://interferencia.cl/?s=discapacidad',
            selector: 'article, .post, h2, h3',
            titleSelector: 'a',
            linkSelector: 'a',
            summarySelector: 'p'
        }
    ]
};
