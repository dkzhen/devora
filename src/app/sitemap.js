export default function sitemap() {
    const baseUrl = "https://devora.my.id";
    
    // Hanya halaman PUBLIC yang valuable untuk SEO
    return [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/docs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];
}
