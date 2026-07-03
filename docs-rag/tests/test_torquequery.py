import sys
import unittest
from types import ModuleType
from unittest.mock import MagicMock

# --- Mocking Heavy Dependencies for Isolation ---
# This allows the unit tests to execute successfully without requiring the installation of 
# llama-index, tiktoken, chromadb, or sentence-transformers in the running environment.

class MockYaml:
    @staticmethod
    def safe_load(stream):
        import re
        content = stream.read() if hasattr(stream, 'read') else str(stream)
        meta = {}
        title_match = re.search(r'title:\s*(.*)', content)
        if title_match:
            meta['title'] = title_match.group(1).strip().strip('"').strip("'")
        
        # Simple list items parser for tags
        tags_section = re.search(r'tags:\s*\n((?:\s*-\s*.*\n?)*)', content)
        if tags_section:
            tags_str = tags_section.group(1)
            meta['tags'] = [t.replace('-', '').strip() for t in tags_str.split('\n') if t.strip()]
        return meta

class MockTiktoken:
    @staticmethod
    def get_encoding(name):
        class MockEncoding:
            def encode(self, text):
                return text.split()
        return MockEncoding()

sys.modules['yaml'] = MockYaml
sys.modules['tiktoken'] = MockTiktoken

# Setup mock modules
sys.modules['llama_index'] = ModuleType('llama_index')

core_mock = ModuleType('llama_index.core')
core_mock.Document = MagicMock()
core_mock.Settings = MagicMock()
core_mock.StorageContext = MagicMock()
core_mock.VectorStoreIndex = MagicMock()
core_mock.load_index_from_storage = MagicMock()
sys.modules['llama_index.core'] = core_mock

parser_mock = ModuleType('llama_index.core.node_parser')
parser_mock.SentenceSplitter = MagicMock()
sys.modules['llama_index.core.node_parser'] = parser_mock

chroma_mock = ModuleType('llama_index.vector_stores.chroma')
chroma_mock.ChromaVectorStore = MagicMock()
sys.modules['llama_index.vector_stores.chroma'] = chroma_mock

llm_mock = ModuleType('llama_index.llms.ollama')
llm_mock.Ollama = MagicMock()
sys.modules['llama_index.llms.ollama'] = llm_mock

embed_mock = ModuleType('llama_index.embeddings.ollama')
embed_mock.OllamaEmbedding = MagicMock()
sys.modules['llama_index.embeddings.ollama'] = embed_mock

sys.modules['sentence_transformers'] = ModuleType('sentence_transformers')
sys.modules['chromadb'] = ModuleType('chromadb')

# --- Import Core Modules under Test ---
from src.ingestion.loader import extract_front_matter, flatten_nav
from src.rag.engine import tag_overlap_score, sigmoid, pack_context, count_tokens

class TestTorqueQueryCore(unittest.TestCase):

    def test_extract_front_matter_valid(self):
        text = "---\ntitle: CIC System\ntags:\n  - cic\n  - system\n---\n# CIC System\nBody content"
        meta, body = extract_front_matter(text)
        self.assertEqual(meta.get("title"), "CIC System")
        self.assertEqual(meta.get("tags"), ["cic", "system"])
        self.assertEqual(body.strip(), "# CIC System\nBody content")

    def test_extract_front_matter_none(self):
        text = "# CIC System\nBody content"
        meta, body = extract_front_matter(text)
        self.assertEqual(meta, {})
        self.assertEqual(body, text)

    def test_flatten_nav_nested(self):
        nav = [
            {"Home": "index.md"},
            {"Build Automation": [
                {"Guide": "automation/guide.md"},
                {"Skills Reference": "automation/skills.md"}
            ]}
        ]
        mapping = flatten_nav(nav)
        self.assertEqual(mapping.get("index.md"), ["Home"])
        self.assertEqual(mapping.get("automation/guide.md"), ["Build Automation", "Guide"])
        self.assertEqual(mapping.get("automation/skills.md"), ["Build Automation", "Skills Reference"])

    def test_tag_overlap_score(self):
        node_tags = ["cic", "phase-3", "roadmap"]
        task_labels = ["cic", "roadmap"]
        score = tag_overlap_score(node_tags, task_labels)
        # 2 overlapping tags out of 2 task labels = 1.0
        self.assertEqual(score, 1.0)

        task_labels_2 = ["cic", "something-else"]
        score_2 = tag_overlap_score(node_tags, task_labels_2)
        # 1 overlapping tag out of 2 task labels = 0.5
        self.assertEqual(score_2, 0.5)

        self.assertEqual(tag_overlap_score([], ["cic"]), 0.0)
        self.assertEqual(tag_overlap_score(["cic"], []), 0.0)

    def test_sigmoid(self):
        self.assertAlmostEqual(sigmoid(0.0), 0.5)
        self.assertGreater(sigmoid(2.0), 0.5)
        self.assertLess(sigmoid(-2.0), 0.5)

    def test_pack_context(self):
        chunks = [
            {"text": "word1 word2", "score": 0.9},
            {"text": "word3 word4 word5", "score": 0.8},
            {"text": "word6", "score": 0.7}
        ]
        packed = pack_context(chunks, max_tokens=1029, reserved=1024)
        self.assertEqual(len(packed), 2)
        self.assertEqual(packed[0]["text"], "word1 word2")
        self.assertEqual(packed[1]["text"], "word3 word4 word5")

if __name__ == '__main__':
    unittest.main()
