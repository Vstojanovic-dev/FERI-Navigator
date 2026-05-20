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

    // A* — sve veze koje IZLAZE iz čvora (usmjereno, po ID-u)
    @Query("""
            SELECT e FROM NavEdge e
            JOIN FETCH e.toNode
            WHERE e.fromNode.id = :fromNodeId
            """)
    List<NavEdge> findByFromNodeId(@Param("fromNodeId") Long fromNodeId);

    // Sve veze koje izlaze iz čvora (dvosmerno — from ili to)
    @Query("""
            SELECT e FROM NavEdge e
            WHERE e.fromNode = :node OR e.toNode = :node
            """)
    List<NavEdge> findAllConnected(@Param("node") NavNode node);

    // Sve veze za dati sprat
    @Query("""
            SELECT e FROM NavEdge e
            WHERE e.fromNode.floorId = :floorId
            AND e.isCrossFloor = false
            """)
    List<NavEdge> findAllByFloor(@Param("floorId") Integer floorId);

    // Samo prelazi između spratova
    List<NavEdge> findAllByIsCrossFloorTrue();

    void deleteAllByFromNodeFloorId(Integer floorId);
}