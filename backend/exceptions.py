from enum import Enum
from typing import Optional, Any, Dict

class ImageServiceProvider(Enum):
    IMAGEN = "IMAGEN"
    DALLE = "DALLE"

class ImageGenerationErrorType(Enum):
    RATE_LIMIT = "RATE_LIMIT"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    SAFETY_VIOLATION = "SAFETY_VIOLATION"
    INVALID_REQUEST = "INVALID_REQUEST"
    API_ERROR = "API_ERROR"
    NETWORK_ERROR = "NETWORK_ERROR"

class ImageGenerationError(Exception):
    def __init__(
        self,
        message: str,
        error_type: ImageGenerationErrorType,
        service: ImageServiceProvider,
        retry_after: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_type = error_type
        self.service = service
        self.retry_after = retry_after
        self.context = context or {}
        super().__init__(self.message)

    @classmethod
    def from_dalle_error(cls, error: Any, context: Optional[Dict[str, Any]] = None) -> 'ImageGenerationError':
        """Convert DALL-E API errors to our custom ImageGenerationError format.
        
        Args:
            error: The error from the DALL-E API
            context: Optional dictionary containing additional context (e.g., topic, level)
            
        Returns:
            ImageGenerationError: Our custom error type with appropriate classification
        """
        error_type = ImageGenerationErrorType.API_ERROR
        message = str(error)
        retry_after = None

        if hasattr(error, 'status_code'):
            if error.status_code == 429:
                error_type = ImageGenerationErrorType.RATE_LIMIT
                retry_after = 60  # Default to 1 minute for rate limits
            elif error.status_code == 400:
                error_type = ImageGenerationErrorType.INVALID_REQUEST
            elif error.status_code == 402:
                error_type = ImageGenerationErrorType.QUOTA_EXCEEDED
        
        if hasattr(error, 'error'):
            if 'safety' in str(error.error).lower():
                error_type = ImageGenerationErrorType.SAFETY_VIOLATION
            elif 'rate' in str(error.error).lower():
                error_type = ImageGenerationErrorType.RATE_LIMIT
                retry_after = 60
            message = str(error.error)

        return cls(
            message=message,
            error_type=error_type,
            service=ImageServiceProvider.DALLE,
            retry_after=retry_after,
            context=context
        )
