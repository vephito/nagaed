import json
import logging
import os
import re

from fastapi import FastAPI, HTTPException
from groq import APIError, Groq
from pydantic import BaseModel, Field, ValidationError, field_validator


app = FastAPI(title="Username Suggestions API", version="1.0.0")
logger = logging.getLogger(__name__)


class SuggestionRequest(BaseModel):
    interests: list[str] = Field(min_length=1, max_length=8)

    @field_validator("interests")
    @classmethod
    def clean_interests(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        if any(not value or len(value) > 50 for value in cleaned):
            raise ValueError("Each interest must be 1–50 characters.")
        return cleaned


class SuggestionResponse(BaseModel):
    suggestions: list[str] = Field(min_length=3, max_length=3)

    @field_validator("suggestions")
    @classmethod
    def check_suggestions(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        if any(not re.fullmatch(r"[A-Za-z0-9_]{3,24}", value) for value in cleaned):
            raise ValueError("Usernames must be 3–24 letters, numbers, or underscores.")
        if len({value.lower() for value in cleaned}) != 3:
            raise ValueError("Usernames must be unique.")
        return cleaned


@app.post(
    "/api/suggest-username",
    response_model=SuggestionResponse,
    summary="Suggest three usernames",
    description="Uses Groq to suggest three unique usernames from your interests.",
)
def suggest_username(request: SuggestionRequest) -> SuggestionResponse:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not set.")

    try:
        completion = Groq(api_key=api_key, timeout=20.0).chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Create three creative, distinct usernames inspired by the user's interests. "
                        "Use 3–24 letters, numbers, or underscores per name. "
                        "Return only a JSON object in this exact shape: "
                        '{"suggestions": ["name1", "name2", "name3"]}.'
                    ),
                },
                {"role": "user", "content": json.dumps({"interests": request.interests})},
            ],
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content
        return SuggestionResponse.model_validate_json(content)
    except APIError as error:
        logger.error("Groq request failed: %s", type(error).__name__)
        raise HTTPException(status_code=502, detail="Username service is unavailable. Please try again.") from error
    except (ValidationError, ValueError, TypeError, IndexError) as error:
        logger.error("Groq returned invalid suggestions: %s", type(error).__name__)
        raise HTTPException(status_code=502, detail="Could not generate usernames. Please try again.") from error
