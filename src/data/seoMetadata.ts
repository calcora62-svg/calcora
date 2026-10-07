export interface ToolSeoData {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  howToUse: string[];
  faq: { q: string; a: string }[];
}

export const SEO_METADATA_REGISTRY: Record<string, ToolSeoData> = {
  'background-remover': {
    seoTitle: 'Free Background Remover Online - Calcora',
    seoDescription: 'Remove image backgrounds instantly with high precision in your browser. 100% private, browser-based local AI. No file uploads.',
    keywords: ['background remover', 'remove bg', 'transparent background', 'local ai', 'image editor', 'no upload'],
    howToUse: [
      'Upload any JPG, PNG, or WebP image from your device.',
      'Our local AI model will process the image directly in your browser.',
      'Adjust background colors (transparent, white, black) if needed.',
      'Click Download to save your background-free transparent PNG.'
    ],
    faq: [
      {
        q: 'Is my image uploaded to your servers?',
        a: 'No, never! Calcora Background Remover utilizes advanced local WebAssembly and machine learning to remove image backgrounds directly on your computer. Your files stay on your device.'
      },
      {
        q: 'Is this background remover free?',
        a: 'Yes! It is completely free to use with 5 free uses per day and no watermarks.'
      },
      {
        q: 'What types of images work best?',
        a: 'Images with a clear subject in the foreground (like portraits, pets, or products) and a distinct background yield the cleanest results.'
      }
    ]
  },
  'image-compressor': {
    seoTitle: 'Free Image Compressor Online - Calcora',
    seoDescription: 'Reduce image file sizes (PNG, JPEG, WebP) without losing quality. Complete local browser compression for maximum speed.',
    keywords: ['image compressor', 'compress png', 'shrink image size', 'reduce photo size', 'optimize image', 'free image compressor'],
    howToUse: [
      'Upload one or more images.',
      'Adjust the quality slider to balance size and visual fidelity.',
      'Watch the real-time file size reduction metrics.',
      'Download the compressed files instantly.'
    ],
    faq: [
      {
        q: 'How does local compression work?',
        a: 'Our compressor processes the pixels directly using your browser canvas APIs and advanced on-device compression codecs, keeping your images 100% private.'
      },
      {
        q: 'Is there a limit to how many images I can compress?',
        a: 'No! There are no limits or counters for local browser tool compression.'
      }
    ]
  },
  'video-compressor': {
    seoTitle: 'Free Video Compressor Online - Calcora',
    seoDescription: 'Compress and shrink MP4 or WebM video file sizes directly in your browser. Fast, local FFmpeg WebAssembly optimization.',
    keywords: ['video compressor', 'compress mp4', 'reduce video size', 'optimize video', 'shrink video file'],
    howToUse: [
      'Select the video file you want to compress from your device.',
      'Choose the compression speed or quality preset.',
      'Click Process to compress the file locally in your browser.',
      'Download the final optimized video file instantly.'
    ],
    faq: [
      {
        q: 'Are my uploaded videos secure?',
        a: 'Yes! All video compression runs 100% locally in your browser sandbox using WebAssembly. Your files are never uploaded to any external server.'
      },
      {
        q: 'Which video formats do you support?',
        a: 'We support popular formats including MP4, WebM, MOV, and AVI.'
      }
    ]
  },
  'excel-csv-cleaner': {
    seoTitle: 'Free Excel & CSV Cleaner Online - Calcora',
    seoDescription: 'Clean duplicate rows, remove blank rows and columns, trim spacing, and normalize text in your spreadsheet files locally and securely. Supports .xlsx, .xls, .csv, and .tsv.',
    keywords: ['excel cleaner', 'csv cleaner', 'remove duplicates', 'spreadsheet cleaner', 'deduplicate excel', 'trim whitespace', 'data cleaning'],
    howToUse: [
      'Upload your .xlsx, .xls, .csv, or .tsv spreadsheet file.',
      'Configure the cleanup actions: deduplicate, prune blank rows, normalize case, or format contacts.',
      'Choose column configurations to toggle fields or rename headers.',
      'Preview the cleaning statistics and download your optimized XLSX or CSV.'
    ],
    faq: [
      {
        q: 'Does my data leave my local machine?',
        a: 'Never. Calcora processes spreadsheet rows completely inside your local browser memory sandbox. No data is transmitted to server APIs.'
      },
      {
        q: 'How many rows can the cleaner process?',
        a: 'It handles large files gracefully up to 20MB. For extremely large sets, we recommend splitting them to avoid browser tab timeouts.'
      }
    ]
  },
  'product-photo-batch': {
    seoTitle: 'Free Product Photo Batch Tool - Calcora',
    seoDescription: 'Prepare multiple product photographs for e-commerce stores (Shopify, Amazon, Etsy) in a single batch workflow. Batch background removal, resizing, format conversion, and watermarking.',
    keywords: ['product photo batch', 'shopify image resizer', 'amazon product photo tool', 'batch background remover', 'etsy image optimizer', 'compress e-commerce images'],
    howToUse: [
      'Upload multiple product images (JPG, PNG, WebP).',
      'Select a platform target preset (Shopify, Amazon, Etsy, etc.) or configure a custom profile.',
      'Optionally enable local AI background removal, custom brand watermarks, or batch file renaming.',
      'Click Process Batch and download all ready-to-publish assets grouped in a single ZIP.'
    ],
    faq: [
      {
        q: 'Can I remove backgrounds on multiple images at once?',
        a: 'Yes! The tool leverages Calcora\'s on-device neural background remover to extract products and place them on pure white or transparent layers in batches.'
      },
      {
        q: 'Is there a file batch limit?',
        a: 'Free usage supports up to 5 images per batch. Subscribing to Calcora Premium unlocks larger file sizes and massive bulk processing capabilities.'
      }
    ]
  },
  'social-video-maker': {
    seoTitle: 'Free Social Video Maker & Subtitle Overlay - Calcora',
    seoDescription: 'Transform landscape clips into vertical 9:16 shorts, reels, or TikToks. Trim playback ranges, add caption banners, and style typography fully in your browser.',
    keywords: ['social video maker', 'make vertical video', 'add captions to video', 'trim video online', 'reels generator', 'tiktok video editor', 'subtitles overlay'],
    howToUse: [
      'Upload your video file (MP4, MOV, WebM).',
      'Select your platform ratio (9:16 for vertical, 1:1 for square, 16:9 for landscape).',
      'Trim the start and end range and set volume levels.',
      'Add, edit, or customize captions styling (text size, background box, color, alignment) and click Export.'
    ],
    faq: [
      {
        q: 'Does this crop videos locally?',
        a: 'Yes. Calcora renders crop boxes and styles subtitle overlays in real-time onto a standard browser canvas context, saving and exporting outputs completely client-side.'
      },
      {
        q: 'Do you offer auto-captioning?',
        a: 'Yes! You can instantly type manual caption banners or auto-generate transcription tags securely.'
      }
    ]
  }
};

/**
 * Returns SEO metadata for a given tool, falling back to default calculated SEO values if not explicitly registered.
 */
export const getSeoDataForTool = (toolId: string, toolName: string, toolDescription: string): ToolSeoData => {
  const registered = SEO_METADATA_REGISTRY[toolId];
  if (registered) return registered;

  // Dynamically generate high quality default SEO tags
  return {
    seoTitle: `${toolName} - Free Online Tool - Calcora`,
    seoDescription: `${toolDescription} Use Calcora's secure web tools. Safe, high performance, and elegantly designed.`,
    keywords: [toolName.toLowerCase(), 'online tool', 'calcora', 'free converter', 'productivity'],
    howToUse: [
      'Select or drag your file into the workspace upload area.',
      'Adjust tool configurations or quality parameters as desired.',
      'Wait a moment while the file processes.',
      'Download your final polished output instantly.'
    ],
    faq: [
      {
        q: `Is Calcora's ${toolName} free to use?`,
        a: `Yes! Our ${toolName} is fully functional, free, and designed for speed.`
      },
      {
        q: 'Are my files kept private?',
        a: 'Absolutely. All processing occurs locally on your device in your browser sandbox.'
      }
    ]
  };
};
