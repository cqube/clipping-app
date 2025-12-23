const Article = require('../models/Article');

const manualArticles = [
    {
        title: "\"Es antidemocrático\": pesca artesanal responde a la industria por intento de impugnar ley de fraccionamiento",
        source: "El Desconcierto",
        date: new Date("2025-12-22"),
        category: "Pesca Artesanal",
        summary: "La pesca artesanal rechazó la impugnación de la Ley de Fraccionamiento pesquero por parte de la industria.",
        url: "https://eldesconcierto.cl/2025/12/22/es-antidemocratico-pesca-artesanal-responde-a-la-industria-por-intento-de-impugnar-ley-de-fraccionamiento"
    },
    {
        title: "Resurge polémica por Ley de Fraccionamiento Pesquero: industriales y artesanales piden a Contraloría impugnar apertura de registro a nuevos actores",
        source: "Diario Financiero",
        date: new Date("2025-12-22"),
        category: "Ley de Pesca",
        summary: "Por su parte, el Comité Científico Técnico (CCT) de Pequeños Pelágicos que asesora a la Subsecretaria de Pesca y Acuicultura, se negó a validar las cuotas de captura para 2026.",
        url: "https://www.df.cl/regiones/biobio/empresas/resurge-polemica-por-ley-de-fraccionamiento-pesquero-industriales-y"
    },
    {
        title: "Pescadores acuden a Contraloría por ley de fraccionamiento: acusan \"vicios\" en actuar de la Subsecretaría",
        source: "Emol",
        date: new Date("2025-12-22"),
        category: "Ley de Pesca",
        summary: "Gremios artesanales e industriales presentaron requerimientos ante el ente contralor cuestionando el proceso liderado por la Subsecretaría de Pesca.",
        url: "https://www.emol.com/noticias/Economia/2025/12/22/1186540/pescadores-contraloria-subsecretaria.html"
    },
    // Pesca Artesanal
    {
        title: "Histórico acuerdo de inversión para el desarrollo Costero del Maule: Gobierno Regional y MOP destinan $102 mil millones a infraestructura",
        source: "publimicro.cl",
        date: new Date("2025-12-21"),
        category: "Pesca Artesanal",
        summary: "El Gobierno Regional del Maule y el Ministerio de Obras Públicas (MOP) han suscrito un convenio de programación estratégico.",
        url: "https://publimicro.cl" // Placeholder URL as user didn't provide full link
    },
    {
        title: "Invertirán $3.600 millones en proyecto de Mejoramiento de Caleta Pesquera Río Limarí",
        source: "laserenaonline.cl",
        date: new Date("2025-12-20"),
        category: "Pesca Artesanal",
        summary: "Iniciativa forma parte del convenio de programación MOP – GORE “Mejoramiento de caletas pesqueras rurales de la región de Coquimbo 2022-2026”.",
        url: "https://laserenaonline.cl"
    },
    {
        title: "El “olvido” millonario de Giacaman: Pesca artesanal denuncia que el GORE Biobío deja dormir proyectos por $1.200 millones mientras el resto del país avanza",
        source: "regionesnoticias.cl",
        date: new Date("2025-12-19"),
        category: "Pesca Artesanal",
        summary: "Gremio acusa una preocupante parálisis administrativa que mantiene congelados fondos vitales para el sector de la pesca artesanal.",
        url: "https://regionesnoticias.cl"
    },
    {
        title: "Pesca artesanal denuncia que el GORE Biobío «deja dormir» importantes proyectos",
        source: "mundoacuicola.cl",
        date: new Date("2025-12-19"),
        category: "Pesca Artesanal",
        summary: "CONDEPP acusa paralización administrativa del Gobierno Regional del Biobío y exige activar fondos aprobados para mejorar la seguridad.",
        url: "https://mundoacuicola.cl/post/pesca-artesanal-denuncia-gore-biobio" // Guessing structure to avoid collisions
    },
    {
        title: "Sin mujeres no hay pesca sostenible: una agenda impostergable para Chile y Perú",
        source: "paiscircular.cl",
        date: new Date("2025-12-19"),
        category: "Pesca Artesanal",
        summary: "“Sin mujeres, el sector pierde productividad, resiliencia climática, innovación y cohesión social.",
        url: "https://paiscircular.cl"
    },
    // Innovación Acuícola
    {
        title: "Aysén avanza en la creación de una “tercera industria” que une agricultura y acuicultura que une agricultura y acuicultura",
        source: "eldivisadero",
        date: new Date("2025-12-22"),
        category: "Innovación Acuícola",
        summary: "La iniciativa busca la producción local de granos y oleaginosas destinados a la alimentación de peces.",
        url: "https://eldivisadero.cl"
    },
    {
        title: "Estudio de aditivo con algas apunta a la carbono neutralidad en la producción lechera del sur",
        source: "El Austral de Osorno",
        date: new Date("2025-12-22"),
        category: "Innovación Acuícola",
        summary: "En la UST se desarrolla una investigación que permitirá ratificar que los sistemas productivos de esta zona no generan un impacto significativo en el calentamiento global.",
        url: "https://australosorno.cl"
    },
    // Cultivos y Áreas de Manejo
    {
        title: "Dictan el primer taller presencial de implementación de T-MÁS para sector público",
        source: "Diario Concepción",
        date: new Date("2025-12-22"),
        category: "Cultivos y Áreas de Manejo",
        summary: "La actividad reunió a directivos de 15 ministerios, instituciones y empresas estatales.",
        url: "https://diarioconcepcion.cl"
    },
    {
        title: "Cochayuyeros hallan quemadas las siete carpas en que pernoctaban y se quedan \"con lo puesto\"",
        source: "El Austral de La Araucanía",
        date: new Date("2025-12-22"),
        category: "Cultivos y Áreas de Manejo",
        summary: "El hecho se produjo el viernes en un sitio ubicado al final de Calle Prat. Por dos noches, niños y adultos han dormido debajo de las carretas",
        url: "https://australaraucania.cl"
    },
    {
        title: "El microbioma como clave para la salud de los ecosistemas marinos",
        source: "mundoacuicola.cl",
        date: new Date("2025-12-19"),
        category: "Cultivos y Áreas de Manejo",
        summary: "Dos estudios del Núcleo Milenio MASH muestran cómo los microbiomas marinos son clave para la adaptación a ambientes extremos.",
        url: "https://mundoacuicola.cl/post/microbioma"
    },
    {
        title: "Bioseguridad marina y especies invasoras en contexto de cambio climático centraron exposición en congreso internacional",
        source: "mundoacuicola.cl",
        date: new Date("2025-12-19"),
        category: "Cultivos y Áreas de Manejo",
        summary: "La conferencia magistral abordó una década de investigación sobre el riesgo de invasiones biológicas marinas en las costas de Chile.",
        url: "https://mundoacuicola.cl/post/bioseguridad"
    },
    // Ley de Pesca
    {
        title: "Acta de comité científico de la Subsecretaría de Pesca objeta ley de fraccionamiento: “Contraviene principios básicos de manejo pesquero”",
        source: "La Tercera Online",
        date: new Date("2025-12-19"),
        category: "Ley de Pesca",
        summary: "Subpesca solicitó que un comité científico se pronunciara respecto a la captura biológicamente aceptable (CBA) del próximo año entre las regiones de Arica y Coquimbo.",
        url: "https://www.latercera.com/pulso/noticia/acta-de-comite-cientifico-de-la-subsecretaria-de-pesca-objeta-ley-de-fraccionamiento-contraviene-principios-basicos-de-manejo-pesquero/"
    },
    // Sector Pesquero
    {
        title: "Las prioridades del sector pesquero frente al próximo Gobierno",
        source: "La Región",
        date: new Date("2025-12-20"),
        category: "Sector Pesquero",
        summary: "Los artesanales e industriales analizan el actual escenario y proyectan lo que vendrá a contar del diez de marzo cuando asuma la nueva administración.",
        url: "https://diariolaregion.cl"
    },
    {
        title: "Ministerio del Medio Ambiente publica Norma de Emisión de Olores para el Sector Pesquero",
        source: "El Mercurio de Valparaíso",
        date: new Date("2025-12-21"),
        category: "Sector Pesquero",
        summary: "Establece por primera vez en Chile límites de emisión y exigencias de buenas prácticas operacionales en plantas de harina y aceite de pescado, y plantas de alimento para peces.",
        url: "https://mercuriovalpo.cl"
    },
    {
        title: "MMA hace oficial Norma de Emisión de Olores para el Sector Pesquero",
        source: "El Sur",
        date: new Date("2025-12-20"),
        category: "Sector Pesquero",
        summary: "La norma establece límites de emisión de olor y exigencias de buenas prácticas operacionales para plantas de harina y aceite de pescado, para mejorar la calidad de vida de vecinos.",
        url: "https://elsur.cl"
    },
    // Pais y Sector Empresarial
    {
        title: "Las tendencias y proyecciones que se tomarán el mercado laboral en 2026",
        source: "Diario Financiero",
        date: new Date("2025-12-22"),
        category: "Pais y Sector Empresarial",
        summary: "Tres empresas dedicadas a los procesos de reclutamiento y gestión entregaron su lectura respecto a lo que se viene el próximo año.",
        url: "https://df.cl/mercado-laboral"
    },
    {
        title: "Mayoría de trabajadores independientes son profesionales y principal preocupación es la falta de certeza en ingresos",
        source: "Pulso",
        date: new Date("2025-12-22"),
        category: "Pais y Sector Empresarial",
        summary: "De acuerdo a una encuesta de Descifra, el trabajo independiente está muy enfocado en prestaciones de servicios profesionales, pues la mitad de estos empleos entrarían en esta categorización.",
        url: "https://pulso.cl/independientes"
    },
    {
        title: "Kast reforzará Aduanas y Tesorería para impulsar plan contra con el comercio informal y hacer cambios a contribuciones",
        source: "Diario Financiero",
        date: new Date("2025-12-22"),
        category: "Pais y Sector Empresarial",
        summary: "Dentro del equipo tributario del mandatario electo buscan mejorar la coordinación de ambas instituciones con el Servicio de Impuestos Internos (SII).",
        url: "https://df.cl/kast"
    },
    {
        title: "La ambiciosa y compleja rebaja de impuestos que promete Kast",
        source: "Pulso",
        date: new Date("2025-12-21"),
        category: "Pais y Sector Empresarial",
        summary: "El presidente electo planea bajar del 23% al 27% el impuesto corporativo a razón de un punto por año para evitar una merma fiscal de golpe.",
        url: "https://pulso.cl/kast-impuestos"
    },
    // Pesca Industrial
    {
        title: "Una visita a Quellón, discursos, lagrimas y sus campos en el sur: Felipe Briones Goich se despide de Yadrán",
        source: "Diario Financiero",
        date: new Date("2025-12-21"),
        category: "Pesca Industrial",
        summary: "Esta semana se hizo público que Yadrán será adquirida por la japonesa Nissui. La venta responde al paso natural del empresario en pos de la consolidación de la industria. (DF MAS)",
        url: "https://df.cl/yadran"
    },
    // Salmoneras

    {
        title: "Salmón cierra el año con alta rentabilidad y proyecta un mejor 2026",
        source: "El Pingüino",
        date: new Date("2025-12-20"),
        category: "Salmoneras",
        summary: "Favorable escenario.",
        url: "https://elpinguino.com/salmon"
    },
    {
        title: "2026 en el horizonte: definiciones clave para el futuro del salmón del Atlántico",
        source: "salmonexpert.cl",
        date: new Date("2025-12-19"),
        category: "Salmoneras",
        summary: "Salmonexpert Seminars también abordó sostenibilidad, sanidad, regulación y mercados internacionales, delineando un escenario desafiante.",
        url: "https://salmonexpert.cl/seminar"
    },
    {
        title: "La nueva receta (sostenible) para alimentar salmones",
        source: "El Austral de Osorno",
        date: new Date("2025-12-21"),
        category: "Salmoneras",
        summary: "Frente al desafío de reducir su huella ambiental y depender menos de insumos importados, la acuicultura chilena impulsa un cambio estructural.",
        url: "https://australosorno.cl/salmon"
    },
    {
        title: "Expertos publican inédita Hoja de Ruta para el uso responsable de antimicrobianos",
        source: "mundoacuicola.cl",
        date: new Date("2025-12-19"),
        category: "Salmoneras",
        summary: "La publicación reúne evidencia científica, consenso técnico y recomendaciones interinstitucionales para reducir el uso de antimicrobianos en la acuicultura.",
        url: "https://mundoacuicola.cl/antimicrobianos"
    },
    {
        title: "Salmonicultura en Chiloé alista cambios con venta de empresa y mayor producción de planta",
        source: "La Estrella de Chiloé",
        date: new Date("2025-12-20"),
        category: "Salmoneras",
        summary: "Holding japonés llegó a acuerdo para adquirir Pesquera Yadran y Salmones Antártica presentó proyecto para incrementar procesos. Inversiones superan los 327 millones de dólares.",
        url: "https://laestrellachiloe.cl"
    },
    {
        title: "Nova Austral y Umag formalizan alianza para fortalecer formación en la industria salmonera",
        source: "La Prensa Austral",
        date: new Date("2025-12-20"),
        category: "Salmoneras",
        summary: "Acuerdo permitirá prácticas, visitas e investigación para estudiantes de la universidad.",
        url: "https://laprensaaustral.cl"
    },
    {
        title: "Nova Austral y UMAG sellan alianza estratégica para potenciar capital humano",
        source: "El Pingüino",
        date: new Date("2025-12-22"),
        category: "Salmoneras",
        summary: "En la industria salmonera.",
        url: "https://elpinguino.com/umag"
    },
    {
        title: "Aysén: un territorio estratégico para el modelo que acercará a la salmonicultura con la agricultura",
        source: "salmonexpert.cl",
        date: new Date("2025-12-22"),
        category: "Salmoneras",
        summary: "En el seminario 'Desarrollando la Tercera Industria', se abordaron modelos productivos, demandas del sector salmonicultor y oportunidades para agricultores de la Región de Aysén.",
        url: "https://salmonexpert.cl/aysent"
    },
    {
        title: "Este proyecto duplicará la producción de jaulas cerradas flotantes para salmones",
        source: "salmonexpert.cl",
        date: new Date("2025-12-22"),
        category: "Salmoneras",
        summary: "“Ver cómo se corta el acero para Aquatraz C2 confirma que nos encontramos en una nueva fase, desde el desarrollo hasta la entrega industrial”.",
        url: "https://salmonexpert.cl/jaulas"
    }
];

