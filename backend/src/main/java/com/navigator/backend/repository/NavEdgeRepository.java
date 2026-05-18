package com.navigator.backend.repository;

import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NavEdgeRepository extends JpaRepository<NavEdge, Long> {

    @Query("""
            SELECT e FROM NavEdge e
            WHERE e.fromNode = :node OR e.toNode = :node
            """)
    List<NavEdge> findAllConnected(@Param("node") NavNode node);

    @Query("""
            SELECT e FROM NavEdge e
            WHERE e.fromNode.floorId = :floorId
            AND e.isCrossFloor = false
            """)
    List<NavEdge> findAllByFloor(@Param("floorId") Integer floorId);

    List<NavEdge> findAllByIsCrossFloorTrue();

    void deleteAllByFromNodeFloorId(Integer floorId);
}