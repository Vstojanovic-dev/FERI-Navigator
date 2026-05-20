package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.LineString;

@Entity
@Table(name = "nav_edges")
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
  @JoinColumn(name = "from_node", nullable = false)
  private NavNode fromNode;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_node", nullable = false)
  private NavNode toNode;

  @Column(name = "weight")
  private Double weight;

  @Column(name = "edge_type", length = 20)
  private String edgeType;

  @Column(name = "is_cross_floor")
  private Boolean isCrossFloor = false;

  @Column(name = "geom", columnDefinition = "geometry(LineString,3857)")
  private LineString geom;
}
