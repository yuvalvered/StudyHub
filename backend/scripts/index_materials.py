"""
One-time script to index all existing materials into ChromaDB.
Run from the backend directory:
    python -m scripts.index_materials
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.material import Material
from app.services.embedding_service import embed_document, build_material_text
from app.services.chroma_service import index_material


def main():
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not set — cannot generate embeddings")
        sys.exit(1)

    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        materials = db.query(Material).all()
        logger.info(f"Found {len(materials)} materials to index")

        ok_count = 0
        fail_count = 0

        for i, material in enumerate(materials, 1):
            try:
                embed_text = build_material_text(
                    material.title or "",
                    material.description or "",
                    material.file_content_text or "",
                )
                if not embed_text.strip():
                    logger.warning(f"  [{i}/{len(materials)}] material {material.id} has no text — skipping")
                    continue

                embedding = embed_document(embed_text)
                if not embedding:
                    logger.warning(f"  [{i}/{len(materials)}] embed failed for material {material.id}")
                    fail_count += 1
                    continue

                mat_type = str(material.material_type.value if hasattr(material.material_type, 'value') else material.material_type)
                ok = index_material(
                    material_id=material.id,
                    embedding=embedding,
                    course_id=material.course_id,
                    material_type=mat_type,
                )
                if ok:
                    ok_count += 1
                    logger.info(f"  [{i}/{len(materials)}] indexed material {material.id}: {material.title[:50]}")
                else:
                    fail_count += 1
                    logger.warning(f"  [{i}/{len(materials)}] chroma insert failed for material {material.id}")

            except Exception as e:
                fail_count += 1
                logger.error(f"  [{i}/{len(materials)}] error for material {material.id}: {e}")

        logger.info(f"Done. Indexed: {ok_count}, Failed: {fail_count}")
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
