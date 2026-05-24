package com.navigator.backend.admin.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSqlExportService {

  private final JdbcClient jdbcClient;

  public AdminSqlExportService(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  @Transactional(readOnly = true)
  public String exportSql() {
    List<NodeRow> nodes =
        jdbcClient
            .sql(
                """
                SELECT
                  n.external_id,
                  n.label,
                  nt.code AS node_type_code,
                  b.code AS building_code,
                  f.code AS floor_code,
                  n.x,
                  n.y,
                  n.z,
                  n.is_waypoint,
                  n.is_public,
                  s.code AS space_code
                FROM navigation_nodes n
                JOIN floors f ON f.id = n.floor_id
                JOIN buildings b ON b.id = f.building_id
                JOIN node_types nt ON nt.id = n.node_type_id
                LEFT JOIN spaces s ON s.id = n.space_id
                ORDER BY b.code, f.level_number, n.external_id
                """)
            .query(NodeRow.class)
            .list();

    List<EdgeRow> edges =
        jdbcClient
            .sql(
                """
                SELECT
                  fn.external_id AS from_external_id,
                  tn.external_id AS to_external_id,
                  et.code AS edge_type_code,
                  e.weight,
                  e.is_bidirectional,
                  e.is_cross_floor,
                  e.is_cross_building,
                  e.instruction_forward,
                  e.instruction_backward,
                  e.landmark
                FROM navigation_edges e
                JOIN navigation_nodes fn ON fn.id = e.from_node_id
                JOIN navigation_nodes tn ON tn.id = e.to_node_id
                JOIN edge_types et ON et.id = e.edge_type_id
                ORDER BY fn.external_id, tn.external_id
                """)
            .query(EdgeRow.class)
            .list();

    List<SpacePrimaryRow> spacePrimaries =
        jdbcClient
            .sql(
                """
                SELECT
                  b.code AS building_code,
                  s.code AS space_code,
                  n.external_id AS primary_node_external_id
                FROM spaces s
                JOIN buildings b ON b.id = s.building_id
                JOIN navigation_nodes n ON n.id = s.primary_node_id
                ORDER BY b.code, s.code
                """)
            .query(SpacePrimaryRow.class)
            .list();

    List<LocationRow> locations =
        jdbcClient
            .sql(
                """
                SELECT
                  l.display_name,
                  l.searchable_name,
                  l.location_type,
                  b.code AS building_code,
                  f.code AS floor_code,
                  n.external_id AS node_external_id,
                  s.code AS space_code,
                  l.is_enabled
                FROM navigation_locations l
                JOIN buildings b ON b.id = l.building_id
                JOIN floors f ON f.id = l.floor_id
                JOIN navigation_nodes n ON n.id = l.node_id
                LEFT JOIN spaces s ON s.id = l.space_id
                ORDER BY b.code, f.level_number, l.display_name
                """)
            .query(LocationRow.class)
            .list();

    Set<String> buildingCodes = new LinkedHashSet<>();
    for (NodeRow node : nodes) {
      buildingCodes.add(node.buildingCode());
    }

    StringBuilder sql = new StringBuilder();
    sql.append("-- Generated from the admin map editor.\n");
    sql.append("-- Commit this file when admin graph changes should be shared with the team.\n");
    sql.append("-- Generated at: ").append(OffsetDateTime.now()).append("\n\n");

    appendNodes(sql, nodes, buildingCodes);
    appendEdges(sql, edges, buildingCodes);
    appendStaleNodeDelete(sql, nodes, buildingCodes);
    appendSpacePrimaries(sql, spacePrimaries);
    appendLocations(sql, locations, buildingCodes);

    return sql.toString();
  }

  private void appendNodes(StringBuilder sql, List<NodeRow> nodes, Set<String> buildingCodes) {
    if (nodes.isEmpty()) {
      return;
    }

    sql.append("-- Navigation nodes\n");
    sql.append("WITH node_input(\n");
    sql.append("    external_id, label, node_type_code, building_code, floor_code,\n");
    sql.append("    x, y, z, is_waypoint, is_public, space_code\n");
    sql.append(") AS (\n");
    appendValues(
        sql,
        nodes.stream()
            .map(
                node ->
                    List.of(
                        stringValue(node.externalId()),
                        stringValue(node.label()),
                        stringValue(node.nodeTypeCode()),
                        stringValue(node.buildingCode()),
                        stringValue(node.floorCode()),
                        decimalValue(node.x()),
                        decimalValue(node.y()),
                        decimalValue(node.z()),
                        boolValue(node.isWaypoint()),
                        boolValue(node.isPublic()),
                        stringValue(node.spaceCode())))
            .toList());
    sql.append(")\n");
    sql.append(
        """
        INSERT INTO navigation_nodes (
            floor_id,
            node_type_id,
            external_id,
            label,
            x,
            y,
            z,
            geom,
            is_waypoint,
            is_public,
            space_id
        )
        SELECT
            f.id,
            nt.id,
            ni.external_id,
            ni.label,
            ni.x,
            ni.y,
            ni.z,
            ST_SetSRID(ST_MakePoint(ni.x, ni.y), 0),
            ni.is_waypoint,
            ni.is_public,
            s.id
        FROM node_input ni
        JOIN buildings b ON b.code = ni.building_code
        JOIN floors f ON f.building_id = b.id AND f.code = ni.floor_code
        JOIN node_types nt ON nt.code = ni.node_type_code
        LEFT JOIN spaces s ON s.building_id = b.id AND s.code = ni.space_code
        ON CONFLICT (external_id) DO UPDATE
        SET floor_id = EXCLUDED.floor_id,
            node_type_id = EXCLUDED.node_type_id,
            label = EXCLUDED.label,
            x = EXCLUDED.x,
            y = EXCLUDED.y,
            z = EXCLUDED.z,
            geom = EXCLUDED.geom,
            is_waypoint = EXCLUDED.is_waypoint,
            is_public = EXCLUDED.is_public,
            space_id = EXCLUDED.space_id,
            updated_at = NOW();

        """);

    sql.append("-- Remove graph rows for exported buildings that are no longer present in admin.\n");
    appendBuildingInput(sql, buildingCodes);
    sql.append(", node_input(external_id) AS (\n");
    appendValues(sql, nodes.stream().map(node -> List.of(stringValue(node.externalId()))).toList());
    sql.append(")\n");
    sql.append(
        """
        UPDATE spaces s
        SET primary_node_id = NULL,
            updated_at = NOW()
        FROM buildings b, navigation_nodes n
        WHERE s.building_id = b.id
          AND s.primary_node_id = n.id
          AND b.code IN (SELECT code FROM exported_buildings)
          AND NOT EXISTS (
              SELECT 1 FROM node_input ni WHERE ni.external_id = n.external_id
          );

        """);

    appendBuildingInput(sql, buildingCodes);
    sql.append(", node_input(external_id) AS (\n");
    appendValues(sql, nodes.stream().map(node -> List.of(stringValue(node.externalId()))).toList());
    sql.append(")\n");
    sql.append(
        """
        DELETE FROM navigation_locations l
        USING navigation_nodes n, floors f, buildings b
        WHERE l.node_id = n.id
          AND n.floor_id = f.id
          AND f.building_id = b.id
          AND b.code IN (SELECT code FROM exported_buildings)
          AND NOT EXISTS (
              SELECT 1 FROM node_input ni WHERE ni.external_id = n.external_id
          );

        """);
  }

  private void appendEdges(StringBuilder sql, List<EdgeRow> edges, Set<String> buildingCodes) {
    sql.append("-- Navigation edges\n");
    appendBuildingInput(sql, buildingCodes);
    if (edges.isEmpty()) {
      sql.append(", edge_input(from_external_id, to_external_id) AS (SELECT NULL, NULL WHERE FALSE)\n");
    } else {
      sql.append(", edge_input(from_external_id, to_external_id) AS (\n");
      appendValues(
          sql,
          edges.stream()
              .map(edge -> List.of(stringValue(edge.fromExternalId()), stringValue(edge.toExternalId())))
              .toList());
      sql.append(")\n");
    }
    sql.append(
        """
        DELETE FROM navigation_edges e
        USING navigation_nodes fn, navigation_nodes tn, floors ff, buildings fb
        WHERE e.from_node_id = fn.id
          AND e.to_node_id = tn.id
          AND fn.floor_id = ff.id
          AND ff.building_id = fb.id
          AND fb.code IN (SELECT code FROM exported_buildings)
          AND NOT EXISTS (
              SELECT 1
              FROM edge_input ei
              WHERE ei.from_external_id = fn.external_id
                AND ei.to_external_id = tn.external_id
          );

        """);

    if (edges.isEmpty()) {
      return;
    }

    sql.append("WITH edge_input(\n");
    sql.append("    from_external_id, to_external_id, edge_type_code, weight,\n");
    sql.append("    is_bidirectional, is_cross_floor, is_cross_building,\n");
    sql.append("    instruction_forward, instruction_backward, landmark\n");
    sql.append(") AS (\n");
    appendValues(
        sql,
        edges.stream()
            .map(
                edge ->
                    List.of(
                        stringValue(edge.fromExternalId()),
                        stringValue(edge.toExternalId()),
                        stringValue(edge.edgeTypeCode()),
                        decimalValue(edge.weight()),
                        boolValue(edge.isBidirectional()),
                        boolValue(edge.isCrossFloor()),
                        boolValue(edge.isCrossBuilding()),
                        stringValue(edge.instructionForward()),
                        stringValue(edge.instructionBackward()),
                        stringValue(edge.landmark())))
            .toList());
    sql.append(")\n");
    sql.append(
        """
        INSERT INTO navigation_edges (
            from_node_id,
            to_node_id,
            edge_type_id,
            weight,
            geom,
            is_bidirectional,
            is_cross_floor,
            is_cross_building,
            instruction_forward,
            instruction_backward,
            landmark
        )
        SELECT
            fn.id,
            tn.id,
            et.id,
            ei.weight,
            ST_MakeLine(fn.geom, tn.geom),
            ei.is_bidirectional,
            ei.is_cross_floor,
            ei.is_cross_building,
            ei.instruction_forward,
            ei.instruction_backward,
            ei.landmark
        FROM edge_input ei
        JOIN navigation_nodes fn ON fn.external_id = ei.from_external_id
        JOIN navigation_nodes tn ON tn.external_id = ei.to_external_id
        JOIN edge_types et ON et.code = ei.edge_type_code
        ON CONFLICT (from_node_id, to_node_id) DO UPDATE
        SET edge_type_id = EXCLUDED.edge_type_id,
            weight = EXCLUDED.weight,
            geom = EXCLUDED.geom,
            is_bidirectional = EXCLUDED.is_bidirectional,
            is_cross_floor = EXCLUDED.is_cross_floor,
            is_cross_building = EXCLUDED.is_cross_building,
            instruction_forward = EXCLUDED.instruction_forward,
            instruction_backward = EXCLUDED.instruction_backward,
            landmark = EXCLUDED.landmark,
            updated_at = NOW();

        """);
  }

  private void appendSpacePrimaries(StringBuilder sql, List<SpacePrimaryRow> spacePrimaries) {
    if (spacePrimaries.isEmpty()) {
      return;
    }

    sql.append("-- Space to primary node links\n");
    sql.append("WITH space_primary_input(building_code, space_code, primary_node_external_id) AS (\n");
    appendValues(
        sql,
        spacePrimaries.stream()
            .map(
                row ->
                    List.of(
                        stringValue(row.buildingCode()),
                        stringValue(row.spaceCode()),
                        stringValue(row.primaryNodeExternalId())))
            .toList());
    sql.append(")\n");
    sql.append(
        """
        UPDATE spaces s
        SET primary_node_id = n.id,
            updated_at = NOW()
        FROM space_primary_input spi
        JOIN buildings b ON b.code = spi.building_code
        JOIN navigation_nodes n ON n.external_id = spi.primary_node_external_id
        WHERE s.building_id = b.id
          AND s.code = spi.space_code;

        """);
  }

  private void appendStaleNodeDelete(
      StringBuilder sql, List<NodeRow> nodes, Set<String> buildingCodes) {
    if (nodes.isEmpty()) {
      return;
    }

    sql.append("-- Remove stale nodes after dependent edges and locations are gone.\n");
    appendBuildingInput(sql, buildingCodes);
    sql.append(", node_input(external_id) AS (\n");
    appendValues(sql, nodes.stream().map(node -> List.of(stringValue(node.externalId()))).toList());
    sql.append(")\n");
    sql.append(
        """
        DELETE FROM navigation_nodes n
        USING floors f, buildings b
        WHERE n.floor_id = f.id
          AND f.building_id = b.id
          AND b.code IN (SELECT code FROM exported_buildings)
          AND NOT EXISTS (
              SELECT 1 FROM node_input ni WHERE ni.external_id = n.external_id
          );

        """);
  }

  private void appendLocations(
      StringBuilder sql, List<LocationRow> locations, Set<String> buildingCodes) {
    if (locations.isEmpty()) {
      return;
    }

    sql.append("-- Navigation locations\n");
    appendBuildingInput(sql, buildingCodes);
    sql.append(", location_input(node_external_id) AS (\n");
    appendValues(
        sql,
        locations.stream().map(location -> List.of(stringValue(location.nodeExternalId()))).toList());
    sql.append(")\n");
    sql.append(
        """
        DELETE FROM navigation_locations l
        USING navigation_nodes n, floors f, buildings b
        WHERE l.node_id = n.id
          AND n.floor_id = f.id
          AND f.building_id = b.id
          AND b.code IN (SELECT code FROM exported_buildings)
          AND NOT EXISTS (
              SELECT 1
              FROM location_input li
              WHERE li.node_external_id = n.external_id
          );

        """);

    sql.append("WITH location_input(\n");
    sql.append("    display_name, searchable_name, location_type, building_code, floor_code,\n");
    sql.append("    node_external_id, space_code, is_enabled\n");
    sql.append(") AS (\n");
    appendValues(
        sql,
        locations.stream()
            .map(
                location ->
                    List.of(
                        stringValue(location.displayName()),
                        stringValue(location.searchableName()),
                        stringValue(location.locationType()),
                        stringValue(location.buildingCode()),
                        stringValue(location.floorCode()),
                        stringValue(location.nodeExternalId()),
                        stringValue(location.spaceCode()),
                        boolValue(location.isEnabled())))
            .toList());
    sql.append(")\n");
    sql.append(
        """
        INSERT INTO navigation_locations (
            display_name,
            searchable_name,
            location_type,
            building_id,
            floor_id,
            node_id,
            space_id,
            is_enabled
        )
        SELECT
            li.display_name,
            li.searchable_name,
            li.location_type,
            b.id,
            f.id,
            n.id,
            s.id,
            li.is_enabled
        FROM location_input li
        JOIN buildings b ON b.code = li.building_code
        JOIN floors f ON f.building_id = b.id AND f.code = li.floor_code
        JOIN navigation_nodes n ON n.external_id = li.node_external_id
        LEFT JOIN spaces s ON s.building_id = b.id AND s.code = li.space_code
        ON CONFLICT (node_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            searchable_name = EXCLUDED.searchable_name,
            location_type = EXCLUDED.location_type,
            building_id = EXCLUDED.building_id,
            floor_id = EXCLUDED.floor_id,
            space_id = EXCLUDED.space_id,
            is_enabled = EXCLUDED.is_enabled,
            updated_at = NOW();
        """);
  }

  private void appendBuildingInput(StringBuilder sql, Set<String> buildingCodes) {
    sql.append("WITH exported_buildings(code) AS (\n");
    appendValues(sql, buildingCodes.stream().map(code -> List.of(stringValue(code))).toList());
    sql.append(")\n");
  }

  private void appendValues(StringBuilder sql, List<List<String>> rows) {
    sql.append("    VALUES\n");
    for (int i = 0; i < rows.size(); i++) {
      sql.append("        (").append(String.join(", ", rows.get(i))).append(")");
      sql.append(i == rows.size() - 1 ? "\n" : ",\n");
    }
  }

  private String stringValue(String value) {
    if (value == null || value.isBlank()) {
      return "NULL";
    }
    return "'" + value.replace("'", "''") + "'";
  }

  private String decimalValue(BigDecimal value) {
    return value == null ? "NULL" : value.stripTrailingZeros().toPlainString();
  }

  private String boolValue(Boolean value) {
    return Boolean.TRUE.equals(value) ? "TRUE" : "FALSE";
  }

  private record NodeRow(
      String externalId,
      String label,
      String nodeTypeCode,
      String buildingCode,
      String floorCode,
      BigDecimal x,
      BigDecimal y,
      BigDecimal z,
      Boolean isWaypoint,
      Boolean isPublic,
      String spaceCode) {}

  private record EdgeRow(
      String fromExternalId,
      String toExternalId,
      String edgeTypeCode,
      BigDecimal weight,
      Boolean isBidirectional,
      Boolean isCrossFloor,
      Boolean isCrossBuilding,
      String instructionForward,
      String instructionBackward,
      String landmark) {}

  private record SpacePrimaryRow(
      String buildingCode, String spaceCode, String primaryNodeExternalId) {}

  private record LocationRow(
      String displayName,
      String searchableName,
      String locationType,
      String buildingCode,
      String floorCode,
      String nodeExternalId,
      String spaceCode,
      Boolean isEnabled) {}
}
