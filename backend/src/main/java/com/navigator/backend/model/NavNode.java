package com.navigator.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "navigation_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavNode {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "floor_id", nullable = false)
  private Long floorId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "floor_id", insertable = false, updatable = false)
  private Floor floor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "node_type_id", nullable = false)
  private NodeType nodeType;

  @Column(name = "space_id")
  private Long spaceId;

  @Column(name = "label")
  private String label;

  @Column(name = "is_waypoint", nullable = false)
  private Boolean isWaypoint = false;

  @Column(name = "x", nullable = false)
  private BigDecimal x;

  @Column(name = "y", nullable = false)
  private BigDecimal y;

  @Column(name = "z", nullable = false)
  private BigDecimal z;

  @Column(name = "geom", columnDefinition = "geometry(Point)", nullable = false)
  private Point geom;

  @Column(name = "external_id", unique = true)
  private String externalId;

  public String getNodeTypeCode() {
    return nodeType != null ? nodeType.getCode() : null;
  }
}
