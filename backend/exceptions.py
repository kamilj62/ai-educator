from enum import Enum
from typing import Optional, Dict, Any, List

class ErrorType(str, Enum):
    RATE_LIMIT = "RATE_LIMIT"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    SAFETY_VIOLATION = "SAFETY_VIOLATION"
    INVALID_REQUEST = "INVALID_REQUEST"
    API_ERROR = "API_ERROR"
    NETWORK_ERROR = "NETWORK_ERROR"

class ImageServiceProvider(Enum):
    OPENAI = "DALL-E"
    GOOGLE = "Imagen"

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
        error_type: ErrorType,
        service: Optional[ImageServiceProvider] = None,
        retry_after: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None,
        recommendations: Optional[List[str]] = None
    ):
        self.message = message
        self.error_type = error_type
        self.service = service
        self.retry_after = retry_after
        self.context = context or {}
        self.recommendations = recommendations or []
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.error_type,
            "message": self.message,
            "service": self.service.value if self.service else None,
            "retry_after": self.retry_after,
            "context": self.context,
            "recommendations": self.recommendations
        }

    @classmethod
    def from_rate_limit(cls, service: ImageServiceProvider, retry_after: int, context: Optional[Dict[str, Any]] = None) -> 'ImageGenerationError':
        return cls(
            message=f"Rate limit exceeded for {service.value}",
            error_type=ErrorType.RATE_LIMIT,
            service=service,
            retry_after=retry_after,
            context=context,
            recommendations=[
                f"Please wait {retry_after} seconds before retrying",
                "Consider reducing request frequency",
                "Check API quotas and limits"
            ]
        )

    @classmethod
    def from_quota_exceeded(cls, service: ImageServiceProvider, context: Optional[Dict[str, Any]] = None) -> 'ImageGenerationError':
        return cls(
            message=f"API quota exceeded for {service.value}",
            error_type=ErrorType.QUOTA_EXCEEDED,
            service=service,
            context=context,
            recommendations=[
                "Daily quota has been reached",
                "Try again tomorrow",
                "Consider upgrading your API plan"
            ]
        )

    @classmethod
    def from_safety_violation(cls, prompt: str, context: Optional[Dict[str, Any]] = None) -> 'ImageGenerationError':
        return cls(
            message="Content safety violation detected",
            error_type=ErrorType.SAFETY_VIOLATION,
            context={"prompt": prompt, **(context or {})},
            recommendations=[
                "Ensure content is appropriate and non-offensive",
                "Focus on educational and factual content",
                "Remove any sensitive or controversial elements"
            ]
        )

    @classmethod
    def from_network_error(cls, service: ImageServiceProvider, context: Optional[Dict[str, Any]] = None) -> 'ImageGenerationError':
        return cls(
            message=f"Failed to connect to {service.value}",
            error_type=ErrorType.NETWORK_ERROR,
            service=service,
            context=context,
            recommendations=[
                "Check your internet connection",
                "Verify API endpoint is accessible",
                "Try again in a few minutes"
            ]
        )

class ContentSafetyError(Exception):
    def __init__(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        recommendations: Optional[List[str]] = None
    ):
        self.message = message
        self.context = context or {}
        self.recommendations = recommendations or [
            "Focus on factual, educational content",
            "Use balanced and objective language",
            "Include multiple perspectives when appropriate"
        ]
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": ErrorType.SAFETY_VIOLATION,
            "message": self.message,
            "context": self.context,
            "recommendations": self.recommendations
        }

    @classmethod
    def from_topic(cls, topic: str, reason: str) -> 'ContentSafetyError':
        return cls(
            message=reason,
            context={"topic": topic},
            recommendations=[
                "Consider focusing on factual, educational aspects",
                "Use balanced and objective language",
                "Include historical context and multiple perspectives"
            ]
        )
