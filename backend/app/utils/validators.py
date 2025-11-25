"""
Validation utilities for files and data.
"""
import os
from typing import List
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings


ALLOWED_EXTENSIONS = {
    "documents": settings.ALLOWED_FILE_EXTENSIONS,
    "images": settings.ALLOWED_IMAGE_EXTENSIONS
}

MAX_FILE_SIZES = {
    "documents": settings.MAX_FILE_SIZE_MB * 1024 * 1024,  # Convert to bytes
    "images": settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
}


def validate_file_extension(filename: str, file_type: str = "documents") -> bool:
    """
    Validate file extension.

    Args:
        filename: Name of the file
        file_type: Type of file ("documents" or "images")

    Returns:
        True if valid

    Raises:
        HTTPException if invalid
    """
    ext = os.path.splitext(filename)[1].lower()
    allowed = ALLOWED_EXTENSIONS.get(file_type, [])

    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {ext} not allowed. Allowed types: {', '.join(allowed)}"
        )
    return True


async def validate_file_size(file: UploadFile, file_type: str = "documents") -> bool:
    """
    Validate file size.

    Args:
        file: Uploaded file
        file_type: Type of file ("documents" or "images")

    Returns:
        True if valid

    Raises:
        HTTPException if file is too large
    """
    max_size = MAX_FILE_SIZES.get(file_type, MAX_FILE_SIZES["documents"])

    # Read file to check size
    contents = await file.read()
    file_size = len(contents)

    # Reset file pointer
    await file.seek(0)

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {max_mb}MB"
        )

    return True


async def validate_uploaded_file(file: UploadFile, file_type: str = "documents") -> bool:
    """
    Validate uploaded file (extension and size).

    Args:
        file: Uploaded file
        file_type: Type of file ("documents" or "images")

    Returns:
        True if valid

    Raises:
        HTTPException if validation fails
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    validate_file_extension(file.filename, file_type)
    await validate_file_size(file, file_type)

    return True
