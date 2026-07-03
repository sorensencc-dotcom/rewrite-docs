// Row-to-object mappers (eliminate duplication)

import { Node, Edge, DigestEntry } from "./GraphStore";

export function rowToNode(row: any): Node {
  return {
    id: row.id,
    externalId: row.external_id,
    type: row.type,
    createdAt: row.created_at,
    createdByEventId: row.created_by_event_id,
    isDeleted: row.is_deleted === 1,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    payloadJson: JSON.parse(row.payload_json),
    version: row.version,
    digestId: row.digest_id,
  };
}

export function rowToEdge(row: any): Edge {
  return {
    id: row.id,
    srcNodeId: row.src_node_id,
    dstNodeId: row.dst_node_id,
    type: row.type,
    createdAt: row.created_at,
    createdByEventId: row.created_by_event_id,
    isDeleted: row.is_deleted === 1,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    payloadJson: JSON.parse(row.payload_json),
    version: row.version,
    digestId: row.digest_id,
  };
}

export function rowToDigest(row: any): DigestEntry {
  return {
    id: row.id,
    chainId: row.chain_id,
    prevDigestId: row.prev_digest_id,
    mutationType: row.mutation_type as "create" | "update" | "soft_delete",
    entityType: row.entity_type as "node" | "edge",
    entityId: row.entity_id,
    eventId: row.event_id,
    timestamp: row.timestamp,
    digestHex: row.digest_hex,
    payloadHashHex: row.payload_hash_hex,
    metaJson: JSON.parse(row.meta_json),
  };
}
