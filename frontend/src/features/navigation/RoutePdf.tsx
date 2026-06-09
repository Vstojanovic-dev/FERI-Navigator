import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Page,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type { AppLanguage } from '../../i18n/language';
import { translate } from '../../i18n/translate';
import type { NavigationRoute, RouteSegment, RouteStep } from '../../types/navigation';
import { getSegmentViewport } from './mapViewport';

Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  primary: '#172033',
  accent: '#f09d18',
  blue: '#2563eb',
  border: '#dde3ed',
  surface: '#f5f7fa',
  text: '#172033',
  textSecondary: '#5a6a82',
  white: '#ffffff',
  elevator: '#fef3c7',
  stairs: '#fce7f3',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.primary,
    lineHeight: 1.2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateBadge: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.primary,
  },
  summaryMeta: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  segmentContainer: {
    marginBottom: 20,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  segmentBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  segmentBadgeText: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.white,
  },
  segmentFloor: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.primary,
    flex: 1,
  },
  segmentBuilding: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  transportBadge: {
    flexDirection: 'row',
    gap: 4,
  },
  transportChip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  transportChipText: {
    fontSize: 8,
    fontWeight: 600,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surface,
  },
  mapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  mapSvgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  stepsContainer: {
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  stepRowElevator: {
    backgroundColor: COLORS.elevator,
    borderColor: '#fcd34d',
  },
  stepRowStairs: {
    backgroundColor: COLORS.stairs,
    borderColor: '#f9a8d4',
  },
  stepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.5,
  },
  stepTypeChip: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontWeight: 600,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  transitionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  transitionLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textSecondary,
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.textSecondary,
  },
});

