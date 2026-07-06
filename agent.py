import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from strands import Agent, tool
from strands.models.litellm import LiteLLMModel

load_dotenv()

# ---------------------------------------------------------------------------
# Mock data
# Stands in for real Gmail / Calendar / Slack access. Nothing here touches
# any real personal account. Each tool below returns realistic fake data in
# the exact same shape the real API-backed version would return, so the
# agent's reasoning step works identically either way.
# ---------------------------------------------------------------------------

MOCK_EMAILS = [
    {
        "sender": "manager@acme.com",
        "subject": "Action required: Q3 budget deadline today",
        "date": (datetime.now() - timedelta(hours=1, minutes=30)).isoformat(),
        "snippet": "Hey, need your numbers signed off before end of day, this is urgent, please send ASAP so I can forward to finance."[:200],
    },
    {
        "sender": "sarah@acme.com",
        "subject": "Re: deadline on the client proposal",
        "date": (datetime.now() - timedelta(hours=4)).isoformat(),
        "snippet": "Can you take a look at the attached before 2pm? The client wants a final answer today."[:200],
    },
    {
        "sender": "newsletter@devweekly.com",
        "subject": "This week in software engineering",
        "date": (datetime.now() - timedelta(hours=10)).isoformat(),
        "snippet": "Top stories this week: new framework releases, hiring trends, and more."[:200],
    },
]

MOCK_EVENTS = [
    {
        "title": "Team standup",
        "start": (datetime.now() + timedelta(minutes=45)).isoformat(),
        "end": (datetime.now() + timedelta(hours=1)).isoformat(),
        "location": "Zoom",
        "attendees": ["Rufino", "Bath", "You"],
    },
    {
        "title": "Client call, project kickoff",
        "start": (datetime.now() + timedelta(hours=24)).isoformat(),
        "end": (datetime.now() + timedelta(hours=25)).isoformat(),
        "location": "Google Meet",
        "attendees": ["Client team", "You"],
    },
]

MOCK_SLACK = [
    {
        "channel": "#project-nosy",
        "messages": [
            {"author": "Bath", "text": "pushed the new UI states, ready for review"},
            {"author": "Rufino", "text": "nice, testing now"},
        ],
    },
    {
        "channel": "Rufino (DM)",
        "messages": [
            {"author": "Rufino", "text": "can you review my PR when you get a sec?"},
        ],
    },
]


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@tool
def check_gmail(hours_back: int = 12) -> list:
    """Return recent emails from the last `hours_back` hours (mock data)."""
    cutoff = datetime.now() - timedelta(hours=hours_back)
    return [e for e in MOCK_EMAILS if datetime.fromisoformat(e["date"]) >= cutoff]


@tool
def check_calendar(hours_ahead: int = 24) -> list:
    """Return upcoming events within the next `hours_ahead` hours (mock data)."""
    cutoff = datetime.now() + timedelta(hours=hours_ahead)
    return [e for e in MOCK_EVENTS if datetime.fromisoformat(e["start"]) <= cutoff]


@tool
def check_slack(hours_back: int = 12, max_channels: int = 5) -> list:
    """Return recent messages from up to `max_channels` channels (mock data)."""
    return MOCK_SLACK[:max_channels]


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are Nosy, a morning briefing agent.
Always call all three tools, in this order: check_gmail, check_calendar, check_slack.
Then synthesize a briefing with these exact sections:
URGENT, UPCOMING EVENTS, SLACK HIGHLIGHTS, OTHER EMAILS, SUGGESTED ACTIONS.
"""

model = LiteLLMModel(
    client_args={
        "api_key": os.environ.get("OPENROUTER_API_KEY"),
        "base_url": "https://openrouter.ai/api/v1",
    },
    model_id="openrouter/openrouter/free",
    params={"max_tokens": 4096},
)


def build_agent():
    return Agent(
        model=model,
        tools=[check_gmail, check_calendar, check_slack],
        system_prompt=SYSTEM_PROMPT,
    )


def run():
    agent = build_agent()
    result = agent("What did I miss? Give me my morning briefing.")
    print(result)


if __name__ == "__main__":
    run()

