const PRIORITY_SOURCES = [
    'La Tercera',
    'El Mercurio',
    'Chilevision',
    'El Mostrador',
    'MEGA',
    'La Cuarta',
    'Tvn Chile',
    'Meganoticias',
    'La Nación',
    'Las Últimas Noticias',
    'La Segunda',
    'BioBioChile',
    'ADN Radio'
];

const testArticles = [
    { title: 'Art 1 - Emol Today', source: 'El Mercurio', date: new Date('2026-03-02T10:00:00Z') },
    { title: 'Art 2 - LT Today', source: 'La Tercera', date: new Date('2026-03-02T11:00:00Z') },
    { title: 'Art 3 - BioBio Today', source: 'BioBioChile', date: new Date('2026-03-02T12:00:00Z') },
    { title: 'Art 4 - LT Yesterday', source: 'La Tercera', date: new Date('2026-03-01T10:00:00Z') },
    { title: 'Art 5 - Emol Yesterday', source: 'El Mercurio', date: new Date('2026-03-01T11:00:00Z') },
    { title: 'Art 6 - Mega Today', source: 'MEGA', date: new Date('2026-03-02T09:00:00Z') }
];

testArticles.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    const dayA = dateA.toISOString().split('T')[0];
    const dayB = dateB.toISOString().split('T')[0];

    if (dayA !== dayB) {
        return dateB - dateA;
    }

    const indexA = PRIORITY_SOURCES.findIndex(s => a.source.includes(s));
    const indexB = PRIORITY_SOURCES.findIndex(s => b.source.includes(s));

    if (indexA !== -1 && indexB !== -1) {
        if (indexA !== indexB) return indexA - indexB;
    } else if (indexA !== -1) {
        return -1;
    } else if (indexB !== -1) {
        return 1;
    }

    return dateB - dateA;
});

console.log('Sorted Articles:');
testArticles.forEach(a => console.log(`${a.date.toISOString().split('T')[0]} | ${a.source.padEnd(15)} | ${a.title}`));

// Expected order for March 2: La Tercera, El Mercurio, MEGA, BioBioChile
// Expected order for March 1: La Tercera, El Mercurio
