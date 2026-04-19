"""
PDF Conversion Service using LibreOffice.
Converts Office documents (DOCX, PPTX, XLSX) to PDF for preview.
"""

import subprocess
import os
import logging
from pathlib import Path
from typing import Optional
import tempfile
import shutil

logger = logging.getLogger(__name__)


class PDFConversionService:
    """Service for converting Office documents to PDF using LibreOffice."""

    # Cache directory for converted PDFs
    CACHE_DIR = Path("uploads/pdf_cache")

    # Supported file extensions for conversion
    SUPPORTED_EXTENSIONS = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.odt', '.odp', '.ods']

    @staticmethod
    def _get_libreoffice_path() -> Optional[str]:
        """Find LibreOffice installation path."""
        # Common installation paths
        possible_paths = [
            # Windows
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            # Linux
            "/usr/bin/libreoffice",
            "/usr/bin/soffice",
            "/usr/local/bin/libreoffice",
            # macOS
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path

        # Try to find in PATH
        try:
            result = subprocess.run(
                ["where" if os.name == 'nt' else "which", "soffice"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass

        return None

    @staticmethod
    def is_available() -> bool:
        """Check if LibreOffice is installed and available."""
        path = PDFConversionService._get_libreoffice_path()
        return path is not None

    @staticmethod
    def _get_cache_path(original_path: Path) -> Path:
        """Get the cache path for a converted PDF."""
        # Create cache directory if it doesn't exist
        PDFConversionService.CACHE_DIR.mkdir(parents=True, exist_ok=True)

        # Use original file's stem + modification time as cache key
        mtime = original_path.stat().st_mtime if original_path.exists() else 0
        cache_name = f"{original_path.stem}_{int(mtime)}.pdf"
        return PDFConversionService.CACHE_DIR / cache_name

    @staticmethod
    def convert_to_pdf(input_path: Path) -> Optional[Path]:
        """
        Convert an Office document to PDF.

        Args:
            input_path: Path to the source Office document

        Returns:
            Path to the converted PDF file, or None if conversion fails
        """
        if not input_path.exists():
            logger.error(f"Input file does not exist: {input_path}")
            return None

        extension = input_path.suffix.lower()
        if extension not in PDFConversionService.SUPPORTED_EXTENSIONS:
            logger.error(f"Unsupported file extension: {extension}")
            return None

        # Check cache first
        cache_path = PDFConversionService._get_cache_path(input_path)
        if cache_path.exists():
            logger.info(f"Using cached PDF: {cache_path}")
            return cache_path

        libreoffice_path = PDFConversionService._get_libreoffice_path()
        if not libreoffice_path:
            logger.error("LibreOffice not found. Please install LibreOffice.")
            return None

        try:
            # Create a temporary directory for conversion output
            with tempfile.TemporaryDirectory() as temp_dir:
                # Run LibreOffice conversion
                cmd = [
                    libreoffice_path,
                    "--headless",
                    "--convert-to", "pdf",
                    "--outdir", temp_dir,
                    str(input_path.absolute())
                ]

                logger.info(f"Running conversion: {' '.join(cmd)}")

                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=120  # 2 minute timeout
                )

                if result.returncode != 0:
                    logger.error(f"LibreOffice conversion failed: {result.stderr}")
                    return None

                # Find the generated PDF
                temp_pdf = Path(temp_dir) / f"{input_path.stem}.pdf"
                if not temp_pdf.exists():
                    logger.error(f"Converted PDF not found at: {temp_pdf}")
                    return None

                # Move to cache
                shutil.move(str(temp_pdf), str(cache_path))
                logger.info(f"PDF conversion successful: {cache_path}")

                return cache_path

        except subprocess.TimeoutExpired:
            logger.error("LibreOffice conversion timed out")
            return None
        except Exception as e:
            logger.error(f"PDF conversion error: {str(e)}")
            return None

    @staticmethod
    def cleanup_cache(max_age_days: int = 7):
        """Remove old cached PDFs."""
        import time

        if not PDFConversionService.CACHE_DIR.exists():
            return

        max_age_seconds = max_age_days * 24 * 60 * 60
        current_time = time.time()

        for cache_file in PDFConversionService.CACHE_DIR.glob("*.pdf"):
            try:
                if current_time - cache_file.stat().st_mtime > max_age_seconds:
                    cache_file.unlink()
                    logger.info(f"Removed old cached PDF: {cache_file}")
            except Exception as e:
                logger.warning(f"Failed to remove cache file {cache_file}: {e}")

    @staticmethod
    def can_convert(file_path: Path) -> bool:
        """Check if a file can be converted to PDF."""
        extension = file_path.suffix.lower()
        return extension in PDFConversionService.SUPPORTED_EXTENSIONS
