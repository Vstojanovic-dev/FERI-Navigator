package com.navigator.backend.admin.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "navigation_nodes")
public class AdminNavNode {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "floor_id", nullable = false)
  private Long floorId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "floor_id", insertable = false, updatable = false)
  private AdminFloor floor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "node_type_id", nullable = false)
  private AdminNodeType nodeType;

  @Column(name = "space_id")
  private Long spaceId;

  @Column(name = "label")
  private String label;

  @Column(name = "is_waypoint", nullable = false)
  private Boolean isWaypoint;

  @Column(name = "is_public", nullable = false)
  private Boolean isPublic;

  @Column(name = "x", nullable = false)
  private BigDecimal x;

  @Column(name = "y", nullable = false)
  private BigDecimal y;

  @Column(name = "z", nullable = false)
  private BigDecimal z;

  @Column(name = "geom", columnDefinition = "geometry(Point)", nullable = false)
  private Point geom;

  @Column(name = "external_id", nullable = false, unique = true)
  private String externalId;

  public AdminNavNode() {}

  public Long getId() {
    return id;
  }

  public Long getFloorId() {
    return floorId;
  }

  public void setFloorId(Long floorId) {
    this.floorId = floorId;
  }

  public AdminFloor getFloor() {
    return floor;
  }

  public AdminNodeType getNodeType() {
    return nodeType;
  }

  public void setNodeType(AdminNodeType nodeType) {
    this.nodeType = nodeType;
  }

  public Long getSpaceId() {
    return spaceId;
  }

  public void setSpaceId(Long spaceId) {
    this.spaceId = spaceId;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public Boolean getIsWaypoint() {
    return isWaypoint;
  }

  public void setIsWaypoint(Boolean isWaypoint) {
    this.isWaypoint = isWaypoint;
  }

  public Boolean getIsPublic() {
    return isPublic;
  }

  public void setIsPublic(Boolean isPublic) {
    this.isPublic = isPublic;
  }

  public BigDecimal getX() {
    return x;
  }

  public void setX(BigDecimal x) {
    this.x = x;
  }

  public BigDecimal getY() {
    return y;
  }

  public void setY(BigDecimal y) {
    this.y = y;
  }

  public BigDecimal getZ() {
    return z;
  }

  public void setZ(BigDecimal z) {
    this.z = z;
  }

  public Point getGeom() {
    return geom;
  }

  public void setGeom(Point geom) {
    this.geom = geom;
  }

  public String getExternalId() {
    return externalId;
  }

  public void setExternalId(String externalId) {
    this.externalId = externalId;
  }

  public String getNodeTypeCode() {
    return nodeType != null ? nodeType.getCode() : null;
  }
}
