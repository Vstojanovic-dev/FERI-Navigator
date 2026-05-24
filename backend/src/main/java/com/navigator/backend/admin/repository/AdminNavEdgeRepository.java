package com.navigator.backend.admin.repository;

import com.navigator.backend.admin.model.AdminNavEdge;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminNavEdgeRepository extends JpaRepository<AdminNavEdge, Long> {

  @Query(
      """
          SELECT e FROM AdminNavEdge e
          JOIN FETCH e.edgeType
          JOIN FETCH e.fromNode fn
          JOIN FETCH fn.nodeType
          JOIN FETCH fn.floor ff
          JOIN FETCH ff.building
          JOIN FETCH e.toNode tn
          JOIN FETCH tn.nodeType
          JOIN FETCH tn.floor tf
          JOIN FETCH tf.building
          WHERE fn.floorId = :floorId OR tn.floorId = :floorId
          ORDER BY e.id
          """)
  List<AdminNavEdge> findAllForFloor(@Param("floorId") Long floorId);

  @Query(
      """
          SELECT e FROM AdminNavEdge e
          JOIN FETCH e.edgeType
          JOIN FETCH e.fromNode fn
          JOIN FETCH fn.nodeType
          JOIN FETCH fn.floor ff
          JOIN FETCH ff.building
          JOIN FETCH e.toNode tn
          JOIN FETCH tn.nodeType
          JOIN FETCH tn.floor tf
          JOIN FETCH tf.building
          WHERE e.id = :edgeId
          """)
  Optional<AdminNavEdge> findDetailedById(@Param("edgeId") Long edgeId);

  Optional<AdminNavEdge> findByFromNodeIdAndToNodeId(Long fromNodeId, Long toNodeId);

  @Query(
      """
          SELECT COUNT(e)
          FROM AdminNavEdge e
          WHERE e.isCrossFloor = true
          AND (e.fromNode.id = :nodeId OR e.toNode.id = :nodeId)
          """)
  long countCrossFloorConnectionsForNode(@Param("nodeId") Long nodeId);
}
