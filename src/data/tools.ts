import { 
  Video, Image as ImageIcon, FileText, Music, 
  Scissors, Minimize2, ArrowRightLeft, Download, 
  Type, SplitSquareHorizontal, Combine, Grid, Box as ObjectIcon, RefreshCw,
  Crop, Calculator, Eye, Smartphone, Tv, Sparkles, Camera
} from 'lucide-react';

export type ToolCategory = 'video' | 'image' | 'pdf-document' | 'audio' | 'creator';

export interface ToolItem {
  id: string;
  name: string;
  categoryId: ToolCategory;
  description: string;
  route: string;
  iconName: string; 
  popularity: number;
  requiresBackend: boolean;
  requiresAuth: boolean;
  keywords: string[];
  implementationStatus: 'live' | 'coming-soon';
  relatedTools: string[];
  isBeta?: boolean;
}

export const CATEGORIES = [
  { id: 'video', name: 'VIDEO', icon: Video, description: 'Compress, trim, and convert video files.' },
  { id: 'image', name: 'IMAGE', icon: ImageIcon, description: 'Resize, convert, and remove backgrounds.' },
  { id: 'pdf-document', name: 'PDF & DOCUMENT', icon: FileText, description: 'Convert, compress, merge, and edit PDFs.' },
  { id: 'audio', name: 'AUDIO', icon: Music, description: 'Convert, compress, and trim audio files.' },
  { id: 'creator', name: 'CREATOR TOOLS', icon: Sparkles, description: 'Resizing, compression, and preview tools for content creators.' }
] as const;

