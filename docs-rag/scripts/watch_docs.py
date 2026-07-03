import time
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from src.utils.config import load_config
from src.utils.logging import setup_logging
from src.utils.paths import resolve_path
from scripts.ingest import main as run_ingestion

logger = logging.getLogger("torquequery.watcher")

class DocsHandler(FileSystemEventHandler):
    def __init__(self, debounce_seconds: float = 3.0):
        self.debounce_seconds = debounce_seconds
        self.last_triggered = 0.0

    def on_any_event(self, event):
        if event.is_directory:
            return

        src_path = Path(event.src_path)
        # Re-ingest on markdown doc updates or structural yaml config updates
        if src_path.suffix in [".md", ".yml", ".yaml"]:
            current_time = time.time()
            if current_time - self.last_triggered > self.debounce_seconds:
                logger.info(f"Document change event [{event.event_type}] detected: {src_path.name}")
                logger.info("Triggering debounced auto-ingestion...")
                try:
                    run_ingestion()
                    self.last_triggered = time.time()
                except Exception as e:
                    logger.error(f"Failed to auto-ingest: {e}")

def main():
    setup_logging()
    cfg = load_config()

    docs_dir = resolve_path(cfg["paths"]["docs_root"])
    logger.info(f"Starting TorqueQuery file watcher on: {docs_dir}")

    event_handler = DocsHandler()
    observer = Observer()
    observer.schedule(event_handler, str(docs_dir), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping file watcher...")
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
