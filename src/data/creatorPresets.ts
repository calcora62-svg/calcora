export interface CreatorPreset {
  id: string;
  width: number;
  height: number;
  aspectRatio: string; // e.g. "16:9", "1:1", "4:5", "9:16"
  label: string;       // e.g. "YouTube Thumbnail", "Instagram Square"
  platform: 'youtube' | 'instagram' | 'tiktok' | 'general';
  notes: string;
}

export const creatorPresets: Record<string, CreatorPreset> = {
  youtubeThumbnail: {
    id: 'youtubeThumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    label: 'YouTube Thumbnail',
    platform: 'youtube',
    notes: 'Recommended: 1280x720, aspect ratio 16:9, max 2MB, formats: JPG, PNG, GIF, WebP.'
  },
  instagramSquare: {
    id: 'instagramSquare',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    label: 'Instagram Square Feed',
    platform: 'instagram',
    notes: 'Standard grid format: 1080x1080 pixels (1:1 aspect ratio).'
  },
  instagramPortrait: {
    id: 'instagramPortrait',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    label: 'Instagram Portrait Feed',
    platform: 'instagram',
    notes: 'Vertical portrait format: 1080x1350 pixels (4:5 aspect ratio).'
  },
  instagramLandscape: {
    id: 'instagramLandscape',
    width: 1080,
    height: 608,
    aspectRatio: '1.91:1',
    label: 'Instagram Landscape Feed',
    platform: 'instagram',
    notes: 'Horizontal landscape format: 1080x608 pixels (16:9 or 1.91:1 aspect ratio).'
  },
  instagramStory: {
    id: 'instagramStory',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    label: 'Instagram Story / Reel',
    platform: 'instagram',
    notes: 'Vertical fullscreen format: 1080x1920 pixels (9:16 aspect ratio). Keep text away from top and bottom 250px.'
  },
  tiktokCover: {
    id: 'tiktokCover',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    label: 'TikTok Video Cover',
    platform: 'tiktok',
    notes: 'Vertical fullscreen cover: 1080x1920 pixels (9:16 aspect ratio).'
  }
};

export const getPresetById = (id: string): CreatorPreset | undefined => creatorPresets[id];
export const getPresetsByPlatform = (platform: CreatorPreset['platform']) => 
  Object.values(creatorPresets).filter(preset => preset.platform === platform);
