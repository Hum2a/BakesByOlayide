#!/usr/bin/env python3
"""
Count lines of code under a directory tree.

Skips dependency/build folders and optionally lock/minified files.
Run from repo root: python scripts/count_loc.py
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict
from pathlib import Path


DEFAULT_SKIP_DIR_NAMES = frozenset(
    {
        ".git",
        ".hg",
        ".svn",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        "env",
        ".env",
        "build",
        "dist",
        "out",
        ".next",
        "coverage",
        ".nyc_output",
        ".turbo",
        ".cache",
    }
)

DEFAULT_EXTENSIONS = frozenset(
    {
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",
        ".css",
        ".scss",
        ".html",
        ".json",
        ".py",
        ".sh",
        ".rules",  # e.g. firestore.rules
    }
)

SKIP_FILE_NAMES = frozenset(
    {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
    }
)


def should_skip_dir(name: str, skip_dirs: frozenset[str]) -> bool:
    return name in skip_dirs or name.startswith(".")


def should_skip_file(path: Path, skip_locks: bool) -> bool:
    name = path.name
    if skip_locks and name in SKIP_FILE_NAMES:
        return True
    lower = name.lower()
    if lower.endswith(".min.js") or lower.endswith(".bundle.js"):
        return True
    return False


def count_lines_in_file(path: Path) -> tuple[int, int, bool]:
    """Returns (total_lines, non_blank_lines, ok). ok is False on read error."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return 0, 0, False
    lines = text.splitlines()
    total = len(lines)
    non_blank = sum(1 for ln in lines if ln.strip())
    return total, non_blank, True


def collect_stats(
    root: Path,
    extensions: frozenset[str],
    skip_dirs: frozenset[str],
    skip_locks: bool,
    count_blank: bool,
) -> tuple[dict[str, int], dict[str, int], int]:
    """
    Walk tree; return (lines_by_ext, files_by_ext, files_skipped_unreadable).
    Line counts use the second return from count_lines_in_file when
    count_blank is False (non-blank only); when True, first value is used.
    """
    lines_by_ext: dict[str, int] = defaultdict(int)
    files_by_ext: dict[str, int] = defaultdict(int)
    skipped = 0

    root_str = str(root)
    for dirpath, dirnames, filenames in os.walk(root_str, topdown=True):
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d, skip_dirs)]
        for fname in filenames:
            path = Path(dirpath) / fname
            if should_skip_file(path, skip_locks):
                continue
            ext = path.suffix.lower()
            if ext not in extensions:
                continue
            total, non_blank, ok = count_lines_in_file(path)
            if not ok:
                skipped += 1
                continue
            n = total if count_blank else non_blank
            lines_by_ext[ext] += n
            files_by_ext[ext] += 1

    return dict(lines_by_ext), dict(files_by_ext), skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root",
        nargs="?",
        type=Path,
        default=Path.cwd(),
        help="Directory to scan (default: current working directory)",
    )
    parser.add_argument(
        "--include-blank-lines",
        action="store_true",
        help="Count every line including blanks (default: non-blank lines only)",
    )
    parser.add_argument(
        "--include-lockfiles",
        action="store_true",
        help="Include package-lock.json / yarn.lock / pnpm-lock.yaml",
    )
    parser.add_argument(
        "--ext",
        metavar="EXT",
        action="append",
        dest="extra_exts",
        help="Additional extension to include, e.g. --ext .md (repeatable)",
    )
    parser.add_argument(
        "--list-ext-only",
        action="store_true",
        help="Print per-extension table only (no grand total header)",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        return 1

    exts = set(DEFAULT_EXTENSIONS)
    if args.extra_exts:
        for e in args.extra_exts:
            e = e.strip().lower()
            if not e.startswith("."):
                e = "." + e
            exts.add(e)

    lines_by_ext, files_by_ext, skipped = collect_stats(
        root,
        frozenset(exts),
        DEFAULT_SKIP_DIR_NAMES,
        skip_locks=not args.include_lockfiles,
        count_blank=args.include_blank_lines,
    )

    if not lines_by_ext:
        print("No matching files found.")
        return 0

    # Sort extensions by line count descending
    rows = sorted(lines_by_ext.items(), key=lambda x: (-x[1], x[0]))
    total_lines = sum(lines_by_ext.values())
    total_files = sum(files_by_ext.values())

    mode = "all lines" if args.include_blank_lines else "non-blank lines"
    if not args.list_ext_only:
        print(f"Root: {root}")
        print(f"Mode: {mode}")
        print(f"Files: {total_files}  |  Lines: {total_lines}")
        if skipped:
            print(f"(Skipped {skipped} files that could not be read as text.)")
        print()

    w_ext = max(len("extension"), max(len(e) for e in lines_by_ext))
    w_files = len(str(max(files_by_ext.values())))
    w_lines = len(str(total_lines))
    print(f"{'extension':<{w_ext}}  {'files':>{w_files}}  {'lines':>{w_lines}}")
    print("-" * (w_ext + w_files + w_lines + 4))
    for ext, nlines in rows:
        nf = files_by_ext.get(ext, 0)
        print(f"{ext:<{w_ext}}  {nf:>{w_files}}  {nlines:>{w_lines}}")
    print("-" * (w_ext + w_files + w_lines + 4))
    print(f"{'TOTAL':<{w_ext}}  {total_files:>{w_files}}  {total_lines:>{w_lines}}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
