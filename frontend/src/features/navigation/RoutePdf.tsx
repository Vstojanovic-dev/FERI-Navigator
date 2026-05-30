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
import type { NavigationRoute, RouteSegment, RouteStep } from '../../types/navigation';

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
  stepActive: '#eef2ff',
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

  // Header
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

  // Route summary
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

  // Segment
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

  // Map
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

  // Steps
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

  // Segment divider
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

  // Footer
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString('sl-SI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stepTypeLabel(type: string): string {
  switch (type) {
    case 'elevator': return 'dvigalo';
    case 'stairs': return 'stopnice';
    default: return '';
  }
}

/**
 * Skalira koordinate iz koordinatnog prostora segmenta u PDF viewport (515 x 200pt).
 * @react-pdf/renderer Svg koristi viewBox, pa koristimo isti coordinateWidth/Height
 * kao viewBox — ništa ne treba skalirati ručno.
 */
function pointsString(
  points: Array<{ x: number; y: number }>,
): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

// ── Map komponenta za PDF ─────────────────────────────────────────────────────

/**
 * Renderuje pozadinsku sliku tlocrta + SVG overlay s rutom direktno u PDF-u.
 * Ne koristi html-to-image ni canvas capture — nema CORS problema.
 */
function SegmentMapPdf({ segment, imageUrl }: { segment: RouteSegment; imageUrl: string }) {
  const allPoints = segment.path;
  const firstPoint = allPoints[0];
  const lastPoint = allPoints[allPoints.length - 1];

  const vw = segment.coordinateWidth;
  const vh = segment.coordinateHeight;

  // Sve točke puta kao string za Polyline
  const fullPathStr = pointsString(allPoints);

  return (
    <View style={styles.mapContainer}>
      {/* Slika tlocrta */}
      {imageUrl ? (
        <Image style={styles.mapImage} src={imageUrl} />
      ) : null}

      {/* SVG overlay — isti viewBox kao koordinatni prostor segmenta */}
      <Svg
        viewBox={`0 0 ${vw} ${vh}`}
        style={styles.mapSvgOverlay}
      >
        {/* Siva pozadinska linija puta */}
        <Polyline
          points={fullPathStr}
          fill="none"
          stroke="#d6e0ec"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="14"
          opacity="0.78"
        />

        {/* Narandžasta linija — cijela ruta (aktivna) */}
        <Polyline
          points={fullPathStr}
          fill="none"
          stroke="#f09d18"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="11"
          opacity="0.9"
        />

        {/* Marker A — početak */}
        {firstPoint && (
          <>
            <Circle
              cx={String(firstPoint.x)}
              cy={String(firstPoint.y)}
              r="13"
              fill={COLORS.primary}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: 800,
                fill: COLORS.white,
                // react-pdf SVG text nema direktan x/y na komponenti —
                // koristimo Transform za pozicioniranje
              }}
            >
            </Text>
          </>
        )}

        {/* Marker B — kraj */}
        {lastPoint && (
          <Circle
            cx={String(lastPoint.x)}
            cy={String(lastPoint.y)}
            r="13"
            fill="#f09d18"
          />
        )}

        {/* Linija između prvog i zadnjeg koraka za orijentaciju */}
        {firstPoint && lastPoint && firstPoint !== lastPoint && (
          <Line
            x1={String(firstPoint.x)}
            y1={String(firstPoint.y)}
            x2={String(lastPoint.x)}
            y2={String(lastPoint.y)}
            stroke="#2563eb"
            strokeWidth="2"
            opacity="0.25"
            strokeDasharray="6 4"
          />
        )}
      </Svg>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentView({
  segment,
  segmentIndex,
  totalSegments,
  imageUrl,
}: {
  segment: RouteSegment;
  segmentIndex: number;
  totalSegments: number;
  imageUrl: string;
}) {
  return (
    <View style={styles.segmentContainer}>
      {/* Segment header */}
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
            {segment.usesElevator && (
              <View style={[styles.transportChip, { backgroundColor: COLORS.elevator }]}>
                <Text style={[styles.transportChipText, { color: '#92400e' }]}>dvigalo</Text>
              </View>
            )}
            {segment.usesStairs && (
              <View style={[styles.transportChip, { backgroundColor: COLORS.stairs }]}>
                <Text style={[styles.transportChipText, { color: '#9d174d' }]}>stopnice</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Mapa segmenta */}
      <SegmentMapPdf segment={segment} imageUrl={imageUrl} />

      {/* Koraci */}
      <View style={styles.stepsContainer}>
        {segment.steps.map((step) => (
          <StepView
            key={`${step.fromNodeId}-${step.toNodeId}-${step.index}`}
            step={step}
          />
        ))}
      </View>
    </View>
  );
}

function StepView({ step }: { step: RouteStep }) {
  const isElevator = step.type === 'elevator';
  const isStairs = step.type === 'stairs';
  const typeLabel = stepTypeLabel(step.type);

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
      {typeLabel ? (
        <Text style={styles.stepTypeChip}>{typeLabel}</Text>
      ) : null}
    </View>
  );
}

