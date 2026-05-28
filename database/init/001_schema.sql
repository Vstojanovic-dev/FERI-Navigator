-- FERI Navigator core schema.
-- Coordinates are stored in the original map/PDF coordinate system, not PNG pixels.
-- PostGIS geometries use SRID 0 because these are local map coordinates, not GPS coordinates.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE buildings (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30) NOT NULL UNIQUE,
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    image_url   VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
    id                BIGSERIAL PRIMARY KEY,
    building_id       BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    code              VARCHAR(50) NOT NULL,
    label             VARCHAR(100) NOT NULL,
    level_number      NUMERIC(6,2) NOT NULL,
    z                 NUMERIC(8,3) NOT NULL,
    map_image_url     VARCHAR(500) NOT NULL,
    coordinate_width  NUMERIC(10,2) NOT NULL,
    coordinate_height NUMERIC(10,2) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_floors_building_code UNIQUE (building_id, code),
    CONSTRAINT uq_floors_building_level UNIQUE (building_id, level_number),
    CONSTRAINT ck_floors_coordinate_width CHECK (coordinate_width > 0),
    CONSTRAINT ck_floors_coordinate_height CHECK (coordinate_height > 0)
);

CREATE TABLE space_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(40) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE node_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(40) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE edge_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(40) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE spaces (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id        BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    space_type_id   BIGINT NOT NULL REFERENCES space_types(id),
    code            VARCHAR(80) NOT NULL,
    name            VARCHAR(160) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    primary_node_id BIGINT,
    is_public       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_spaces_building_code UNIQUE (building_id, code)
);

CREATE TABLE navigation_nodes (
    id           BIGSERIAL PRIMARY KEY,
    floor_id     BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    node_type_id BIGINT NOT NULL REFERENCES node_types(id),
    space_id     BIGINT REFERENCES spaces(id) ON DELETE SET NULL,
    external_id  VARCHAR(120) NOT NULL UNIQUE,
    label        VARCHAR(160),
    x            NUMERIC(10,2) NOT NULL,
    y            NUMERIC(10,2) NOT NULL,
    z            NUMERIC(8,3) NOT NULL,
    geom         GEOMETRY(POINT, 0) NOT NULL,
    is_waypoint  BOOLEAN NOT NULL DEFAULT FALSE,
    is_public    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_navigation_nodes_x CHECK (x >= 0),
    CONSTRAINT ck_navigation_nodes_y CHECK (y >= 0)
);

ALTER TABLE spaces
    ADD CONSTRAINT fk_spaces_primary_node
    FOREIGN KEY (primary_node_id) REFERENCES navigation_nodes(id) ON DELETE SET NULL;

CREATE TABLE navigation_edges (
    id                  BIGSERIAL PRIMARY KEY,
    from_node_id        BIGINT NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    to_node_id          BIGINT NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    edge_type_id        BIGINT NOT NULL REFERENCES edge_types(id),
    weight              NUMERIC(12,3) NOT NULL,
    geom                GEOMETRY(LINESTRING, 0) NOT NULL,
    is_bidirectional    BOOLEAN NOT NULL DEFAULT TRUE,
    is_cross_floor      BOOLEAN NOT NULL DEFAULT FALSE,
    is_cross_building   BOOLEAN NOT NULL DEFAULT FALSE,
    instruction_forward TEXT,
    instruction_backward TEXT,
    landmark            VARCHAR(160),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_navigation_edges_weight CHECK (weight > 0),
    CONSTRAINT ck_navigation_edges_not_self CHECK (from_node_id <> to_node_id),
    CONSTRAINT uq_navigation_edges_direction UNIQUE (from_node_id, to_node_id)
);

CREATE TABLE navigation_locations (
    id              BIGSERIAL PRIMARY KEY,
    display_name    VARCHAR(220) NOT NULL,
    searchable_name VARCHAR(300) NOT NULL,
    location_type   VARCHAR(40) NOT NULL,
    building_id     BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id        BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    node_id         BIGINT NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    space_id        BIGINT REFERENCES spaces(id) ON DELETE CASCADE,
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_navigation_locations_node UNIQUE (node_id)
);

CREATE INDEX idx_floors_building ON floors(building_id);
CREATE INDEX idx_spaces_building ON spaces(building_id);
CREATE INDEX idx_spaces_floor ON spaces(floor_id);
CREATE INDEX idx_spaces_type ON spaces(space_type_id);
CREATE INDEX idx_navigation_nodes_floor ON navigation_nodes(floor_id);
CREATE INDEX idx_navigation_nodes_type ON navigation_nodes(node_type_id);
CREATE INDEX idx_navigation_nodes_space ON navigation_nodes(space_id);
CREATE INDEX idx_navigation_nodes_geom ON navigation_nodes USING GIST (geom);
CREATE INDEX idx_navigation_edges_from ON navigation_edges(from_node_id);
CREATE INDEX idx_navigation_edges_to ON navigation_edges(to_node_id);
CREATE INDEX idx_navigation_edges_type ON navigation_edges(edge_type_id);
CREATE INDEX idx_navigation_edges_geom ON navigation_edges USING GIST (geom);
CREATE INDEX idx_navigation_locations_search ON navigation_locations(searchable_name);
CREATE INDEX idx_navigation_locations_type ON navigation_locations(location_type);


CREATE TABLE navigation_route_shares (
    id               BIGSERIAL PRIMARY KEY,
    share_code       VARCHAR(12)  NOT NULL UNIQUE,
    from_location_id BIGINT       NOT NULL REFERENCES navigation_locations(id) ON DELETE CASCADE,
    to_location_id   BIGINT       REFERENCES navigation_locations(id) ON DELETE CASCADE,
    target_type      VARCHAR(50),
    allow_elevator   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_shares_one_target CHECK (
        (to_location_id IS NOT NULL) <> (target_type IS NOT NULL)
    )
);

CREATE INDEX idx_navigation_route_shares_code ON navigation_route_shares(share_code);