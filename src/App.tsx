import React, { useEffect } from 'react';
import { PremiumHandler } from './pages/PremiumHandler';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SearchModal } from './components/layout/SearchModal';
import { Home } from './pages/Home';
import { AllTools } from './pages/AllTools';
import { CategoryPage } from './pages/CategoryPage';

import { ImageCompressor } from './pages/tools/ImageCompressor';
import { ImageResizer } from './pages/tools/ImageResizer';
import { BackgroundRemover } from './pages/tools/BackgroundRemover';
import { PdfMerger } from './pages/tools/PdfMerger';
import { PdfSplitter } from './pages/tools/PdfSplitter';
import { VideoCompressor } from './pages/tools/VideoCompressor';
import { VideoTrimmer } from './pages/tools/VideoTrimmer';
import { YoutubeThumbnailResizer } from './pages/tools/YoutubeThumbnailResizer';
import { ExcelCsvCleaner } from './pages/tools/ExcelCsvCleaner';
import { ProductPhotoBatch } from './pages/tools/ProductPhotoBatch';
import { SocialVideoMaker } from './pages/tools/SocialVideoMaker';
import { AudioConverter } from './pages/tools/AudioConverter';
import { ImageToPdf } from './pages/tools/ImageToPdf';
import { PdfToJpg } from './pages/tools/PdfToJpg';
import { OcrTool } from './pages/tools/OcrTool';
import { ComingSoonTool } from './pages/tools/ComingSoonTool';
import { PricingPage } from './pages/PricingPage';
import { Blog } from './pages/Blog';

import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { Privacy } from './pages/public/Privacy';
import { Terms } from './pages/public/Terms';
import { Refund } from './pages/public/Refund';
import { CookiePolicy } from './pages/public/CookiePolicy';
import { Disclaimer } from './pages/public/Disclaimer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ConsentBanner } from './components/common/ConsentBanner';
import { Button } from './components/ui/Button';

import { useAppStore } from './store/useAppStore';
import { usePlanStore } from './store/usePlanStore';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // NEW: Check premium status on app load (from localStorage token)
  useEffect(() => {
    usePlanStore.getState().checkPremiumStatus();
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AnalyticsTracker />
          <ConsentBanner />
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
          <Header />
          <SearchModal />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<AllTools />} />
              <Route path="/premium" element={<PremiumHandler />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Blog />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
<Route path="/cookies" element={<CookiePolicy />} />
<Route path="/disclaimer" element={<Disclaimer />} />
              
              {/* 15 Active Live Tools */}
              <Route path="/tool/excel-csv-cleaner" element={<ExcelCsvCleaner />} />
              <Route path="/tool/product-photo-batch" element={<ProductPhotoBatch />} />
              <Route path="/tool/social-video-maker" element={<SocialVideoMaker />} />
              <Route path="/tool/youtube-thumbnail-resizer" element={<YoutubeThumbnailResizer />} />
              <Route path="/tool/image-compressor" element={<ImageCompressor />} />
              <Route path="/tool/image-resizer" element={<ImageResizer />} />
              <Route path="/tool/background-remover" element={<BackgroundRemover />} />
              <Route path="/tool/pdf-merger" element={<PdfMerger />} />
              <Route path="/tool/pdf-splitter" element={<PdfSplitter />} />
              <Route path="/tool/pdf-to-jpg" element={<PdfToJpg />} />
              <Route path="/tool/image-to-pdf" element={<ImageToPdf />} />
              <Route path="/tool/ocr" element={<OcrTool />} />
              <Route path="/tool/video-compressor" element={<VideoCompressor />} />
              <Route path="/tool/audio-converter" element={<AudioConverter />} />
              <Route path="/tool/video-trimmer" element={<VideoTrimmer />} />

              {/* Coming Soon / Hidden Tools */}
              <Route path="/tool/image-converter" element={<ComingSoonTool toolId="image-converter" />} />
              <Route path="/tool/video-converter" element={<ComingSoonTool toolId="video-converter" />} />
              <Route path="/tool/video-to-mp3" element={<ComingSoonTool toolId="video-to-mp3" />} />
              <Route path="/tool/audio-compressor" element={<ComingSoonTool toolId="audio-compressor" />} />
              <Route path="/tool/audio-trimmer" element={<ComingSoonTool toolId="audio-trimmer" />} />
              <Route path="/tool/thumbnail-compressor" element={<ComingSoonTool toolId="thumbnail-compressor" />} />
              <Route path="/tool/thumbnail-preview" element={<ComingSoonTool toolId="thumbnail-preview" />} />
              <Route path="/tool/image-cropper" element={<ComingSoonTool toolId="image-cropper" />} />
              <Route path="/tool/aspect-ratio-calculator" element={<ComingSoonTool toolId="aspect-ratio-calculator" />} />
              <Route path="/tool/instagram-image-resizer" element={<ComingSoonTool toolId="instagram-image-resizer" />} />
              <Route path="/tool/instagram-story-resizer" element={<ComingSoonTool toolId="instagram-story-resizer" />} />
              <Route path="/tool/tiktok-cover-resizer" element={<ComingSoonTool toolId="tiktok-cover-resizer" />} />
              <Route path="/tool/video-to-thumbnail" element={<ComingSoonTool toolId="video-to-thumbnail" />} />
              <Route path="/tool/creator-image-compressor" element={<ComingSoonTool toolId="creator-image-compressor" />} />
              <Route path="/tool/object-remover" element={<ComingSoonTool toolId="object-remover" />} />
              <Route path="/tool/speech-to-text" element={<ComingSoonTool toolId="speech-to-text" />} />

              {/* Format Aliases & Upcoming Server Processing */}
              <Route path="/tool/jpg-to-webp" element={<ComingSoonTool toolId="jpg-to-webp" />} />
              <Route path="/tool/webp-to-jpg" element={<ComingSoonTool toolId="webp-to-jpg" />} />
              <Route path="/tool/png-to-webp" element={<ComingSoonTool toolId="png-to-webp" />} />
              <Route path="/tool/heic-to-jpg" element={<ComingSoonTool toolId="heic-to-jpg" />} />
              <Route path="/tool/jpg-to-pdf" element={<ComingSoonTool toolId="jpg-to-pdf" />} />
              <Route path="/tool/pdf-compressor" element={<ComingSoonTool toolId="pdf-compressor" />} />
              <Route path="/tool/pdf-to-word" element={<ComingSoonTool toolId="pdf-to-word" />} />
              <Route path="/tool/word-to-pdf" element={<ComingSoonTool toolId="word-to-pdf" />} />
              <Route path="/tool/pdf-to-excel" element={<ComingSoonTool toolId="pdf-to-excel" />} />
              <Route path="/tool/pdf-to-powerpoint" element={<ComingSoonTool toolId="pdf-to-powerpoint" />} />
              <Route path="/tool/excel-to-pdf" element={<ComingSoonTool toolId="excel-to-pdf" />} />
              <Route path="/tool/powerpoint-to-pdf" element={<ComingSoonTool toolId="powerpoint-to-pdf" />} />
              
              <Route path="*" element={
                <div className="p-20 text-center flex-1 flex flex-col items-center justify-center gap-4">
                  <h1 className="text-4xl font-bold text-foreground">Page Not Found</h1>
                  <p className="text-muted-fg">The page you are looking for does not exist or has been moved.</p>
                  <Link to="/">
                    <Button variant="primary">Go to Homepage</Button>
                  </Link>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;