export const TOOLS: ToolItem[] = [
  // FLAGSHIP TOOLS (Moved to top)
  { 
    id: 'excel-csv-cleaner', 
    name: 'Excel / CSV Cleaner', 
    categoryId: 'pdf-document', 
    description: 'Clean duplicate, messy and inconsistent spreadsheet data without manually fixing every row.', 
    route: '/tool/excel-csv-cleaner', 
    iconName: 'FileText', 
    popularity: 120, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['excel', 'csv', 'clean', 'dedupe', 'duplicates', 'trim', 'normalize', 'tsv', 'spreadsheet'], 
    implementationStatus: 'live', 
    relatedTools: ['pdf-merger', 'pdf-to-jpg'] 
  },
  { 
    id: 'product-photo-batch', 
    name: 'Product Photo Batch', 
    categoryId: 'creator', 
    description: 'Prepare multiple product images for marketplaces in one workflow.', 
    route: '/tool/product-photo-batch', 
    iconName: 'ImageIcon', 
    popularity: 119, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['product', 'photo', 'batch', 'shopify', 'amazon', 'background', 'resize', 'zip'], 
    implementationStatus: 'live', 
    relatedTools: ['background-remover', 'image-compressor', 'image-resizer'] 
  },
  { 
    id: 'social-video-maker', 
    name: 'Social Video Maker', 
    categoryId: 'creator', 
    description: 'Turn a regular video into a social-ready vertical video with captions.', 
    route: '/tool/social-video-maker', 
    iconName: 'Video', 
    popularity: 118, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['video', 'social', 'shorts', 'reels', 'tiktok', 'captions', 'trim', 'crop'], 
    implementationStatus: 'live', 
    relatedTools: ['video-trimmer', 'video-to-thumbnail'] 
  },

  // CREATOR TOOLS (Singular /tool/ routes)
  { 
    id: 'youtube-thumbnail-resizer', 
    name: 'YouTube Thumbnail Resizer', 
    categoryId: 'creator', 
    description: 'Instantly fit and crop your images to the perfect 1280x720 YouTube thumbnail size.', 
    route: '/tool/youtube-thumbnail-resizer', 
    iconName: 'Grid', 
    popularity: 110, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['youtube', 'thumbnail', 'resize', 'dimensions', 'fit', 'crop', 'image', 'creator'], 
    implementationStatus: 'live', 
    relatedTools: ['thumbnail-compressor', 'thumbnail-preview', 'image-cropper', 'creator-image-compressor', 'video-to-thumbnail'] 
  },
  { 
    id: 'thumbnail-compressor', 
    name: 'Thumbnail Compressor', 
    categoryId: 'creator', 
    description: 'Compress and optimize thumbnails to meet platform file size limits under 2MB.', 
    route: '/tool/thumbnail-compressor', 
    iconName: 'Minimize2', 
    popularity: 109, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['compress', 'thumbnail', 'optimize', 'file size', 'youtube', 'quality', 'jpeg', 'webp'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['youtube-thumbnail-resizer', 'thumbnail-preview', 'creator-image-compressor'] 
  },
  { 
    id: 'thumbnail-preview', 
    name: 'Thumbnail Previewer', 
    categoryId: 'creator', 
    description: 'Preview how your thumbnail will appear on YouTube desktop, mobile, and feed layouts.', 
    route: '/tool/thumbnail-preview', 
    iconName: 'Eye', 
    popularity: 108, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['thumbnail', 'preview', 'youtube', 'feed', 'card', 'mobile', 'desktop', 'visualize'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['youtube-thumbnail-resizer', 'thumbnail-compressor', 'image-cropper'] 
  },
  { 
    id: 'image-cropper', 
    name: 'Image Cropper', 
    categoryId: 'creator', 
    description: 'Crop your images to any aspect ratio with visual rotation, zoom, and preset controls.', 
    route: '/tool/image-cropper', 
    iconName: 'Crop', 
    popularity: 107, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['crop', 'cut', 'image', 'aspect ratio', 'zoom', 'dimensions', 'custom crop'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['youtube-thumbnail-resizer', 'instagram-image-resizer', 'tiktok-cover-resizer'] 
  },
  { 
    id: 'aspect-ratio-calculator', 
    name: 'Aspect Ratio Calculator', 
    categoryId: 'creator', 
    description: 'Calculate dimensions and aspect ratios for video and image scaling, completely offline.', 
    route: '/tool/aspect-ratio-calculator', 
    iconName: 'Calculator', 
    popularity: 106, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['aspect ratio', 'calculator', 'dimensions', 'width', 'height', 'ratio', 'presets', 'math'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['youtube-thumbnail-resizer', 'image-resizer'] 
  },
  { 
    id: 'instagram-image-resizer', 
    name: 'Instagram Image Resizer', 
    categoryId: 'creator', 
    description: 'Resize and fit photos to Instagram square (1:1), portrait (4:5), and landscape presets.', 
    route: '/tool/instagram-image-resizer', 
    iconName: 'Grid', 
    popularity: 105, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['instagram', 'resize', 'square', 'portrait', 'landscape', 'fit', 'image', 'instagram photo'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['instagram-story-resizer', 'image-cropper', 'image-resizer'] 
  },
  { 
    id: 'instagram-story-resizer', 
    name: 'Instagram Story Resizer', 
    categoryId: 'creator', 
    description: 'Resize and optimize images for Instagram Stories or Reels (9:16) with safe area visual guides.', 
    route: '/tool/instagram-story-resizer', 
    iconName: 'Smartphone', 
    popularity: 104, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['instagram', 'story', 'reel', 'resize', 'safe area', '9:16', 'dimensions', 'fit', 'portrait'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['instagram-image-resizer', 'tiktok-cover-resizer', 'image-cropper'] 
  },
  { 
    id: 'tiktok-cover-resizer', 
    name: 'TikTok Cover Resizer', 
    categoryId: 'creator', 
    description: 'Resize, center, and crop images to the standard 9:16 vertical TikTok Cover format.', 
    route: '/tool/tiktok-cover-resizer', 
    iconName: 'Smartphone', 
    popularity: 103, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['tiktok', 'cover', 'resize', 'dimensions', 'crop', '9:16', 'portrait', 'vertical', 'creator'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['instagram-story-resizer', 'video-to-thumbnail', 'image-cropper'] 
  },
  { 
    id: 'video-to-thumbnail', 
    name: 'Video → Thumbnail', 
    categoryId: 'creator', 
    description: 'Upload your video and extract high-resolution frames as PNG/JPG thumbnails in your browser.', 
    route: '/tool/video-to-thumbnail', 
    iconName: 'Camera', 
    popularity: 102, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['video', 'thumbnail', 'frame', 'extract', 'capture', 'grab', 'mp4', 'webm', 'timeline'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['youtube-thumbnail-resizer', 'thumbnail-compressor', 'thumbnail-preview'] 
  },
  { 
    id: 'creator-image-compressor', 
    name: 'Creator Image Compressor', 
    categoryId: 'creator', 
    description: 'Ultra-fast image compressor using customizable creator-specific quality and format presets.', 
    route: '/tool/creator-image-compressor', 
    iconName: 'Minimize2', 
    popularity: 101, 
    requiresBackend: false, 
    requiresAuth: false, 
    keywords: ['compress', 'image', 'creator', 'presets', 'youtube', 'instagram', 'optimize', 'file size'], 
    implementationStatus: 'coming-soon', 
    relatedTools: ['thumbnail-compressor', 'image-compressor', 'youtube-thumbnail-resizer'] 
  },

  // VIDEO
  { id: 'video-compressor', name: 'Video Compressor', categoryId: 'video', description: 'Compress video files to smaller sizes.', route: '/tool/video-compressor', iconName: 'Minimize2', popularity: 99, requiresBackend: false, requiresAuth: false, keywords: ['compress', 'video'], implementationStatus: 'live', relatedTools: ['video-converter', 'video-to-mp3', 'video-trimmer'], isBeta: true },
  { id: 'video-converter', name: 'Video Converter', categoryId: 'video', description: 'Convert video formats.', route: '/tool/video-converter', iconName: 'ArrowRightLeft', popularity: 98, requiresBackend: false, requiresAuth: false, keywords: ['convert', 'video'], implementationStatus: 'coming-soon', relatedTools: ['video-compressor', 'video-trimmer', 'video-to-mp3'] },
  { id: 'video-to-mp3', name: 'Video → MP3', categoryId: 'video', description: 'Extract audio from video files.', route: '/tool/video-to-mp3', iconName: 'Music', popularity: 97, requiresBackend: false, requiresAuth: false, keywords: ['video', 'mp3', 'extract', 'audio'], implementationStatus: 'coming-soon', relatedTools: ['video-trimmer', 'video-compressor', 'audio-converter', 'audio-trimmer'] },
  { id: 'video-trimmer', name: 'Video Trimmer', categoryId: 'video', description: 'Trim and cut video files.', route: '/tool/video-trimmer', iconName: 'Scissors', popularity: 96, requiresBackend: false, requiresAuth: false, keywords: ['trim', 'cut', 'video'], implementationStatus: 'live', relatedTools: ['video-compressor', 'video-converter', 'video-to-mp3'], isBeta: true },

  // IMAGE
  { id: 'image-compressor', name: 'Image Compressor', categoryId: 'image', description: 'Reduce image file size without losing quality.', route: '/tool/image-compressor', iconName: 'Minimize2', popularity: 95, requiresBackend: false, requiresAuth: false, keywords: ['compress', 'image'], implementationStatus: 'live', relatedTools: ['image-resizer', 'image-converter', 'jpg-to-webp', 'webp-to-jpg', 'background-remover'] },
  { id: 'image-resizer', name: 'Image Resizer', categoryId: 'image', description: 'Resize image dimensions instantly.', route: '/tool/image-resizer', iconName: 'Grid', popularity: 94, requiresBackend: false, requiresAuth: false, keywords: ['resize', 'image'], implementationStatus: 'live', relatedTools: ['image-compressor', 'image-converter', 'background-remover'] },
  { id: 'image-converter', name: 'Image Converter', categoryId: 'image', description: 'Convert images between formats.', route: '/tool/image-converter', iconName: 'ArrowRightLeft', popularity: 93, requiresBackend: false, requiresAuth: false, keywords: ['convert', 'image'], implementationStatus: 'coming-soon', relatedTools: ['image-compressor', 'image-resizer', 'background-remover', 'jpg-to-webp'] },
  { id: 'background-remover', name: 'Background Remover', categoryId: 'image', description: 'Remove backgrounds from images using AI.', route: '/tool/background-remover', iconName: 'Scissors', popularity: 92, requiresBackend: false, requiresAuth: false, keywords: ['background', 'remove'], implementationStatus: 'live', relatedTools: ['object-remover', 'image-compressor', 'image-resizer', 'image-converter'] },
  { id: 'object-remover', name: 'Object Remover', categoryId: 'image', description: 'Remove unwanted objects from photos.', route: '/tool/object-remover', iconName: 'RefreshCw', popularity: 91, requiresBackend: false, requiresAuth: false, keywords: ['object', 'remove'], implementationStatus: 'coming-soon', relatedTools: ['background-remover', 'image-compressor'] },
  { id: 'heic-to-jpg', name: 'HEIC → JPG', categoryId: 'image', description: 'Convert Apple HEIC photos to standard JPG.', route: '/tool/heic-to-jpg', iconName: 'ArrowRightLeft', popularity: 90, requiresBackend: false, requiresAuth: false, keywords: ['heic', 'jpg', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['image-compressor', 'image-resizer', 'jpg-to-pdf'] },
  { id: 'jpg-to-webp', name: 'JPG → WebP', categoryId: 'image', description: 'Convert JPG images to optimized WebP format.', route: '/tool/jpg-to-webp', iconName: 'ArrowRightLeft', popularity: 89, requiresBackend: false, requiresAuth: false, keywords: ['jpg', 'webp', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['webp-to-jpg', 'image-compressor', 'image-converter'] },
  { id: 'webp-to-jpg', name: 'WebP → JPG', categoryId: 'image', description: 'Convert WebP images back to JPG format.', route: '/tool/webp-to-jpg', iconName: 'ArrowRightLeft', popularity: 88, requiresBackend: false, requiresAuth: false, keywords: ['webp', 'jpg', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['jpg-to-webp', 'image-compressor', 'image-converter'] },
  { id: 'png-to-webp', name: 'PNG → WebP', categoryId: 'image', description: 'Convert PNG images to WebP format.', route: '/tool/png-to-webp', iconName: 'ArrowRightLeft', popularity: 87, requiresBackend: false, requiresAuth: false, keywords: ['png', 'webp', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['image-compressor', 'image-converter'] },
  { id: 'image-to-pdf', name: 'Image → PDF', categoryId: 'image', description: 'Combine multiple images into a single PDF document.', route: '/tool/image-to-pdf', iconName: 'FileText', popularity: 86, requiresBackend: false, requiresAuth: false, keywords: ['image', 'pdf', 'convert'], implementationStatus: 'live', relatedTools: ['pdf-merger', 'pdf-splitter', 'jpg-to-pdf'] },

  // PDF & DOCUMENT
  { id: 'pdf-compressor', name: 'PDF Compressor', categoryId: 'pdf-document', description: 'Reduce the file size of your PDF documents.', route: '/tool/pdf-compressor', iconName: 'Minimize2', popularity: 85, requiresBackend: true, requiresAuth: false, keywords: ['pdf', 'compress'], implementationStatus: 'coming-soon', relatedTools: ['pdf-merger', 'pdf-splitter', 'pdf-to-jpg', 'jpg-to-pdf'] },
  { id: 'pdf-to-word', name: 'PDF → Word', categoryId: 'pdf-document', description: 'Convert PDF files to editable Word documents.', route: '/tool/pdf-to-word', iconName: 'FileText', popularity: 84, requiresBackend: true, requiresAuth: false, keywords: ['pdf', 'word', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['pdf-splitter', 'pdf-merger', 'ocr-image-pdf-to-text', 'word-to-pdf'] },
  { id: 'word-to-pdf', name: 'Word → PDF', categoryId: 'pdf-document', description: 'Convert Word documents to PDF.', route: '/tool/word-to-pdf', iconName: 'FileText', popularity: 83, requiresBackend: true, requiresAuth: false, keywords: ['word', 'pdf', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['pdf-to-word', 'pdf-merger', 'image-to-pdf'] },
  { id: 'pdf-splitter', name: 'PDF Splitter', categoryId: 'pdf-document', description: 'Extract specific pages from a PDF.', route: '/tool/pdf-splitter', iconName: 'SplitSquareHorizontal', popularity: 82, requiresBackend: false, requiresAuth: false, keywords: ['pdf', 'split', 'extract'], implementationStatus: 'live', relatedTools: ['pdf-merger', 'pdf-to-jpg', 'image-to-pdf'] },
  { id: 'pdf-merger', name: 'PDF Merger', categoryId: 'pdf-document', description: 'Combine multiple PDFs into one document.', route: '/tool/pdf-merger', iconName: 'Combine', popularity: 81, requiresBackend: false, requiresAuth: false, keywords: ['pdf', 'merge', 'combine'], implementationStatus: 'live', relatedTools: ['pdf-splitter', 'image-to-pdf', 'jpg-to-pdf'] },
  { id: 'jpg-to-pdf', name: 'JPG → PDF', categoryId: 'pdf-document', description: 'Convert JPG images into a PDF file.', route: '/tool/jpg-to-pdf', iconName: 'FileText', popularity: 80, requiresBackend: false, requiresAuth: false, keywords: ['jpg', 'pdf', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['image-to-pdf', 'pdf-merger'] },
  { id: 'pdf-to-jpg', name: 'PDF → JPG', categoryId: 'pdf-document', description: 'Extract pages from PDF as JPG images.', route: '/tool/pdf-to-jpg', iconName: 'ImageIcon', popularity: 79, requiresBackend: false, requiresAuth: false, keywords: ['pdf', 'jpg', 'convert'], implementationStatus: 'live', relatedTools: ['pdf-merger', 'pdf-splitter', 'jpg-to-pdf'] },
  { id: 'excel-to-pdf', name: 'Excel → PDF', categoryId: 'pdf-document', description: 'Convert Excel spreadsheets to PDF.', route: '/tool/excel-to-pdf', iconName: 'FileText', popularity: 76, requiresBackend: true, requiresAuth: false, keywords: ['excel', 'pdf', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['excel-csv-cleaner'] },
  { id: 'powerpoint-to-pdf', name: 'PowerPoint → PDF', categoryId: 'pdf-document', description: 'Convert PowerPoint presentations to PDF.', route: '/tool/powerpoint-to-pdf', iconName: 'FileText', popularity: 75, requiresBackend: true, requiresAuth: false, keywords: ['powerpoint', 'pdf', 'convert'], implementationStatus: 'coming-soon', relatedTools: ['image-to-pdf'] },
  { id: 'ocr-image-pdf-to-text', name: 'OCR — Image/PDF → Text', categoryId: 'pdf-document', description: 'Extract text from images and scanned PDFs.', route: '/tool/ocr', iconName: 'Type', popularity: 74, requiresBackend: false, requiresAuth: false, keywords: ['ocr', 'text', 'extract'], implementationStatus: 'live', relatedTools: ['pdf-to-jpg', 'image-to-pdf', 'pdf-merger'] },

  // AUDIO
  { id: 'audio-converter', name: 'Audio Converter', categoryId: 'audio', description: 'Convert audio files between formats.', route: '/tool/audio-converter', iconName: 'ArrowRightLeft', popularity: 73, requiresBackend: false, requiresAuth: false, keywords: ['audio', 'convert'], implementationStatus: 'live', relatedTools: ['audio-compressor', 'audio-trimmer', 'video-to-mp3'], isBeta: true },
  { id: 'audio-compressor', name: 'Audio Compressor', categoryId: 'audio', description: 'Compress audio files to save space.', route: '/tool/audio-compressor', iconName: 'Minimize2', popularity: 72, requiresBackend: false, requiresAuth: false, keywords: ['audio', 'compress'], implementationStatus: 'coming-soon', relatedTools: ['audio-converter', 'audio-trimmer'] },
  { id: 'audio-trimmer', name: 'Audio Trimmer', categoryId: 'audio', description: 'Trim and cut audio files.', route: '/tool/audio-trimmer', iconName: 'Scissors', popularity: 71, requiresBackend: false, requiresAuth: false, keywords: ['audio', 'trim', 'cut'], implementationStatus: 'coming-soon', relatedTools: ['audio-compressor', 'audio-converter'] },
  { id: 'speech-to-text', name: 'Speech to Text (Transcribe)', categoryId: 'audio', description: 'Transcribe audio and video to text and subtitle files.', route: '/tool/speech-to-text', iconName: 'Type', popularity: 70, requiresBackend: false, requiresAuth: false, keywords: ['speech', 'transcribe', 'subtitles', 'srt', 'whisper', 'audio'], implementationStatus: 'coming-soon', relatedTools: ['audio-converter', 'video-to-mp3'] }
];

export const getToolById = (id: string) => TOOLS.find(t => t.id === id);
export const getToolsByCategory = (cat: string) => TOOLS.filter(t => t.categoryId === cat);
export const getPopularTools = () => [...TOOLS].sort((a, b) => b.popularity - a.popularity).slice(0, 8);