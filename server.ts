import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;


  // Dynamic sitemap.xml generator supporting SEO
  app.get("/sitemap.xml", (req, res) => {
    const host = req.get('host') || 'calcora.com';
    const scheme = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${scheme}://${host}`;

    // 1. Static pages
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/tools', priority: '0.9', changefreq: 'daily' },
      { path: '/pricing', priority: '0.8', changefreq: 'weekly' },
      { path: '/about', priority: '0.7', changefreq: 'monthly' },
      { path: '/contact', priority: '0.7', changefreq: 'monthly' },
      { path: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { path: '/terms', priority: '0.3', changefreq: 'monthly' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' }
    ];

    // 2. Blog posts slugs
    const blogSlugs = [
      'how-to-clean-shopify-csv',
      'amazon-product-image-size-guide',
      'tiktok-captions-without-watermark'
    ];
    const blogPages = blogSlugs.map(slug => ({
      path: `/blog/${slug}`,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    // 3. Category pages
    const categories = ['video', 'image', 'pdf-document', 'audio', 'creator'];
    const categoryPages = categories.map(cat => ({
      path: `/category/${cat}`,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    // 4. Tools from TOOLS registry (excluding video-downloader)
    // We import TOOLS directly or define standard routes
    const toolRoutes = [
      '/tool/youtube-thumbnail-resizer',
      '/tool/thumbnail-compressor',
      '/tool/thumbnail-preview',
      '/tool/image-cropper',
      '/tool/aspect-ratio-calculator',
      '/tool/instagram-image-resizer',
      '/tool/instagram-story-resizer',
      '/tool/tiktok-cover-resizer',
      '/tool/video-to-thumbnail',
      '/tool/creator-image-compressor',
      '/tool/video-compressor',
      '/tool/video-converter',
      '/tool/video-to-mp3',
      '/tool/video-trimmer',
      '/tool/image-compressor',
      '/tool/image-resizer',
      '/tool/image-converter',
      '/tool/background-remover',
      '/tool/object-remover',
      '/tool/heic-to-jpg',
      '/tool/jpg-to-webp',
      '/tool/webp-to-jpg',
      '/tool/png-to-webp',
      '/tool/image-to-pdf',
      '/tool/pdf-compressor',
      '/tool/pdf-to-word',
      '/tool/word-to-pdf',
      '/tool/pdf-splitter',
      '/tool/pdf-merger',
      '/tool/jpg-to-pdf',
      '/tool/pdf-to-jpg',
      '/tool/pdf-to-excel',
      '/tool/pdf-to-powerpoint',
      '/tool/excel-to-pdf',
      '/tool/powerpoint-to-pdf',
      '/tool/ocr',
      '/tool/audio-converter',
      '/tool/audio-compressor',
      '/tool/audio-trimmer',
      '/tool/speech-to-text',
      '/tool/excel-csv-cleaner',
      '/tool/product-photo-batch',
      '/tool/social-video-maker'
    ];

    const toolPages = toolRoutes.map(route => {
      // Determine priority based on category/flagship
      let priority = '0.7';
      if (route.includes('product-photo-batch') || route.includes('excel-csv-cleaner') || route.includes('social-video-maker')) {
        priority = '0.9'; // Flagship tools
      } else if (route.includes('youtube-thumbnail') || route.includes('background-remover') || route.includes('pdf-compressor')) {
        priority = '0.7';
      } else if (route.includes('creator')) {
        priority = '0.6';
      }
      return {
        path: route,
        priority,
        changefreq: 'weekly'
      };
    });

    const allEntries = [...staticPages, ...blogPages, ...categoryPages, ...toolPages];
    
    // Deduplicate by path
    const seen = new Set();
    const uniqueEntries = allEntries.filter(entry => {
      if (seen.has(entry.path)) return false;
      seen.add(entry.path);
      return true;
    });

    const nowStr = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const entry of uniqueEntries) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${entry.path}</loc>\n`;
      xml += `    <lastmod>${nowStr}</lastmod>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Dynamic robots.txt
  app.get("/robots.txt", (req, res) => {
    const host = req.get('host') || 'calcora.com';
    const scheme = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const sitemapUrl = `${scheme}://${host}/sitemap.xml`;

    const robots = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /uploads/",
      "Disallow: /admin",
      "Disallow: /debug",
      "",
      `Sitemap: ${sitemapUrl}`
    ].join("\n");

    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Determine environment mode
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start" || (Boolean(process.env.PORT) && process.env.PORT !== "3000");

  if (!isProduction || !hasDist) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (mode: ${isProduction && hasDist ? 'production' : 'development'})`);
  });
}

startServer();
