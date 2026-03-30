#!/usr/bin/env python3
"""NotebookLM Bridge — create notebooks, add sources (files, URLs), generate artifacts."""

import argparse
import asyncio
import json
import os
import sys

from notebooklm import NotebookLMClient


async def create_notebook(name: str) -> dict:
    """Create a new notebook and return its info."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create(name)
        return {"id": nb.id, "name": name, "status": "created"}


async def add_sources(notebook_id: str, sources: list[str]) -> list[dict]:
    """Add files or URLs as sources to a notebook."""
    added = []
    async with await NotebookLMClient.from_storage() as client:
        for source in sources:
            try:
                if os.path.isfile(source):
                    await client.sources.add_file(notebook_id, source, wait=True)
                    added.append({"source": source, "type": "file", "status": "added"})
                else:
                    await client.sources.add_url(notebook_id, source, wait=True)
                    added.append({"source": source, "type": "url", "status": "added"})
            except Exception as e:
                added.append({"source": source, "status": "error", "error": str(e)})
    return added


async def ask_notebook(notebook_id: str, question: str) -> dict:
    """Ask a question against the notebook sources."""
    async with await NotebookLMClient.from_storage() as client:
        result = await client.chat.ask(notebook_id, question)
        return {"answer": result.answer}


async def generate_artifact(notebook_id: str, artifact_type: str,
                            custom_prompt: str | None = None,
                            output_path: str | None = None) -> dict:
    """Generate an artifact (infographic, slide-deck, flashcards, etc.)."""
    async with await NotebookLMClient.from_storage() as client:
        generator_map = {
            "infographic": client.artifacts.generate_infographic,
            "slide-deck": client.artifacts.generate_slide_deck,
            "flashcards": client.artifacts.generate_flashcards,
            "quiz": client.artifacts.generate_quiz,
            "mind-map": client.artifacts.generate_mind_map,
            "audio": client.artifacts.generate_audio,
            "report": client.artifacts.generate_report,
            "data-table": client.artifacts.generate_data_table,
        }

        gen_fn = generator_map.get(artifact_type)
        if not gen_fn:
            return {"error": f"Unknown artifact type: {artifact_type}. "
                    f"Valid types: {', '.join(generator_map.keys())}"}

        kwargs = {}
        if custom_prompt:
            kwargs["custom_prompt"] = custom_prompt

        status = await gen_fn(notebook_id, **kwargs)
        await client.artifacts.wait_for_completion(notebook_id, status.task_id)

        result = {"type": artifact_type, "status": "completed", "task_id": status.task_id}

        # Attempt download if output path provided
        if output_path:
            download_map = {
                "infographic": client.artifacts.download_infographic,
                "slide-deck": client.artifacts.download_slide_deck,
                "flashcards": client.artifacts.download_flashcards,
                "quiz": client.artifacts.download_quiz,
                "mind-map": client.artifacts.download_mind_map,
                "audio": client.artifacts.download_audio,
                "data-table": client.artifacts.download_data_table,
                "report": client.artifacts.download_report,
            }
            dl_fn = download_map.get(artifact_type)
            if dl_fn:
                await dl_fn(notebook_id, output_path)
                result["downloaded_to"] = output_path

        return result


async def list_notebooks() -> list[dict]:
    """List all notebooks."""
    async with await NotebookLMClient.from_storage() as client:
        notebooks = await client.notebooks.list()
        return [{"id": nb.id, "name": nb.name} for nb in notebooks]


def main():
    parser = argparse.ArgumentParser(description="NotebookLM Bridge")
    sub = parser.add_subparsers(dest="command", required=True)

    # create
    c = sub.add_parser("create", help="Create a notebook")
    c.add_argument("name", help="Notebook name")

    # add-sources
    a = sub.add_parser("add-sources", help="Add files or URLs to a notebook")
    a.add_argument("notebook_id", help="Notebook ID")
    a.add_argument("sources", nargs="+", help="File paths or URLs")

    # ask
    q = sub.add_parser("ask", help="Ask a question")
    q.add_argument("notebook_id", help="Notebook ID")
    q.add_argument("question", help="Question to ask")

    # generate
    g = sub.add_parser("generate", help="Generate an artifact")
    g.add_argument("notebook_id", help="Notebook ID")
    g.add_argument("type", choices=[
        "infographic", "slide-deck", "flashcards", "quiz",
        "mind-map", "audio", "report", "data-table"
    ])
    g.add_argument("--prompt", help="Custom prompt / style instructions")
    g.add_argument("--output", help="Output file path")

    # list
    sub.add_parser("list", help="List notebooks")

    args = parser.parse_args()

    if args.command == "create":
        result = asyncio.run(create_notebook(args.name))
    elif args.command == "add-sources":
        result = asyncio.run(add_sources(args.notebook_id, args.sources))
    elif args.command == "ask":
        result = asyncio.run(ask_notebook(args.notebook_id, args.question))
    elif args.command == "generate":
        result = asyncio.run(generate_artifact(
            args.notebook_id, args.type, args.prompt, args.output))
    elif args.command == "list":
        result = asyncio.run(list_notebooks())
    else:
        parser.print_help()
        sys.exit(1)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
