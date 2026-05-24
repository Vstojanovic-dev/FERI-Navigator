package com.navigator.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;
import org.locationtech.jts.geom.LineString;

@Entity
@Table(name = "navigation_edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavEdge {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "from_node_id", nullable = false)
  private NavNode fromNode;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_node_id", nullable = false)
  private NavNode toNode;

  @Column(name = "weight", nullable = false)
  private BigDecimal weight;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "edge_type_id", nullable = false)
  private EdgeType edgeType;

  @Column(name = "is_cross_floor")
  private Boolean isCrossFloor = false;

  @Column(name = "instruction_forward")
  private String instructionForward;

  @Column(name = "instruction_backward")
  private String instructionBackward;

  @Column(name = "landmark")
  private String landmark;

  @Column(name = "geom", columnDefinition = "geometry(LineString)", nullable = false)
  private LineString geom;

  public String getEdgeTypeCode() {
    return edgeType != null ? edgeType.getCode() : null;
  }
}
