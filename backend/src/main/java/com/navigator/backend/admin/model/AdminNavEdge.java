package com.navigator.backend.admin.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import org.locationtech.jts.geom.LineString;

@Entity
@Table(name = "navigation_edges")
public class AdminNavEdge {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "from_node_id", nullable = false)
  private AdminNavNode fromNode;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_node_id", nullable = false)
  private AdminNavNode toNode;

  @Column(name = "weight", nullable = false)
  private BigDecimal weight;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "edge_type_id", nullable = false)
  private AdminEdgeType edgeType;

  @Column(name = "is_bidirectional", nullable = false)
  private Boolean isBidirectional;

  @Column(name = "is_cross_floor", nullable = false)
  private Boolean isCrossFloor;

  @Column(name = "is_cross_building", nullable = false)
  private Boolean isCrossBuilding;

  @Column(name = "instruction_forward")
  private String instructionForward;

  @Column(name = "instruction_backward")
  private String instructionBackward;

  @Column(name = "landmark")
  private String landmark;

  @Column(name = "geom", columnDefinition = "geometry(LineString)", nullable = false)
  private LineString geom;

  public AdminNavEdge() {}

  public Long getId() {
    return id;
  }

  public AdminNavNode getFromNode() {
    return fromNode;
  }

  public void setFromNode(AdminNavNode fromNode) {
    this.fromNode = fromNode;
  }

  public AdminNavNode getToNode() {
    return toNode;
  }

  public void setToNode(AdminNavNode toNode) {
    this.toNode = toNode;
  }

  public BigDecimal getWeight() {
    return weight;
  }

  public void setWeight(BigDecimal weight) {
    this.weight = weight;
  }

  public AdminEdgeType getEdgeType() {
    return edgeType;
  }

  public void setEdgeType(AdminEdgeType edgeType) {
    this.edgeType = edgeType;
  }

  public Boolean getIsBidirectional() {
    return isBidirectional;
  }

  public void setIsBidirectional(Boolean isBidirectional) {
    this.isBidirectional = isBidirectional;
  }

  public Boolean getIsCrossFloor() {
    return isCrossFloor;
  }

  public void setIsCrossFloor(Boolean isCrossFloor) {
    this.isCrossFloor = isCrossFloor;
  }

  public Boolean getIsCrossBuilding() {
    return isCrossBuilding;
  }

  public void setIsCrossBuilding(Boolean isCrossBuilding) {
    this.isCrossBuilding = isCrossBuilding;
  }

  public String getInstructionForward() {
    return instructionForward;
  }

  public void setInstructionForward(String instructionForward) {
    this.instructionForward = instructionForward;
  }

  public String getInstructionBackward() {
    return instructionBackward;
  }

  public void setInstructionBackward(String instructionBackward) {
    this.instructionBackward = instructionBackward;
  }

  public String getLandmark() {
    return landmark;
  }

  public void setLandmark(String landmark) {
    this.landmark = landmark;
  }

  public LineString getGeom() {
    return geom;
  }

  public void setGeom(LineString geom) {
    this.geom = geom;
  }

  public String getEdgeTypeCode() {
    return edgeType != null ? edgeType.getCode() : null;
  }
}
