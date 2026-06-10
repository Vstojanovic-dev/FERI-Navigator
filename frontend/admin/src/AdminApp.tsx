import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { ADMIN_API_BASE_URL } from './config';
import { SUPPORTED_LANGUAGES } from './i18n/language';
import { getCurrentLanguage } from './i18n/runtimeLanguage';
import { translate } from './i18n/translate';
import { useI18n } from './i18n/useI18n';

type FloorOption = {
  floorId: number;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorCode: string;
  floorLabel: string;
  levelNumber: number;
  mapImageUrl: string;
  coordinateWidth: number;
  coordinateHeight: number;
  z: number;
};

type LookupOption = {
  id: number;
  code: string;
  name: string;
  description: string | null;
};

type EditorNode = {
  id: number;
  floorId: number;
  externalId: string;
  label: string | null;
  nodeTypeCode: string;
  nodeTypeId: number;
  spaceId: number | null;
  isWaypoint: boolean;
  isPublic: boolean;
  x: number;
  y: number;
  z: number;
  hasCrossFloorConnections: boolean;
};

type EditorEdge = {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  edgeTypeCode: string;
  edgeTypeId: number;
  weight: number;
  isBidirectional: boolean;
  isCrossFloor: boolean;
  isCrossBuilding: boolean;
  instructionForward: string | null;
  instructionBackward: string | null;
  landmark: string | null;
  fromFloorId: number;
  toFloorId: number;
  fromNodeLabel: string | null;
  toNodeLabel: string | null;
  fromNodeExternalId: string;
  toNodeExternalId: string;
};

type FloorView = {
  floorId: number;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorCode: string;
  floorLabel: string;
  mapImageUrl: string;
  coordinateWidth: number;
  coordinateHeight: number;
  z: number;
};

type GraphResponse = {
  floor: FloorView;
  nodes: EditorNode[];
  edges: EditorEdge[];
};

type NavigationLocation = {
  id: number;
  displayName: string;
  locationType: string;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorId: number;
  floorCode: string;
  floorLabel: string;
  nodeId: number | null;
  hasNode: boolean;
};

type RoutePoint = {
  nodeId: number;
  externalId: string;
  label: string;
  nodeType: string;
  x: number;
  y: number;
  z: number;
};

type RouteStep = {
  index: number;
  text: string;
  fromNodeId: number;
  toNodeId: number;
  type: string;
};

type RouteSegment = {
  index: number;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorId: number;
  floorCode: string;
  floorLabel: string;
  mapImageUrl: string;
  coordinateWidth: number;
  coordinateHeight: number;
  z: number;
  usesElevator: boolean;
  usesStairs: boolean;
  path: RoutePoint[];
  steps: RouteStep[];
};

type NavigationRoute = {
  routeId: string;
  from: NavigationLocation;
  to: NavigationLocation;
  totalCost: number;
  segments: RouteSegment[];
};

type EditorTool = 'select' | 'add-node' | 'connect' | 'delete';

type NodeFormState = {
  kind: 'create' | 'edit';
  nodeId?: number;
  floorId: number;
  label: string;
  externalId: string;
  nodeTypeCode: string;
  isWaypoint: boolean;
  isPublic: boolean;
  x: number;
  y: number;
  z: number;
  spaceId: string;
};

type EdgeFormState = {
  kind: 'create' | 'edit';
  edgeId?: number;
  fromNodeId: number;
  toNodeId: number;
  fromLabel: string;
  toLabel: string;
  edgeTypeCode: string;
  isBidirectional: boolean;
  isCrossFloor: boolean;
  isCrossBuilding: boolean;
  instructionForward: string;
  instructionBackward: string;
  landmark: string;
};

type DragState = {
  nodeId: number;
  startX: number;
  startY: number;
};

const nodeColors: Record<string, string> = {
  room: '#d97706',
  elevator: '#2563eb',
  stairs: '#15803d',
  corridor: '#475569',
  waypoint: '#94a3b8',
  wc: '#dc2626',
  entrance: '#0f766e',
  exit: '#6d28d9',
  building_transfer: '#be123c',
};

function buildTools(
  t: ReturnType<typeof useI18n>['t']
): Array<{ id: EditorTool; label: string; icon: string }> {
  return [
    { id: 'select', label: t('admin.tool.select'), icon: 'V' },
    { id: 'add-node', label: t('admin.tool.addNode'), icon: '+' },
    { id: 'connect', label: t('admin.tool.connect'), icon: '-' },
    { id: 'delete', label: t('admin.tool.delete'), icon: 'X' },
  ];
}

