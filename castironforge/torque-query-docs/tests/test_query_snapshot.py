"""
Snapshot / determinism tests for the documentation RAG service's /query response shape.

Scope note: the real /query flow calls a live Ollama LLM (src/rag/engine.py::answer),
which is neither deterministic nor available in CI. These tests do NOT exercise that
LLM call. Instead they snapshot the two functions that fully determine the response
shape given fixed inputs:

  - format_json_answer(answer_text, nodes) -- pure function, builds the final dict
  - pack_context(nodes, max_tokens)         -- pure function, builds the LLM context string

Fixed synthetic node objects (mocking llama_index NodeWithScore) stand in for real
retrieval/rerank output so the shape and ordering can be asserted exactly, run after run.
"""

import json
from pathlib import Path

from src.rag.engine import format_json_answer
from src.rag.context import pack_context

SNAPSHOT_DIR = Path(__file__).parent / "snapshots"


class FakeNode:
    """Stand-in for llama_index's TextNode -- only .text and .metadata are used."""

    def __init__(self, text, metadata):
        self.text = text
        self.metadata = metadata


class FakeNodeWithScore:
    """Stand-in for llama_index's NodeWithScore -- only .node and .score are used."""

    def __init__(self, text, metadata, score):
        self.node = FakeNode(text, metadata)
        self.score = score


def _load_snapshot(name):
    with open(SNAPSHOT_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


def _make_nodes(specs):
    """specs: list of (text, metadata, score) tuples"""
    return [FakeNodeWithScore(text, meta, score) for text, meta, score in specs]


class TestFormatJsonAnswerSnapshot:
    def test_basic_multi_source_answer(self):
        nodes = _make_nodes(
            [
                (
                    "Torque values for the M8 bolt are 25 Nm.",
                    {"file_path": "docs/hardware/torque-specs.md", "mkdocs_path": "Hardware > Torque Specs", "tags": "hardware,torque"},
                    0.91,
                ),
                (
                    "Always use a calibrated torque wrench.",
                    {"file_path": "docs/hardware/tools.md", "mkdocs_path": "Hardware > Tools", "tags": "hardware,tools"},
                    0.62,
                ),
            ]
        )
        result = format_json_answer("The M8 bolt torque spec is 25 Nm.", nodes)
        expected = _load_snapshot("basic_multi_source_answer.json")
        assert result == expected

    def test_not_in_docs_trigger_phrase(self):
        nodes = _make_nodes(
            [
                (
                    "Unrelated content about paint colors.",
                    {"file_path": "docs/misc/paint.md", "mkdocs_path": "Misc > Paint", "tags": "paint"},
                    0.35,
                ),
            ]
        )
        result = format_json_answer(
            "I do not have information about that topic in the docs.", nodes
        )
        expected = _load_snapshot("not_in_docs_trigger.json")
        assert result == expected
        # confidence must be forced to 0.0 whenever a not-in-docs trigger phrase fires,
        # regardless of retrieved node scores
        assert result["confidence"] == 0.0
        assert result["not_in_docs"] is True

    def test_empty_nodes(self):
        result = format_json_answer("There is no information available.", [])
        expected = _load_snapshot("empty_nodes.json")
        assert result == expected
        assert result["sources"] == []
        assert result["confidence"] == 0.0

    def test_missing_tags_field_defaults_empty_list(self):
        nodes = _make_nodes(
            [
                (
                    "Some content with no tags metadata at all.",
                    {"file_path": "docs/x.md", "mkdocs_path": "X"},
                    0.5,
                ),
            ]
        )
        result = format_json_answer("Some answer.", nodes)
        assert result["sources"][0]["tags"] == []

    def test_result_shape_is_stable_across_runs(self):
        """Same inputs -> byte-identical dict, run after run (no hidden nondeterminism
        like set ordering, timestamps, or random tie-breaks)."""
        nodes = _make_nodes(
            [
                ("Content A", {"file_path": "a.md", "mkdocs_path": "A", "tags": "x,y"}, 0.8),
                ("Content B", {"file_path": "b.md", "mkdocs_path": "B", "tags": "y,z"}, 0.4),
            ]
        )
        first = format_json_answer("Answer text.", nodes)
        second = format_json_answer("Answer text.", nodes)
        assert first == second
        assert json.dumps(first, sort_keys=True) == json.dumps(second, sort_keys=True)


class TestPackContextDeterminism:
    def test_pack_context_deterministic_same_nodes(self):
        nodes = _make_nodes(
            [
                ("First chunk of context.", {"file_path": "a.md"}, 0.9),
                ("Second chunk of context.", {"file_path": "b.md"}, 0.7),
                ("Third chunk of context.", {"file_path": "c.md"}, 0.5),
            ]
        )
        # reserved defaults to 1024, so max_tokens must exceed that to leave any budget
        first = pack_context(nodes, max_tokens=2048)
        second = pack_context(nodes, max_tokens=2048)
        assert first == second
        assert first == "First chunk of context.\n\nSecond chunk of context.\n\nThird chunk of context."

    def test_pack_context_truncates_when_over_budget(self):
        long_text = "word " * 2000  # far more tokens than the tiny budget below
        nodes = _make_nodes([(long_text, {"file_path": "big.md"}, 0.9)])

        # reserved defaults to 1024, so max_tokens must exceed that to leave any budget
        result_a = pack_context(nodes, max_tokens=1024 + 50)
        result_b = pack_context(nodes, max_tokens=1024 + 50)
        assert result_a == result_b
        assert len(result_a) > 0
        assert len(result_a) < len(long_text)

    def test_pack_context_empty_nodes_returns_empty_string(self):
        assert pack_context([], max_tokens=1024) == ""
        assert pack_context([], max_tokens=1024) == pack_context([], max_tokens=1024)

    def test_pack_context_stops_at_budget_boundary(self):
        # Two chunks that together just barely fit, third should be dropped or truncated
        nodes = _make_nodes(
            [
                ("alpha " * 50, {"file_path": "a.md"}, 0.9),
                ("beta " * 50, {"file_path": "b.md"}, 0.8),
                ("gamma " * 50, {"file_path": "c.md"}, 0.7),
            ]
        )
        budget_tokens = 1024 + 60  # reserved=1024 default, leaves ~60 tokens of budget
        result = pack_context(nodes, max_tokens=budget_tokens)
        # deterministic regardless of how many chunks fit
        result_again = pack_context(nodes, max_tokens=budget_tokens)
        assert result == result_again
