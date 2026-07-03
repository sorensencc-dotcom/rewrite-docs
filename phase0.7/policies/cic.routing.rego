package cic.routing

default allow := false

valid_phase {
  input.phase == "0.7"
}

allowed_route {
  input.from == "cic.ingestion"
  input.to == "cic.evolution"
  input.channel == "cic.events"
}

allowed_route {
  input.from == "cic.evolution"
  input.to == "labs.discovery"
  input.channel == "labs.discovery.requests"
}

allowed_route {
  input.from == "labs.discovery"
  input.to == "labs.extractor"
  input.channel == "labs.extractor.requests"
}

allowed_route {
  input.from == "labs.extractor"
  input.to == "labs.redesign.gpu"
  input.channel == "labs.redesign.requests"
}

allowed_route {
  input.from == "labs.redesign.gpu"
  input.to == "labs.outreach"
  input.channel == "labs.outreach.requests"
}

allowed_route {
  input.from == "labs.redesign.gpu"
  input.to == "inference.nemotron"
  input.channel == "inference.requests"
}

allowed_route {
  input.to == "cic.observability"
  input.channel == "cic.telemetry"
}

valid_channel {
  input.channel == "cic.events"
} {
  input.channel == "labs.discovery.requests"
} {
  input.channel == "labs.extractor.requests"
} {
  input.channel == "labs.redesign.requests"
} {
  input.channel == "labs.outreach.requests"
} {
  input.channel == "inference.requests"
} {
  input.channel == "cic.telemetry"
}

not_wildcard {
  not startswith(input.to, "*")
}

allow {
  valid_phase
  valid_channel
  allowed_route
  not_wildcard
}
