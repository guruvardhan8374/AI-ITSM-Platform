from ai_engine.mock.mock_responses import MOCK_RESOLUTION_ASSISTANCE

class ResolutionAssistantService:
    def __init__(self, provider: str = "mock", api_key: str = None):
        self.provider = provider
        self.api_key = api_key

    def get_resolution_recommendations(self, incident_id: str, title: str):
        """
        Recommends resolution steps, automated scripts, and relevant KB articles.
        """
        if self.provider == "mock":
            return {
                "incident_id": incident_id,
                "incident_title": title,
                **MOCK_RESOLUTION_ASSISTANCE
            }
        
        raise NotImplementedError("Real LLM provider integration interface ready for Phase 2 API key hookup.")