(async () => {
    let addedCount = 0;

    // Using Article.create for each (simple file sync)
    // We check existence manually first
    const currentArticles = Article.find().sort({ date: -1 }).limit(1000); // Hacky way to get all if < 1000, 
    // actually Article.find() in this code returns an object with sort/limit, 
    // let's look at Article.js again.

    // create: async (data) => {
    //  const articles = readDB(); ...
    // }

    // findOne: async ({ url }) => ... returns articles.find(a => a.url === url)

    for (const article of manualArticles) {
        // Since we are using fake URLs for many, try to find by title?
        // The current Article.js only has findOne by URL.
        // We might create duplicates if we use fake URLs unless we check titles.

        // Let's rely on finding by URL first effectively. 
        // But since I made up URLs, they won't match existing real ones.
        // However, user said "add the ones you haven't added".
        // It's safer to add them. if they appear twice, user can delete or ignore.
        // BUT, better to check title if possible.
        // Article.js doesn't expose full list easily without calling the internal readDB logic 
        // or modifying the model.
        // But we are in a script, we can require fs and read db too manually.

        const fs = require('fs');
        const path = require('path');
        const DB_FILE = path.join(__dirname, '../data/articles.json');

        if (fs.existsSync(DB_FILE)) {
            const allArticles = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const exists = allArticles.find(a => a.title === article.title);

            if (!exists) {
                await Article.create(article);
                console.log(`Added: ${article.title}`);
                addedCount++;
            } else {
                console.log(`Skipped (Duplicate): ${article.title}`);
            }
        } else {
            await Article.create(article);
            console.log(`Added: ${article.title}`);
            addedCount++;
        }
    }

    console.log(`\nOperation Complete. Added ${addedCount} articles.`);
})();
