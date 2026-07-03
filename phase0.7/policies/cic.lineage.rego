package cic.lineage

default allow := false

valid_phase {
  input.phase == "0.7"
}

required_fields {
  input.artifact_id
  input.agent_id
  input.version
  input.build_id
  input.inputs
  input.outputs
  input.provenance
}

valid_provenance {
  input.provenance.git_sha != ""
  input.provenance.timestamp != ""
  input.provenance.sbom_ref != ""
}

valid_build_id {
  startswith(input.build_id, "build-")
  count(split(input.build_id, "-")) == 3
}

valid_drift_signature {
  input.drift_signature != ""
}

valid_inputs {
  count(input.inputs) >= 0
}

valid_outputs {
  count(input.outputs) >= 0
}

valid_parent {
  input.parent_build_id != null
} {
  input.parent_build_id == null
}

allow {
  valid_phase
  required_fields
  valid_provenance
  valid_build_id
  valid_drift_signature
  valid_inputs
  valid_outputs
  valid_parent
}