function TransitionDivider({ fromFloor, toFloor }: { fromFloor: string; toFloor: string }) {
  return (
    <View style={styles.transitionRow}>
      <View style={styles.transitionLine} />
      <Text style={styles.transitionLabel}>
        {fromFloor} → {toFloor}
      </Text>
      <View style={styles.transitionLine} />
    </View>
  );
}

// ── Main PDF Document ─────────────────────────────────────────────────────────

type RoutePdfProps = {
  route: NavigationRoute;
  /**
   * Apsolutni URL-ovi slika tlocrta po segmentu — isti koji se koriste u
   * RouteMap (`resolveAssetUrl(segment.mapImageUrl)`).
   * Proslijediti ih ovdje znači da @react-pdf/renderer može fetchati slike
   * direktno bez CORS problema (server mora imati CORS headere za PDF fetch,
   * ili koristiti proxy — vidi useRoutePdf).
   */
  mapImageUrls: string[];
};

function RoutePdf({ route, mapImageUrls }: RoutePdfProps) {
  const generatedAt = formatDate();
  const totalSteps = route.segments.reduce((sum, seg) => sum + seg.steps.length, 0);

  return (
    <Document
      title={`FERI Navigator — ${route.from.displayName} → ${route.to.displayName}`}
      author="FERI Navigator"
      language="sl"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appTitle}>FERI Navigator</Text>
            <Text style={styles.routeTitle}>
              {route.from.displayName} → {route.to.displayName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateBadge}>Natisnjeno: {generatedAt}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Začetek</Text>
            <Text style={styles.summaryValue}>{route.from.displayName}</Text>
            <Text style={styles.summaryMeta}>
              {route.from.buildingName} · {route.from.floorLabel}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Cilj</Text>
            <Text style={styles.summaryValue}>{route.to.displayName}</Text>
            <Text style={styles.summaryMeta}>
              {route.to.buildingName} · {route.to.floorLabel}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Nadstropja</Text>
            <Text style={styles.summaryValue}>{route.segments.length}</Text>
            <Text style={styles.summaryMeta}>
              {totalSteps}{' '}
              {totalSteps === 1 ? 'korak' : totalSteps < 5 ? 'koraki' : 'korakov'}
            </Text>
          </View>
        </View>

        {/* Segmenti s mapom i koraci */}
        {route.segments.map((segment, index) => (
          <View key={`${segment.floorId}-${index}`}>
            {index > 0 && (
              <TransitionDivider
                fromFloor={route.segments[index - 1].floorLabel}
                toFloor={segment.floorLabel}
              />
            )}
            <SegmentView
              segment={segment}
              segmentIndex={index}
              totalSegments={route.segments.length}
              imageUrl={mapImageUrls[index] ?? ''}
            />
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            FERI Navigator · {route.from.buildingName}
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
