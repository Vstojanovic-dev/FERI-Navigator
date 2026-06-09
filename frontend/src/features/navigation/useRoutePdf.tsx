import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useI18n } from '../../i18n/useI18n';
import { resolveAssetUrl } from '../../services/api';
import type { NavigationRoute } from '../../types/navigation';
import RoutePdf from './RoutePdf';

type UseRoutePdfResult = {
  isGenerating: boolean;
  downloadPdf: (route: NavigationRoute) => Promise<void>;
};

async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) return '';
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export function useRoutePdf(): UseRoutePdfResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const { language } = useI18n();

  const downloadPdf = async (route: NavigationRoute) => {
    setIsGenerating(true);
    try {
      const mapImageUrls = await Promise.all(
        route.segments.map(async (segment) => {
          if (!segment.mapImageUrl) return '';
          const absoluteUrl = resolveAssetUrl(segment.mapImageUrl);
          if (!absoluteUrl) return '';
          return imageUrlToBase64(absoluteUrl);
        })
      );

      const blob = await pdf(<RoutePdf route={route} mapImageUrls={mapImageUrls} language={language} />).toBlob();

      const url = URL.createObjectURL(blob);

      const fromSlug = route.from.displayName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const toSlug = route.to.displayName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const link = document.createElement('a');
      link.href = url;
      link.download = `${language === 'en' ? 'feri-route' : 'feri-pot'}-${fromSlug}-${toSlug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, downloadPdf };
}
