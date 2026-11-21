from pydantic import BaseModel


class NexconnTokenResponse(BaseModel):
    app_key: str
    user_id: str
    access_token: str
    base_url: str
    is_simulated: bool = False