function AdminApp() {
  const { language, setLanguage, t } = useI18n();
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [nodeTypes, setNodeTypes] = useState<LookupOption[]>([]);
  const [edgeTypes, setEdgeTypes] = useState<LookupOption[]>([]);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [tool, setTool] = useState<EditorTool>('select');
  const [nodeForm, setNodeForm] = useState<NodeFormState | null>(null);
  const [edgeForm, setEdgeForm] = useState<EdgeFormState | null>(null);
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<number | null>(null);
  const [connectTargetFloorId, setConnectTargetFloorId] = useState<number | null>(null);
  const [connectTargetNodeId, setConnectTargetNodeId] = useState<number | null>(null);
  const [connectTargetNodes, setConnectTargetNodes] = useState<EditorNode[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<Record<number, { x: number; y: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirtySinceExport, setDirtySinceExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSql, setExportSql] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const noticeId = useId();
  const tools = useMemo(() => buildTools(t), [t]);

  const buildingOptions = useMemo(() => {
    const seen = new Map<number, { id: number; code: string; name: string }>();
    for (const floor of floors) {
      seen.set(floor.buildingId, {
        id: floor.buildingId,
        code: floor.buildingCode,
        name: floor.buildingName,
      });
    }
    return [...seen.values()];
  }, [floors]);

  const availableFloors = useMemo(() => {
    return selectedBuildingId == null
      ? []
      : floors.filter((floor) => floor.buildingId === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  const sameFloorEdges = useMemo(() => {
    if (!graph) {
      return [];
    }
    return graph.edges.filter(
      (edge) => edge.fromFloorId === graph.floor.floorId && edge.toFloorId === graph.floor.floorId
    );
  }, [graph]);

  const crossFloorEdges = useMemo(() => {
    if (!graph) {
      return [];
    }
    return graph.edges.filter(
      (edge) => edge.fromFloorId !== graph.floor.floorId || edge.toFloorId !== graph.floor.floorId
    );
  }, [graph]);

  const selectedNode = useMemo(() => {
    return graph?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [graph, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    return graph?.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  }, [graph, selectedEdgeId]);

  const loadGraph = useCallback(async (floorId: number) => {
    setError('');
    const nextGraph = await apiFetch<GraphResponse>(
      `/api/admin/map-editor/floors/${floorId}/graph`
    );
    setGraph(nextGraph);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true);
        const [nextFloors, nextNodeTypes, nextEdgeTypes] = await Promise.all([
          apiFetch<FloorOption[]>('/api/admin/map-editor/floors'),
          apiFetch<LookupOption[]>('/api/admin/map-editor/lookup/node-types'),
          apiFetch<LookupOption[]>('/api/admin/map-editor/lookup/edge-types'),
        ]);
        setFloors(nextFloors);
        setNodeTypes(nextNodeTypes);
        setEdgeTypes(nextEdgeTypes);
        if (nextFloors[0]) {
          setSelectedBuildingId(nextFloors[0].buildingId);
          setSelectedFloorId(nextFloors[0].floorId);
          await loadGraph(nextFloors[0].floorId);
        }
      } catch (bootstrapError) {
        setError(asMessage(bootstrapError, t('errors.adminLoad')));
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [loadGraph, t]);

  useEffect(() => {
    if (selectedBuildingId == null || availableFloors.length === 0) {
      return;
    }
    if (!availableFloors.some((floor) => floor.floorId === selectedFloorId)) {
      setSelectedFloorId(availableFloors[0].floorId);
    }
  }, [availableFloors, selectedBuildingId, selectedFloorId]);

  useEffect(() => {
    if (selectedFloorId == null) {
      return;
    }
    void loadGraph(selectedFloorId).catch((loadError) => {
      setError(asMessage(loadError, t('errors.floorGraphLoad')));
    });
  }, [loadGraph, selectedFloorId, t]);

  useEffect(() => {
    if (!selectedNode) {
      if (selectedNodeId != null) {
        setSelectedNodeId(null);
      }
      return;
    }
    setNodeForm(toNodeForm(selectedNode));
    setEdgeForm(null);
  }, [selectedNode, selectedNodeId]);

  useEffect(() => {
    if (!selectedEdge) {
      if (selectedEdgeId != null) {
        setSelectedEdgeId(null);
      }
      return;
    }
    setEdgeForm(toEdgeForm(selectedEdge));
    setNodeForm(null);
  }, [selectedEdge, selectedEdgeId]);

  useEffect(() => {
    if (connectSourceNodeId == null || connectTargetFloorId == null) {
      setConnectTargetNodes([]);
      setConnectTargetNodeId(null);
      return;
    }

    if (graph && connectTargetFloorId === graph.floor.floorId) {
      setConnectTargetNodes(graph.nodes.filter((node) => node.id !== connectSourceNodeId));
      return;
    }

    const loadTargetNodes = async () => {
      try {
        const targetGraph = await apiFetch<GraphResponse>(
          `/api/admin/map-editor/floors/${connectTargetFloorId}/graph`
        );
        setConnectTargetNodes(targetGraph.nodes);
      } catch (targetError) {
        setError(asMessage(targetError, t('errors.targetNodesLoad')));
      }
    };

    void loadTargetNodes();
  }, [connectSourceNodeId, connectTargetFloorId, graph, t]);

  useEffect(() => {
    if (!dragState || !graph) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const point = getSvgPoint(event.clientX, event.clientY, svgRef.current, graph.floor);
      if (!point) {
        return;
      }
      setDragPreview((current) => ({
        ...current,
        [dragState.nodeId]: point,
      }));
    };

    const handleUp = async () => {
      const preview = dragPreview[dragState.nodeId];
      const node = graph.nodes.find((item) => item.id === dragState.nodeId);
      setDragState(null);

      if (!preview || !node) {
        setDragPreview({});
        return;
      }

      if (
        Math.abs(preview.x - dragState.startX) < 0.5 &&
        Math.abs(preview.y - dragState.startY) < 0.5
      ) {
        setDragPreview({});
        return;
      }

      try {
        setIsSaving(true);
        await apiFetch<EditorNode>(`/api/admin/map-editor/nodes/${node.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...toNodePayload(node),
            x: round2(preview.x),
            y: round2(preview.y),
          }),
        });
        setDirtySinceExport(true);
        setNotice(t('notice.nodeDragged'));
        await loadGraph(graph.floor.floorId);
      } catch (saveError) {
        setError(asMessage(saveError, t('errors.dragSave')));
      } finally {
        setIsSaving(false);
        setDragPreview({});
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragPreview, dragState, graph, loadGraph, t]);

  const clearSelection = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeForm(null);
    setEdgeForm(null);
  };

  const handleToolChange = (nextTool: EditorTool) => {
    setTool(nextTool);
    setConnectSourceNodeId(null);
    setConnectTargetFloorId(graph?.floor.floorId ?? null);
    setConnectTargetNodeId(null);
    if (nextTool !== 'select') {
      clearSelection();
    }
  };

  const handleMapClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!graph || tool !== 'add-node') {
      return;
    }
    const point = getSvgPoint(event.clientX, event.clientY, svgRef.current, graph.floor);
    if (!point) {
      return;
    }
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
    setNodeForm({
      kind: 'create',
      floorId: graph.floor.floorId,
      label: '',
      externalId: '',
      nodeTypeCode:
        nodeTypes.find((type) => type.code === 'waypoint')?.code ??
        nodeTypes[0]?.code ??
        'waypoint',
      isWaypoint: true,
      isPublic: true,
      x: round2(point.x),
      y: round2(point.y),
      z: graph.floor.z,
      spaceId: '',
    });
  };

  const handleNodeMouseDown = (node: EditorNode, event: ReactMouseEvent<SVGCircleElement>) => {
    event.stopPropagation();
    if (tool === 'connect') {
      handleConnectNode(node);
      return;
    }
    if (tool === 'delete') {
      void deleteNode(node);
      return;
    }
    if (tool !== 'select') {
      return;
    }
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setDragState({ nodeId: node.id, startX: node.x, startY: node.y });
  };

  const handleEdgeClick = (
    edge: EditorEdge,
    event?: ReactMouseEvent<SVGElement | HTMLButtonElement>
  ) => {
    event?.stopPropagation();
    if (tool === 'delete') {
      void deleteEdge(edge);
      return;
    }
    if (tool !== 'select') {
      return;
    }
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  };

  const handleConnectNode = (node: EditorNode) => {
    if (!graph) {
      return;
    }

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeForm(null);

    if (connectSourceNodeId == null) {
      setConnectSourceNodeId(node.id);
      setConnectTargetFloorId(graph.floor.floorId);
      setNotice(t('notice.sourceNodeSelected', { id: node.externalId }));
      return;
    }

    if (connectSourceNodeId === node.id) {
      return;
    }

    const sourceNode = graph.nodes.find((item) => item.id === connectSourceNodeId);
    if (sourceNode) {
      openCreateEdgeForm(sourceNode, node);
    }
  };

  const openCreateEdgeForm = (fromNode: EditorNode, toNode: EditorNode) => {
    const crossFloor = fromNode.floorId !== toNode.floorId;
    setEdgeForm({
      kind: 'create',
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      fromLabel: fromNode.externalId,
      toLabel: toNode.externalId,
      edgeTypeCode:
        edgeTypes.find((type) => (crossFloor ? type.code === 'elevator' : type.code === 'corridor'))
          ?.code ??
        edgeTypes[0]?.code ??
        'corridor',
      isBidirectional: true,
      isCrossFloor: crossFloor,
      isCrossBuilding: false,
      instructionForward: '',
      instructionBackward: '',
      landmark: '',
    });
    setConnectSourceNodeId(null);
    setConnectTargetNodeId(null);
  };

  const prepareCrossFloorEdge = () => {
    if (!graph || connectSourceNodeId == null || connectTargetNodeId == null) {
      return;
    }
    const sourceNode = graph.nodes.find((node) => node.id === connectSourceNodeId);
    const targetNode = connectTargetNodes.find((node) => node.id === connectTargetNodeId);
    if (sourceNode && targetNode) {
      openCreateEdgeForm(sourceNode, targetNode);
    }
  };

  const saveNode = async () => {
    if (!nodeForm || !graph) {
      return;
    }
    try {
      setIsSaving(true);
      const response = await apiFetch<EditorNode>(
        nodeForm.kind === 'create'
          ? '/api/admin/map-editor/nodes'
          : `/api/admin/map-editor/nodes/${nodeForm.nodeId}`,
        {
          method: nodeForm.kind === 'create' ? 'POST' : 'PATCH',
          body: JSON.stringify({
            floorId: nodeForm.floorId,
            label: emptyToNull(nodeForm.label),
            externalId: emptyToNull(nodeForm.externalId),
            nodeTypeCode: nodeForm.nodeTypeCode,
            x: nodeForm.x,
            y: nodeForm.y,
            isWaypoint: nodeForm.isWaypoint,
            isPublic: nodeForm.isPublic,
            spaceId: nodeForm.spaceId.trim() ? Number(nodeForm.spaceId) : null,
          }),
        }
      );
      setDirtySinceExport(true);
      setNotice(t(nodeForm.kind === 'create' ? 'notice.nodeCreated' : 'notice.nodeSaved'));
      setSelectedNodeId(response.id);
      await loadGraph(graph.floor.floorId);
    } catch (saveError) {
      setError(asMessage(saveError, t('errors.nodeSave')));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNode = async (node: EditorNode | null = selectedNode) => {
    if (!node || !window.confirm(t('confirm.deleteNode', { id: node.externalId }))) {
      return;
    }
    try {
      setIsSaving(true);
      await apiFetch(`/api/admin/map-editor/nodes/${node.id}`, { method: 'DELETE' });
      setDirtySinceExport(true);
      setNotice(t('notice.nodeDeleted'));
      clearSelection();
      if (graph) {
        await loadGraph(graph.floor.floorId);
      }
    } catch (deleteError) {
      setError(asMessage(deleteError, t('errors.nodeDelete')));
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdge = async () => {
    if (!edgeForm || !graph) {
      return;
    }
    try {
      setIsSaving(true);
      const response = await apiFetch<EditorEdge>(
        edgeForm.kind === 'create'
          ? '/api/admin/map-editor/edges'
          : `/api/admin/map-editor/edges/${edgeForm.edgeId}`,
        {
          method: edgeForm.kind === 'create' ? 'POST' : 'PATCH',
          body: JSON.stringify({
            fromNodeId: edgeForm.fromNodeId,
            toNodeId: edgeForm.toNodeId,
            edgeTypeCode: edgeForm.edgeTypeCode,
            isBidirectional: edgeForm.isBidirectional,
            isCrossFloor: edgeForm.isCrossFloor,
            isCrossBuilding: edgeForm.isCrossBuilding,
            instructionForward: emptyToNull(edgeForm.instructionForward),
            instructionBackward: emptyToNull(edgeForm.instructionBackward),
            landmark: emptyToNull(edgeForm.landmark),
          }),
        }
      );
      setDirtySinceExport(true);
      setNotice(t(edgeForm.kind === 'create' ? 'notice.edgeCreated' : 'notice.edgeSaved'));
      setSelectedEdgeId(response.id);
      await loadGraph(graph.floor.floorId);
    } catch (saveError) {
      setError(asMessage(saveError, t('errors.edgeSave')));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEdge = async (edge: EditorEdge | null = selectedEdge) => {
    if (
      !edge ||
      !window.confirm(
        t('confirm.deleteEdge', {
          from: edge.fromNodeExternalId,
          to: edge.toNodeExternalId,
        })
      )
    ) {
      return;
    }
    try {
      setIsSaving(true);
      await apiFetch(`/api/admin/map-editor/edges/${edge.id}`, { method: 'DELETE' });
      setDirtySinceExport(true);
      setNotice(t('notice.edgeDeleted'));
      clearSelection();
      if (graph) {
        await loadGraph(graph.floor.floorId);
      }
    } catch (deleteError) {
      setError(asMessage(deleteError, t('errors.edgeDelete')));
    } finally {
      setIsSaving(false);
    }
  };

  const exportCurrentSql = async () => {
    try {
      setIsExporting(true);
      const sql = await apiFetchText('/api/admin/map-editor/export/sql');
      setExportSql(sql);
      setDirtySinceExport(false);
      setNotice(t('admin.exportSql'));
    } catch (exportError) {
      setError(asMessage(exportError, t('errors.exportCreate')));
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = () => {
    if (!exportSql) {
      return;
    }
    const blob = new Blob([exportSql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '006_admin_navigation_graph.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <main className="loading-state">{t('admin.loading')}</main>;
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1>{t('admin.title')}</h1>
        </div>
        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={t('admin.languageSwitch')}>
            {SUPPORTED_LANGUAGES.map((option) => (
              <button
                key={option}
                type="button"
                className={language === option ? 'language-button active' : 'language-button'}
                aria-pressed={language === option}
                onClick={() => setLanguage(option)}
              >
                {t(option === 'sl' ? 'language.sl' : 'language.en')}
              </button>
            ))}
          </div>
          <span className={dirtySinceExport ? 'dirty-pill dirty' : 'dirty-pill'}>
            {dirtySinceExport ? t('admin.unexportedChanges') : t('admin.exportUpToDate')}
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={exportCurrentSql}
            disabled={isExporting}
          >
            {isExporting ? t('admin.exporting') : t('admin.exportSql')}
          </button>
        </div>
      </header>

      <section className="notice-banner" aria-labelledby={noticeId}>
        <strong id={noticeId}>{t('admin.noticeTitle')}</strong> {t('admin.noticeText')}
      </section>

      {(error || notice) && (
        <section className="status-row">
          {error && <p className="error-text">{error}</p>}
          {notice && <p className="notice-text">{notice}</p>}
        </section>
      )}

      <section className="editor-shell">
        <aside className="tool-rail" aria-label={t('admin.toolsLabel')}>
          {tools.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tool === item.id ? 'tool-button active' : 'tool-button'}
              title={item.label}
              onClick={() => handleToolChange(item.id)}
            >
              <span>{item.icon}</span>
            </button>
          ))}
        </aside>

        <section className="map-workspace">
          <div className="floor-toolbar">
            <select
              value={selectedBuildingId ?? ''}
              onChange={(event) => {
                setSelectedBuildingId(Number(event.target.value));
                clearSelection();
              }}
            >
              {buildingOptions.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.code} - {building.name}
                </option>
              ))}
            </select>
            <select
              value={selectedFloorId ?? ''}
              onChange={(event) => {
                setSelectedFloorId(Number(event.target.value));
                clearSelection();
              }}
            >
              {availableFloors.map((floor) => (
                <option key={floor.floorId} value={floor.floorId}>
                  {floor.floorLabel}
                </option>
              ))}
            </select>
            <span className="graph-count">
              {graph
                ? t('admin.mapStats', {
                    nodes: graph.nodes.length,
                    edges: sameFloorEdges.length,
                  })
                : t('admin.noGraph')}
            </span>
          </div>

          <div className="map-frame">
            {graph ? (
              <>
                <img
                  className="map-image"
                  src={resolveAssetUrl(graph.floor.mapImageUrl)}
                  alt={`${graph.floor.buildingName} ${graph.floor.floorLabel}`}
                />
                <svg
                  ref={svgRef}
                  className="map-overlay"
                  viewBox={`0 0 ${graph.floor.coordinateWidth} ${graph.floor.coordinateHeight}`}
                  onClick={handleMapClick}
                >
                  {sameFloorEdges.map((edge) => {
                    const from = graph.nodes.find((node) => node.id === edge.fromNodeId);
                    const to = graph.nodes.find((node) => node.id === edge.toNodeId);
                    if (!from || !to) {
                      return null;
                    }
                    return (
                      <line
                        key={edge.id}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        className={selectedEdgeId === edge.id ? 'edge-line selected' : 'edge-line'}
                        onClick={(event) => handleEdgeClick(edge, event)}
                      />
                    );
                  })}

                  {graph.nodes.map((node) => {
                    const preview = dragPreview[node.id];
                    const x = preview?.x ?? node.x;
                    const y = preview?.y ?? node.y;
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r={selectedNodeId === node.id || connectSourceNodeId === node.id ? 12 : 8}
                          fill={nodeColors[node.nodeTypeCode] ?? '#334155'}
                          className={selectedNodeId === node.id ? 'node-dot selected' : 'node-dot'}
                          onMouseDown={(event) => handleNodeMouseDown(node, event)}
                        />
                        {selectedNodeId === node.id || connectSourceNodeId === node.id ? (
                          <text x={x + 14} y={y - 12} className="node-label">
                            {node.label || node.externalId}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
              </>
            ) : (
              <div className="empty-map">{t('admin.graphEmpty')}</div>
            )}
          </div>
        </section>

        <aside className="inspector">
          <section className="panel">
            <div className="panel-title-row">
              <h2>{t('admin.inspector')}</h2>
              <span>{tool}</span>
            </div>
            {tool === 'connect' ? (
              <ConnectPanel
                graph={graph}
                floors={floors}
                connectSourceNodeId={connectSourceNodeId}
                connectTargetFloorId={connectTargetFloorId}
                connectTargetNodeId={connectTargetNodeId}
                connectTargetNodes={connectTargetNodes}
                onTargetFloorChange={setConnectTargetFloorId}
                onTargetNodeChange={setConnectTargetNodeId}
                onPrepare={prepareCrossFloorEdge}
              />
            ) : null}
            {nodeForm ? (
              <NodeForm
                form={nodeForm}
                nodeTypes={nodeTypes}
                isSaving={isSaving}
                onChange={setNodeForm}
                onSave={saveNode}
                onDelete={() => void deleteNode()}
                onClose={clearSelection}
              />
            ) : edgeForm ? (
              <EdgeForm
                form={edgeForm}
                edgeTypes={edgeTypes}
                isSaving={isSaving}
                onChange={setEdgeForm}
                onSave={saveEdge}
                onDelete={() => void deleteEdge()}
                onClose={clearSelection}
              />
            ) : (
              <p className="empty-copy">
                {tool === 'add-node'
                  ? t('admin.empty.addNode')
                  : tool === 'connect'
                    ? t('admin.empty.connect')
                    : tool === 'delete'
                      ? t('admin.empty.delete')
                      : t('admin.empty.select')}
              </p>
            )}
          </section>

          <RoutePreviewPanel />

          <section className="panel">
            <div className="panel-title-row">
              <h2>{t('admin.sqlExport')}</h2>
              {exportSql ? <span>{Math.round(exportSql.length / 1024)} KB</span> : null}
            </div>
            <p className="export-copy">{t('admin.sqlExportText')}</p>
            <div className="export-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={exportCurrentSql}
                disabled={isExporting}
              >
                {t('admin.create')}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={downloadExport}
                disabled={!exportSql}
              >
                {t('admin.download')}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void navigator.clipboard?.writeText(exportSql)}
                disabled={!exportSql}
              >
                {t('admin.copy')}
              </button>
            </div>
            {exportSql ? <textarea className="sql-preview" value={exportSql} readOnly /> : null}
          </section>

          {crossFloorEdges.length > 0 ? (
            <section className="panel">
              <div className="panel-title-row">
                <h2>{t('admin.crossFloorEdges')}</h2>
                <span>{crossFloorEdges.length}</span>
              </div>
              <div className="edge-list">
                {crossFloorEdges.slice(0, 8).map((edge) => (
                  <button
                    key={edge.id}
                    type="button"
                    onClick={(event) => handleEdgeClick(edge, event)}
                  >
                    <strong>{edge.fromNodeExternalId}</strong>
                    <span>{edge.toNodeExternalId}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function ConnectPanel({
  graph,
  floors,
  connectSourceNodeId,
  connectTargetFloorId,
  connectTargetNodeId,
  connectTargetNodes,
  onTargetFloorChange,
  onTargetNodeChange,
  onPrepare,
}: {
  graph: GraphResponse | null;
  floors: FloorOption[];
  connectSourceNodeId: number | null;
  connectTargetFloorId: number | null;
  connectTargetNodeId: number | null;
  connectTargetNodes: EditorNode[];
  onTargetFloorChange: (floorId: number) => void;
  onTargetNodeChange: (nodeId: number) => void;
  onPrepare: () => void;
}) {
  const { t } = useI18n();
  const sourceNode = graph?.nodes.find((node) => node.id === connectSourceNodeId);
  return (
    <div className="compact-stack">
      <p className="readonly-box">
        {t('admin.source')}: {sourceNode?.externalId ?? t('admin.noneSelected')}
      </p>
      {connectSourceNodeId != null ? (
        <>
          <label>
            {t('admin.targetFloor')}
            <select
              value={connectTargetFloorId ?? ''}
              onChange={(event) => onTargetFloorChange(Number(event.target.value))}
            >
              {floors.map((floor) => (
                <option key={floor.floorId} value={floor.floorId}>
                  {floor.buildingCode} - {floor.floorLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('admin.targetNode')}
            <select
              value={connectTargetNodeId ?? ''}
              onChange={(event) => onTargetNodeChange(Number(event.target.value))}
            >
              <option value="">{t('admin.selectNode')}</option>
              {connectTargetNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.externalId}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={onPrepare}
            disabled={connectTargetNodeId == null}
          >
            {t('admin.prepareCrossFloorConnection')}
          </button>
        </>
      ) : null}
    </div>
  );
}

function NodeForm({
  form,
  nodeTypes,
  isSaving,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  form: NodeFormState;
  nodeTypes: LookupOption[];
  isSaving: boolean;
  onChange: (form: NodeFormState) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="compact-stack">
      <label>
        {t('admin.label')}
        <input
          value={form.label}
          onChange={(event) => onChange({ ...form, label: event.target.value })}
        />
      </label>
      <label>
        {t('admin.externalId')}
        <input
          value={form.externalId}
          onChange={(event) => onChange({ ...form, externalId: event.target.value })}
        />
      </label>
      <label>
        {t('admin.nodeType')}
        <select
          value={form.nodeTypeCode}
          onChange={(event) => {
            const nextType = event.target.value;
            onChange({
              ...form,
              nodeTypeCode: nextType,
              isWaypoint: nextType === 'waypoint' ? true : form.isWaypoint,
            });
          }}
        >
          {nodeTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.code}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('admin.spaceId')}
        <input
          value={form.spaceId}
          onChange={(event) => onChange({ ...form, spaceId: event.target.value })}
        />
      </label>
      <div className="metric-grid">
        <NumberField label="X" value={form.x} onChange={(x) => onChange({ ...form, x })} />
        <NumberField label="Y" value={form.y} onChange={(y) => onChange({ ...form, y })} />
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isWaypoint}
          onChange={(event) => onChange({ ...form, isWaypoint: event.target.checked })}
        />
        {t('admin.pathNode')}
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(event) => onChange({ ...form, isPublic: event.target.checked })}
        />
        {t('admin.public')}
      </label>
      <div className="button-grid">
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving}>
          {t('admin.saveNode')}
        </button>
        {form.kind === 'edit' ? (
          <button type="button" className="danger-button" onClick={onDelete} disabled={isSaving}>
            {t('admin.delete')}
          </button>
        ) : null}
        <button type="button" className="secondary-button" onClick={onClose}>
          {t('admin.close')}
        </button>
      </div>
    </div>
  );
}

function EdgeForm({
  form,
  edgeTypes,
  isSaving,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  form: EdgeFormState;
  edgeTypes: LookupOption[];
  isSaving: boolean;
  onChange: (form: EdgeFormState) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="compact-stack">
      <p className="readonly-box">{t('admin.from')}: {form.fromLabel}</p>
      <p className="readonly-box">{t('admin.to')}: {form.toLabel}</p>
      <label>
        {t('admin.edgeType')}
        <select
          value={form.edgeTypeCode}
          onChange={(event) => onChange({ ...form, edgeTypeCode: event.target.value })}
        >
          {edgeTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.code}
            </option>
          ))}
        </select>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isBidirectional}
          onChange={(event) => onChange({ ...form, isBidirectional: event.target.checked })}
        />
        {t('admin.bidirectional')}
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isCrossFloor}
          onChange={(event) => onChange({ ...form, isCrossFloor: event.target.checked })}
        />
        {t('admin.crossFloor')}
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isCrossBuilding}
          onChange={(event) => onChange({ ...form, isCrossBuilding: event.target.checked })}
        />
        {t('admin.crossBuilding')}
      </label>
      <label>
        {t('admin.forwardInstruction')}
        <textarea
          value={form.instructionForward}
          onChange={(event) => onChange({ ...form, instructionForward: event.target.value })}
        />
      </label>
      <label>
        {t('admin.backwardInstruction')}
        <textarea
          value={form.instructionBackward}
          onChange={(event) => onChange({ ...form, instructionBackward: event.target.value })}
        />
      </label>
      <label>
        {t('admin.landmark')}
        <input
          value={form.landmark}
          onChange={(event) => onChange({ ...form, landmark: event.target.value })}
        />
      </label>
      <div className="button-grid">
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving}>
          {t('admin.saveEdge')}
        </button>
        {form.kind === 'edit' ? (
          <button type="button" className="danger-button" onClick={onDelete} disabled={isSaving}>
            {t('admin.delete')}
          </button>
        ) : null}
        <button type="button" className="secondary-button" onClick={onClose}>
          {t('admin.close')}
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function RoutePreviewPanel() {
  const { t } = useI18n();
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromLocation, setFromLocation] = useState<NavigationLocation | null>(null);
  const [toLocation, setToLocation] = useState<NavigationLocation | null>(null);
  const [fromResults, setFromResults] = useState<NavigationLocation[]>([]);
  const [toResults, setToResults] = useState<NavigationLocation[]>([]);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [routeError, setRouteError] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  useLocationSearch(fromQuery, setFromResults);
  useLocationSearch(toQuery, setToResults);

  useEffect(() => {
    if (!fromLocation || !toLocation) {
      setRoute(null);
      setRouteError('');
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsRouting(true);
        setRouteError('');
        const params = new URLSearchParams({
          fromLocationId: String(fromLocation.id),
          toLocationId: String(toLocation.id),
          allowElevator: 'true',
        });
        const response = await fetch(`${ADMIN_API_BASE_URL}/api/navigation/route?${params}`, {
          headers: { 'Accept-Language': getCurrentLanguage() },
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message || t('admin.previewUnavailable'));
        }
        const nextRoute = (await response.json()) as NavigationRoute;
        setRoute(nextRoute);
        setActiveSegmentIndex(0);
      } catch (previewError) {
        if (previewError instanceof DOMException && previewError.name === 'AbortError') {
          return;
        }
        setRoute(null);
        setRouteError(asMessage(previewError, t('errors.routePreview')));
      } finally {
        setIsRouting(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [fromLocation, t, toLocation]);

  const activeSegment = route?.segments[activeSegmentIndex] ?? null;

  return (
    <section className="panel route-panel">
      <div className="panel-title-row">
        <h2>{t('admin.routePreview')}</h2>
        {isRouting ? <span>{t('admin.calculatingRoute')}</span> : null}
      </div>
      <LocationPicker
        id="preview-from"
        label={t('admin.from')}
        query={fromQuery}
        selected={fromLocation}
        results={fromResults}
        onQueryChange={(value) => {
          setFromQuery(value);
          setFromLocation(null);
        }}
        onSelect={(location) => {
          setFromLocation(location);
          setFromQuery(location.displayName);
        }}
      />
      <LocationPicker
        id="preview-to"
        label={t('admin.to')}
        query={toQuery}
        selected={toLocation}
        results={toResults}
        onQueryChange={(value) => {
          setToQuery(value);
          setToLocation(null);
        }}
        onSelect={(location) => {
          setToLocation(location);
          setToQuery(location.displayName);
        }}
      />
      {routeError ? <p className="error-text compact">{routeError}</p> : null}
      {route && activeSegment ? (
        <>
          <div className="segment-tabs">
            {route.segments.map((segment, index) => (
              <button
                key={`${segment.floorId}-${index}`}
                type="button"
                className={activeSegmentIndex === index ? 'segment-tab active' : 'segment-tab'}
                onClick={() => setActiveSegmentIndex(index)}
              >
                {segment.floorLabel}
              </button>
            ))}
          </div>
          <RouteMiniMap segment={activeSegment} />
          <div className="step-list">
            {activeSegment.steps.map((step) => (
              <p key={`${step.fromNodeId}-${step.toNodeId}-${step.index}`}>{step.text}</p>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function LocationPicker({
  id,
  label,
  query,
  selected,
  results,
  onQueryChange,
  onSelect,
}: {
  id: string;
  label: string;
  query: string;
  selected: NavigationLocation | null;
  results: NavigationLocation[];
  onQueryChange: (value: string) => void;
  onSelect: (location: NavigationLocation) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="location-picker">
      <label htmlFor={id}>
        {label}
        <input
          id={id}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('admin.searchLocation')}
          autoComplete="off"
        />
      </label>
      {selected ? (
        <span className="selected-location">
          {selected.buildingCode} - {selected.floorLabel}
        </span>
      ) : null}
      {!selected && query.trim() && results.length > 0 ? (
        <div className="location-results">
          {results.map((location) => (
            <button key={location.id} type="button" onClick={() => onSelect(location)}>
              <strong>{location.displayName}</strong>
              <span>
                {location.buildingCode} - {location.floorLabel}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RouteMiniMap({ segment }: { segment: RouteSegment }) {
  const pathPoints = segment.path.map((point) => `${point.x},${point.y}`).join(' ');
  return (
    <div className="route-map">
      <img
        src={resolveAssetUrl(segment.mapImageUrl)}
        alt={`${segment.buildingName} ${segment.floorLabel}`}
      />
      <svg viewBox={`0 0 ${segment.coordinateWidth} ${segment.coordinateHeight}`}>
        <polyline
          points={pathPoints}
          fill="none"
          stroke="#f59e0b"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="10"
        />
        {segment.path[0] ? (
          <circle cx={segment.path[0].x} cy={segment.path[0].y} r="12" fill="#172033" />
        ) : null}
        {segment.path.at(-1) ? (
          <circle cx={segment.path.at(-1)!.x} cy={segment.path.at(-1)!.y} r="12" fill="#2563eb" />
        ) : null}
      </svg>
    </div>
  );
}

function useLocationSearch(query: string, setResults: (locations: NavigationLocation[]) => void) {
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ query: query.trim(), limit: '20' });

    fetch(`${ADMIN_API_BASE_URL}/api/navigation/locations?${params}`, {
      headers: { 'Accept-Language': getCurrentLanguage() },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((locations: NavigationLocation[]) => setResults(locations))
      .catch((searchError) => {
        if (searchError instanceof DOMException && searchError.name === 'AbortError') {
          return;
        }
        setResults([]);
      });

    return () => controller.abort();
  }, [query, setResults]);
}

function toNodeForm(node: EditorNode): NodeFormState {
  return {
    kind: 'edit',
    nodeId: node.id,
    floorId: node.floorId,
    label: node.label ?? '',
    externalId: node.externalId,
    nodeTypeCode: node.nodeTypeCode,
    isWaypoint: node.isWaypoint,
    isPublic: node.isPublic,
    x: node.x,
    y: node.y,
    z: node.z,
    spaceId: node.spaceId == null ? '' : String(node.spaceId),
  };
}

function toEdgeForm(edge: EditorEdge): EdgeFormState {
  return {
    kind: 'edit',
    edgeId: edge.id,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    fromLabel: edge.fromNodeExternalId,
    toLabel: edge.toNodeExternalId,
    edgeTypeCode: edge.edgeTypeCode,
    isBidirectional: edge.isBidirectional,
    isCrossFloor: edge.isCrossFloor,
    isCrossBuilding: edge.isCrossBuilding,
    instructionForward: edge.instructionForward ?? '',
    instructionBackward: edge.instructionBackward ?? '',
    landmark: edge.landmark ?? '',
  };
}

function toNodePayload(node: EditorNode) {
  return {
    floorId: node.floorId,
    label: node.label,
    externalId: node.externalId,
    nodeTypeCode: node.nodeTypeCode,
    x: node.x,
    y: node.y,
    isWaypoint: node.isWaypoint,
    isPublic: node.isPublic,
    spaceId: node.spaceId,
  };
}

async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
    headers: {
      'Accept-Language': getCurrentLanguage(),
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message || translate(getCurrentLanguage(), 'errors.requestFailed'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function apiFetchText(path: string): Promise<string> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
    headers: { 'Accept-Language': getCurrentLanguage() },
  });
  if (!response.ok) {
    throw new Error(translate(getCurrentLanguage(), 'errors.requestFailed'));
  }
  return response.text();
}

function getSvgPoint(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement | null,
  floor: FloorView
): { x: number; y: number } | null {
  if (!svg) {
    return null;
  }
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }
  return {
    x: Math.max(
      0,
      Math.min(floor.coordinateWidth, ((clientX - rect.left) / rect.width) * floor.coordinateWidth)
    ),
    y: Math.max(
      0,
      Math.min(
        floor.coordinateHeight,
        ((clientY - rect.top) / rect.height) * floor.coordinateHeight
      )
    ),
  };
}

function resolveAssetUrl(path: string) {
  return path.startsWith('http') ? path : `${ADMIN_API_BASE_URL}${path}`;
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function asMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export default AdminApp;
