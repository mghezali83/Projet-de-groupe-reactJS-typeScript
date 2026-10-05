from pydantic import BaseModel, Field, field_validator


class RequeteConnexion(BaseModel):
    username: str
    password: str


class RegistrationRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=8, max_length=12, pattern=r"^[a-zA-Z0-9]+$")
    password: str = Field(min_length=12, max_length=64)

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le prénom et le nom ne peuvent pas être vides")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        if not any(character.isdigit() for character in password):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        if not any(not character.isalnum() and not character.isspace() for character in password):
            raise ValueError("Le mot de passe doit contenir un caractère spécial")
        return password


class TokenReponse(BaseModel):
    access_token: str
    token_type: str


    