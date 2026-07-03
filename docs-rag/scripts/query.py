import argparse
import logging
import json
from src.utils.config import load_config
from src.utils.logging import setup_logging
from src.rag.engine import init_query_engine, answer

def main():
    setup_logging(level=logging.WARNING)
    logger = logging.getLogger("torquequery.cli.query")
    
    parser = argparse.ArgumentParser(description="Query TorqueQuery Local Knowledge Engine.")
    parser.add_argument("question", nargs="?", type=str, help="The query question.")
    parser.add_argument("--question", "-q", type=str, dest="opt_question", help="The query question (alternative flag).")
    parser.add_argument("--tags", "-t", type=str, default="", help="Comma-separated task tags for context boosting.")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print verbose execution logs.")
    
    args = parser.parse_args()
    
    question = args.question or args.opt_question
    if not question:
        parser.print_help()
        return
        
    if args.verbose:
        # Upgrade logging level
        logging.getLogger().setLevel(logging.INFO)
        logging.getLogger("torquequery").setLevel(logging.INFO)
        
    cfg = load_config()
    index = init_query_engine(cfg)
    
    if index is None:
        print(json.dumps({
            "answer": "Index not found. Please ingest documentation first by running: python -m scripts.ingest",
            "sources": [],
            "confidence": 0.0,
            "not_in_docs": True
        }, indent=2))
        return
        
    task_labels = [tag.strip() for tag in args.tags.split(",") if tag.strip()] if args.tags else []
    
    res = answer(cfg, index, question, task_labels)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
