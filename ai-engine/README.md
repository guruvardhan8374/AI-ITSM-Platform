# AI Engine Module - ITSM Platform

The **AI Engine** is a dedicated service module responsible for incident prioritization, automated root cause analysis, and AI-assisted resolution recommendations.

## Architecture

```
ai-engine/
├── services/
│   ├── incident_analyzer.py      # AI Incident Analysis & Root Cause service
│   └── resolution_assistant.py   # AI Resolution & KB matching service
├── models/                       # Pydantic AI request/response models
├── prompts/
│   └── templates.py              # Prompt engineering templates for LLMs
├── mock/
│   └── mock_responses.py         # Mock response engine for development/testing
└── README.md
```

## Connecting Real LLM APIs

To switch from the initial mock provider to a real LLM provider (e.g. OpenAI GPT-4, Anthropic Claude, or Google Gemini):

1. Set `AI_PROVIDER="openai"` (or `gemini`) in `.env`.
2. Add your API key: `OPENAI_API_KEY="sk-..."`.
3. The clean service interfaces (`IncidentAnalyzerService`, `ResolutionAssistantService`) will invoke the API client seamlessly without requiring changes to the core backend or frontend.