function formatDate(language: AppLanguage): string {
  const now = new Date();
  return now.toLocaleDateString(language === 'en' ? 'en-GB' : 'sl-SI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stepTypeLabel(type: string, language: AppLanguage): string {
  switch (type) {
    case 'elevator':
      return translate(language, 'pdf.elevator');
    case 'stairs':
      return translate(language, 'pdf.stairs');
    default:
      return '';
  }
}

function stepCountLabel(count: number, language: AppLanguage): string {
  if (language === 'en') {
    return count === 1 ? translate(language, 'pdf.step.one') : translate(language, 'pdf.step.many');
  }
  if (count === 1) {
    return translate(language, 'pdf.step.one');
  }
  if (count < 5) {
    return translate(language, 'pdf.step.few');
  }
  return translate(language, 'pdf.step.many');
}

function pointsString(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function SegmentMapPdf({ segment, imageUrl }: { segment: RouteSegment; imageUrl: string }) {
  const allPoints = segment.path;
  const firstPoint = allPoints[0];
  const lastPoint = allPoints[allPoints.length - 1];
  const viewport = getSegmentViewport(segment);
  const fullPathStr = pointsString(allPoints);

  return (
    <View style={styles.mapContainer}>
      {imageUrl ? (
        <Image
          style={{
            ...styles.mapImage,
            width: `${viewport.imageScaleX * 100}%`,
            height: `${viewport.imageScaleY * 100}%`,
            left: `${viewport.imageTranslateXPercent}%`,
            top: `${viewport.imageTranslateYPercent}%`,
            maxWidth: 'none',
          }}
          src={imageUrl}
        />
      ) : null}

      <Svg
        viewBox={`${viewport.viewBoxX} ${viewport.viewBoxY} ${viewport.viewBoxWidth} ${viewport.viewBoxHeight}`}
        style={styles.mapSvgOverlay}
      >
        <Polyline
          points={fullPathStr}
          fill="none"
          stroke="#d6e0ec"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="14"
          opacity="0.78"
        />
        <Polyline
          points={fullPathStr}
          fill="none"
          stroke={COLORS.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="11"
          opacity="0.9"
        />

        {firstPoint ? <Circle cx={String(firstPoint.x)} cy={String(firstPoint.y)} r="13" fill={COLORS.primary} /> : null}
        {lastPoint ? <Circle cx={String(lastPoint.x)} cy={String(lastPoint.y)} r="13" fill={COLORS.accent} /> : null}

        {firstPoint && lastPoint && firstPoint !== lastPoint ? (
          <Line
            x1={String(firstPoint.x)}
            y1={String(firstPoint.y)}
            x2={String(lastPoint.x)}
            y2={String(lastPoint.y)}
            stroke={COLORS.blue}
            strokeWidth="2"
            opacity="0.25"
            strokeDasharray="6 4"
          />
        ) : null}
      </Svg>
    </View>
  );
}

function StepView({ step, language }: { step: RouteStep; language: AppLanguage }) {
  const isElevator = step.type === 'elevator';
  const isStairs = step.type === 'stairs';
  const typeLabel = stepTypeLabel(step.type, language);

  return (
    <View
      style={[
        styles.stepRow,
        isElevator ? styles.stepRowElevator : {},
        isStairs ? styles.stepRowStairs : {},
      ]}
    >
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step.index + 1}</Text>
      </View>
      <Text style={styles.stepText}>{step.text}</Text>
      {typeLabel ? <Text style={styles.stepTypeChip}>{typeLabel}</Text> : null}
    </View>
  );
}

function SegmentView({
  segment,
  segmentIndex,
  totalSegments,
  imageUrl,
  language,
}: {
  segment: RouteSegment;
  segmentIndex: number;
  totalSegments: number;
  imageUrl: string;
  language: AppLanguage;
}) {
  return (
    <View style={styles.segmentContainer}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentBadgeText}>
            {segmentIndex + 1}/{totalSegments}
          </Text>
        </View>
        <Text style={styles.segmentFloor}>{segment.floorLabel}</Text>
        <Text style={styles.segmentBuilding}>{segment.buildingName}</Text>
        {(segment.usesElevator || segment.usesStairs) && (
          <View style={styles.transportBadge}>
            {segment.usesElevator ? (
              <View style={[styles.transportChip, { backgroundColor: COLORS.elevator }]}>
                <Text style={[styles.transportChipText, { color: '#92400e' }]}>
                  {translate(language, 'pdf.elevator')}
                </Text>
              </View>
            ) : null}
            {segment.usesStairs ? (
              <View style={[styles.transportChip, { backgroundColor: COLORS.stairs }]}>
                <Text style={[styles.transportChipText, { color: '#9d174d' }]}>
                  {translate(language, 'pdf.stairs')}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <SegmentMapPdf segment={segment} imageUrl={imageUrl} />

      <View style={styles.stepsContainer}>
        {segment.steps.map((step) => (
          <StepView key={`${step.fromNodeId}-${step.toNodeId}-${step.index}`} step={step} language={language} />
        ))}
      </View>
    </View>
  );
}

function TransitionDivider({ fromFloor, toFloor }: { fromFloor: string; toFloor: string }) {
  return (
    <View style={styles.transitionRow}>
      <View style={styles.transitionLine} />
      <Text style={styles.transitionLabel}>
        {fromFloor}
        {' -> '}
        {toFloor}
      </Text>
      <View style={styles.transitionLine} />
    </View>
  );
}

type RoutePdfProps = {
  route: NavigationRoute;
  mapImageUrls: string[];
  language: AppLanguage;
};

function RoutePdf({ route, mapImageUrls, language }: RoutePdfProps) {
  const generatedAt = formatDate(language);
  const totalSteps = route.segments.reduce((sum, segment) => sum + segment.steps.length, 0);

  return (
    <Document
      title={`FERI Navigator - ${route.from.displayName} -> ${route.to.displayName}`}
      author="FERI Navigator"
      language={language}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appTitle}>FERI Navigator</Text>
            <Text style={styles.routeTitle}>
              {route.from.displayName}
              {' -> '}
              {route.to.displayName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateBadge}>
              {translate(language, 'pdf.printedAt')}: {generatedAt}
            </Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{translate(language, 'pdf.start')}</Text>
            <Text style={styles.summaryValue}>{route.from.displayName}</Text>
            <Text style={styles.summaryMeta}>
              {route.from.buildingName} - {route.from.floorLabel}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{translate(language, 'pdf.target')}</Text>
            <Text style={styles.summaryValue}>{route.to.displayName}</Text>
            <Text style={styles.summaryMeta}>
              {route.to.buildingName} - {route.to.floorLabel}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{translate(language, 'pdf.floors')}</Text>
            <Text style={styles.summaryValue}>{route.segments.length}</Text>
            <Text style={styles.summaryMeta}>
              {totalSteps} {stepCountLabel(totalSteps, language)}
            </Text>
          </View>
        </View>

        {route.segments.map((segment, index) => (
          <View key={`${segment.floorId}-${index}`}>
            {index > 0 ? (
              <TransitionDivider fromFloor={route.segments[index - 1].floorLabel} toFloor={segment.floorLabel} />
            ) : null}
            <SegmentView
              segment={segment}
              segmentIndex={index}
              totalSegments={route.segments.length}
              imageUrl={mapImageUrls[index] ?? ''}
              language={language}
            />
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            FERI Navigator - {route.from.buildingName}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export default RoutePdf;
