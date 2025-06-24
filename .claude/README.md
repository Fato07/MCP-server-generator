# Claude Code Custom Commands for MCPGen

This directory contains custom slash commands for Claude Code to provide instant context about the MCPGen project.

## Available Commands

### `/project:context`
Complete MCPGen project context including architecture, recent fixes, and current state. Use this to start any session.

### `/project:ai` 
Context for working on AI intelligence features, LLM providers, prompt templates, and cost optimization.

### `/project:core`
Context for the core generation engine, OpenAPI parsing, templates, and generated server structure.

### `/project:cli`
Context for CLI interface, commands, user experience, and integration between components.

### `/project:debug`
Debugging and troubleshooting context with recently fixed issues, common problems, and quality verification.

### `/project:test`
Testing context with strategies, quality checklists, performance benchmarks, and validation workflows.

## Usage Examples

```
# Start a new session with complete context
/project:context

# Working on AI features
/project:ai I need to fix prompt templates

# Debugging generated code
/project:debug The server won't build, missing imports

# Testing new features  
/project:test Verify AI examples generate MCP server code

# Working on CLI improvements
/project:cli Add new command-line options
```

## Command Structure

Each command is a Markdown file that contains:
- Targeted context for the specific area
- Key files and locations
- Recent improvements and fixes
- Quality indicators and best practices
- Relevant code examples
- Support for `$ARGUMENTS` to accept additional context

## Recent Improvements Covered

All commands include awareness of the recent v1.1.0 improvements:
- ✅ AI context fix (MCP server vs REST client code)
- ✅ Template fixes (missing imports resolved)
- ✅ Hanging issues resolved (proper CLI exit)
- ✅ Prompt engineering enhancements

This ensures Claude Code always has up-to-date context about the project's current state and recent achievements.