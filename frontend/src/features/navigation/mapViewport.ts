import type { RouteSegment } from '../../types/navigation';

type ImageViewport = {
  imageWidth: number;
  imageHeight: number;
  cropLeft: number;
  cropTop: number;
  cropWidth: number;
  cropHeight: number;
};

type ResolvedViewport = {
  aspectRatio: number;
  imageScaleX: number;
  imageScaleY: number;
  imageTranslateXPercent: number;
  imageTranslateYPercent: number;
  viewBoxX: number;
  viewBoxY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
};

const G2_VIEWPORT: ImageViewport = {
  imageWidth: 4961,
  imageHeight: 3508,
  cropLeft: 220,
  cropTop: 0,
  cropWidth: 3960,
  cropHeight: 2650,
};

export function getSegmentViewport(segment: RouteSegment): ResolvedViewport {
  const coordinateWidth =
    Number.isFinite(segment.coordinateWidth) && segment.coordinateWidth > 0
      ? segment.coordinateWidth
      : 1000;
  const coordinateHeight =
    Number.isFinite(segment.coordinateHeight) && segment.coordinateHeight > 0
      ? segment.coordinateHeight
      : 1000;
  const viewport = getHardcodedViewport(segment);

  if (!viewport) {
    return {
      aspectRatio: coordinateWidth / coordinateHeight,
      imageScaleX: 1,
      imageScaleY: 1,
      imageTranslateXPercent: 0,
      imageTranslateYPercent: 0,
      viewBoxX: 0,
      viewBoxY: 0,
      viewBoxWidth: coordinateWidth,
      viewBoxHeight: coordinateHeight,
    };
  }

  return {
    aspectRatio: viewport.cropWidth / viewport.cropHeight,
    imageScaleX: viewport.imageWidth / viewport.cropWidth,
    imageScaleY: viewport.imageHeight / viewport.cropHeight,
    imageTranslateXPercent: -(viewport.cropLeft / viewport.cropWidth) * 100,
    imageTranslateYPercent: -(viewport.cropTop / viewport.cropHeight) * 100,
    viewBoxX: (viewport.cropLeft / viewport.imageWidth) * coordinateWidth,
    viewBoxY: (viewport.cropTop / viewport.imageHeight) * coordinateHeight,
    viewBoxWidth: (viewport.cropWidth / viewport.imageWidth) * coordinateWidth,
    viewBoxHeight: (viewport.cropHeight / viewport.imageHeight) * coordinateHeight,
  };
}

function getHardcodedViewport(segment: RouteSegment): ImageViewport | null {
  if (segment.buildingCode === 'G2') {
    return G2_VIEWPORT;
  }

  return null;
}
