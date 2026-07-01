# Git Workflow

## Purpose

This document defines the exact branch workflow for the CareBearBooks Bonus and Salary Increments Simulation project. It is written for Windows PowerShell and the VS Code integrated terminal.

This workflow is planning documentation only. It does not change application code, formulas, or business rules.

## Branch Rules

- Nobody works directly on `main`.
- Nobody works directly on `dev`.
- Everyone starts from latest `dev`.
- Everyone creates their own feature branch.
- Every pull request targets `dev`.
- Only the project owner merges `dev` into `main`.
- Another developer approves the `dev` to `main` pull request before the owner merges it.
- If two people need the same file, they must coordinate first.
- Each pull request must describe what files were changed and why.

## Standard Workflow

1. Pull latest `dev`.
2. Create feature branch.
3. Work on assigned files only.
4. Commit changes.
5. Push feature branch.
6. Open PR into `dev`.
7. Wait for review.
8. Owner merges into `dev`.
9. Owner later opens `dev` to `main` PR.
10. Another developer approves.
11. Owner merges into `main`.

## Windows PowerShell Commands

Run these commands from the repository root:

```powershell
cd "C:\Users\USER\OneDrive\Desktop\Project Simulation\Bonu-and-Salary-Increments-Simulation"
```

### 1. Pull Latest Dev

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
```

If `dev` does not exist locally yet:

```powershell
git fetch origin
git switch -c dev origin/dev
git pull --ff-only origin dev
```

### 2. Create Feature Branch

Choose the assigned branch:

```powershell
git switch -c feature/simulation-engine
```

or:

```powershell
git switch -c feature/dashboard-ui
```

or:

```powershell
git switch -c feature/incentive-rules
```

or:

```powershell
git switch -c feature/scenario-save-load
```

### 3. Work On Assigned Files Only

Check what changed before committing:

```powershell
git status --short
git diff
```

### 4. Commit Changes

Stage only the files that belong to your lane:

```powershell
git add docs/development/TEAM_TASK_SPLIT.md
git add docs/development/GIT_WORKFLOW.md
git add docs/INDEX.md
```

Commit with a clear message:

```powershell
git commit -m "docs: add team task split and git workflow"
```

### 5. Push Feature Branch

Use the branch name assigned to your lane:

```powershell
git push -u origin feature/simulation-engine
```

or:

```powershell
git push -u origin feature/dashboard-ui
```

or:

```powershell
git push -u origin feature/incentive-rules
```

or:

```powershell
git push -u origin feature/scenario-save-load
```

### 6. Open PR Into Dev

Use GitHub or your repository host to open a pull request:

```text
base: dev
compare: your feature branch
```

If GitHub CLI is installed, this command can be used:

```powershell
gh pr create --base dev --head feature/simulation-engine --title "Simulation engine updates" --body "Summary: ...`nFiles changed and why: ..."
```

Replace `feature/simulation-engine`, title, and body with the correct lane and summary.

### 7. Wait For Review

Do not merge your own PR unless the project owner has explicitly assigned that responsibility.

Check PR status if using GitHub CLI:

```powershell
gh pr status
```

### 8. Owner Merges Into Dev

Project owner reviews and merges the feature branch PR into `dev`.

After the PR is merged, every developer updates their local `dev` before starting or continuing work:

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
```

### 9. Owner Opens Dev To Main PR

The owner opens a PR:

```text
base: main
compare: dev
```

If GitHub CLI is installed:

```powershell
gh pr create --base main --head dev --title "Merge dev into main" --body "Release summary: ..."
```

### 10. Another Developer Approves

Another developer reviews and approves the `dev` to `main` PR.

### 11. Owner Merges Into Main

The owner merges the approved `dev` to `main` PR.

Then the owner updates local branches:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git switch dev
git pull --ff-only origin dev
```

## VS Code Terminal Commands

The VS Code integrated terminal should use the same commands. Set the terminal profile to PowerShell, then run:

```powershell
cd "C:\Users\USER\OneDrive\Desktop\Project Simulation\Bonu-and-Salary-Increments-Simulation"
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feature/dashboard-ui
git status --short
git diff
git add <file-path>
git commit -m "short clear message"
git push -u origin feature/dashboard-ui
```

Replace `feature/dashboard-ui` with the assigned branch.

## Keeping A Feature Branch Current

While working, regularly update from `dev`:

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch feature/dashboard-ui
git merge dev
```

Replace `feature/dashboard-ui` with your branch.

If the merge touches files outside your lane or creates conflicts, coordinate before resolving.

## Pull Request Description Template

```text
Developer lane:
Branch:

Summary:

Files changed and why:

Coordinated files touched:

Documentation updated:

Confirmation:
- I did not work directly on main.
- I did not work directly on dev.
- This PR targets dev.
- I changed only assigned or coordinated files.
- I did not invent business rules.
- I did not change formulas unless approved and documented.
```

## AI Assistant Notes

When generating Git instructions, use `dev` as the integration branch and `main` as the protected release branch. Do not recommend committing directly to either branch.
