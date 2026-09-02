from ai_engine.mock.mock_responses import MOCK_INCIDENT_ANALYSIS

class IncidentAnalyzerService:
    def __init__(self, provider: str = "mock", api_key: str = None):
        self.provider = provider
        self.api_key = api_key

    def analyze_incident(self, title: str, description: str, category: str = "General"):
        """
        Analyzes incident details and returns AI priority recommendation and root cause analysis.
        Currently defaults to mock provider; interface is ready for LLM client plug-in.
        """
        if self.provider == "mock":
            return {
                **MOCK_INCIDENT_ANALYSIS,
                "analyzed_incident": title
            }
        
        # Real LLM API integration point (e.g. OpenAI / Gemini)
        raise NotImplementedError("Real LLM provider integration interface ready for Phase 2 API key hookup.")
