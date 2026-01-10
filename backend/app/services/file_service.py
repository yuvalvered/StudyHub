"""
File service for processing uploaded files (PDF text extraction, etc.)
"""
import pdfplumber
from pathlib import Path
from typing import Optional
import logging
import re

logger = logging.getLogger(__name__)


class FileService:
    """Service for processing file content."""

    @staticmethod
    def fix_hebrew_direction(text: str) -> str:
        """
        Fix Hebrew text direction issues that occur during PDF extraction.

        PDFs with RTL text extract with fully reversed text - both character order
        within words AND word order in sentences. This function fixes both issues.

        Example:
            Input:  "ת וכרעמב תוטלחה" (reversed from PDF)
            Output: "החלטות במערכות" (correct Hebrew)

        Args:
            text: Extracted text that may have reversed Hebrew

        Returns:
            Text with corrected Hebrew direction
        """
        if not text:
            return text

        # Process line by line to handle mixed Hebrew/English content
        lines = text.split('\n')
        fixed_lines = []

        for line in lines:
            # Check if line contains Hebrew
            has_hebrew = any('\u0590' <= c <= '\u05FF' for c in line)

            if has_hebrew:
                # Split into tokens, keeping separators
                # This captures words, spaces, and punctuation separately
                tokens = re.split(r'(\s+)', line)

                # Separate Hebrew and non-Hebrew segments
                # We need to reverse ONLY the Hebrew segments, not English
                segments = []
                current_segment = []
                is_hebrew_segment = None

                for token in tokens:
                    token_has_hebrew = token and any('\u0590' <= c <= '\u05FF' for c in token)

                    # Start new segment if language changes
                    if is_hebrew_segment is None:
                        is_hebrew_segment = token_has_hebrew
                    elif is_hebrew_segment != token_has_hebrew and token.strip():
                        # Language changed - save current segment
                        segments.append((is_hebrew_segment, current_segment))
                        current_segment = []
                        is_hebrew_segment = token_has_hebrew

                    current_segment.append(token)

                # Add last segment
                if current_segment:
                    segments.append((is_hebrew_segment, current_segment))

                # Process each segment
                fixed_tokens = []
                for is_hebrew, segment_tokens in segments:
                    if is_hebrew:
                        # Reverse Hebrew segment order
                        segment_tokens.reverse()

                        # Reverse each Hebrew word's characters
                        for token in segment_tokens:
                            if token and any('\u0590' <= c <= '\u05FF' for c in token):
                                fixed_tokens.append(token[::-1])
                            else:
                                fixed_tokens.append(token)
                    else:
                        # Keep non-Hebrew as is
                        fixed_tokens.extend(segment_tokens)

                # Join tokens
                fixed_line = ''.join(fixed_tokens)

                # Fix cases where single Hebrew letters got separated by spaces
                fixed_line = re.sub(r'([\u0590-\u05FF]{2,}) ([\u0590-\u05FF]{1})\b', r'\1\2', fixed_line)
                fixed_line = re.sub(r'\b([\u0590-\u05FF]{1}) ([\u0590-\u05FF]{2,})', r'\1\2', fixed_line)

                # Clean up multiple spaces
                fixed_line = re.sub(r' +', ' ', fixed_line).strip()
                fixed_lines.append(fixed_line)
            else:
                # Non-Hebrew lines: keep as is
                fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    @staticmethod
    def extract_pdf_text(file_path: str) -> Optional[str]:
        """
        Extract text from a PDF file.

        Args:
            file_path: Path to the PDF file

        Returns:
            Extracted text as string, or None if extraction fails
        """
        try:
            # Check if file exists
            pdf_file = Path(file_path)
            if not pdf_file.exists():
                logger.error(f"PDF file not found: {file_path}")
                return None

            # Extract text using pdfplumber
            text_content = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)

            # Join all pages with newline
            full_text = "\n".join(text_content)

            if not full_text.strip():
                logger.warning(f"No text extracted from PDF: {file_path}")
                return None

            # Fix Hebrew text direction
            full_text = FileService.fix_hebrew_direction(full_text)

            logger.info(f"Successfully extracted {len(full_text)} characters from {file_path}")
            return full_text

        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            return None

    @staticmethod
    def extract_file_text(file_path: str, file_extension: str) -> Optional[str]:
        """
        Extract text from a file based on its extension.

        Args:
            file_path: Path to the file
            file_extension: File extension (e.g., '.pdf', '.docx')

        Returns:
            Extracted text as string, or None if extraction fails or not supported
        """
        # Normalize extension to lowercase
        ext = file_extension.lower()

        # Currently only PDF is supported
        if ext == ".pdf":
            return FileService.extract_pdf_text(file_path)

        # Future: Add DOCX, PPTX support here
        # elif ext == ".docx":
        #     return FileService.extract_docx_text(file_path)

        logger.info(f"Text extraction not supported for file type: {ext}")
        return None
