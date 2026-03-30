# yt-research

YouTube Research Skill — search YouTube and retrieve video metadata.

## Trigger

Activate when the user asks to:
- Search YouTube for videos on a topic
- Find trending/latest/popular YouTube videos
- Research a topic via YouTube
- Use the "yt-research" skill

## Important

If the user does NOT specify a topic, **ask them what topic they want to research** before proceeding.

## How to Use

Run the Python script at `scripts/yt_research.py` in the project root:

```bash
# Search for 25 videos (default)
python3 scripts/yt_research.py "your search query" -n 25

# Get raw JSON output for piping to other tools
python3 scripts/yt_research.py "your search query" -n 25 --json
```

### Parameters
- **query** (required): The YouTube search query. For trending content, prepend "latest" or "trending" to the topic.
- **-n / --max-results** (optional): Number of results to return. Default: 25.
- **--json** (optional): Output as JSON for programmatic use.

### Output Fields
Each result includes:
- `title` — Video title
- `url` — Full YouTube URL
- `views` — View count
- `author` — Channel / uploader name
- `duration_seconds` — Duration in seconds
- `duration_friendly` — Human-readable duration (e.g., "12:34")
- `upload_date` — Upload date (YYYYMMDD format)
- `description` — First 200 characters of description

## Workflow Example

1. Run the search with `--json` flag
2. Parse the JSON results
3. Present a summary table to the user
4. Hand off URLs to the `notebooklm` skill if requested
