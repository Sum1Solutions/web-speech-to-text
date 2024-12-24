"""
Project Summary Generator
-------------------------

Purpose:
This script provides a summarized view of a project's directory structure and content. It filters out certain 
files, directories, and file suffixes while optionally including others. The final summary is written into 
a file named '_PROJECT_SUMMARY.txt' within the directory where the script resides.

Placement in a Larger Project:

Usage:
Run the script within the project's root directory to generate the '_PROJECT_SUMMARY.txt'. (Although this cc.py script is
designed to reside in the root directory of your project, if it's placed inside a `/utils` directory (or similar level
directory), it will treat the root directory as the one above where it's located and will still function.

Customization:
Adjust the constants at the start of the script to tailor the inclusions and exclusions according to your project's needs.
"""

import os
import pathlib

# Define constants for excluded items for clarity and easy modification
EXCLUDED_FILE_SUFFIXES = {".pyc", ".json"}
EXCLUDED_FILE_NAMES = {".env", "cc.py", "concat.py", "PROJECT_SUMMARY.txt"}
EXCLUDED_DIRECTORIES = {"env", "node_modules"}
EXCLUDED_TOP_LEVEL_DIRECTORIES = {"node_modules", "build"}
EXCLUDED_HIDDEN_DIRECTORIES = {".git", ".next"}

# Define items to include despite any exclusion criteria above
INCLUDE_FILES_DESPITE_ABOVE = {"package.json"}
INCLUDE_DIRECTORIES_DESPITE_ABOVE = set()

def is_top_level_excluded(directory, script_dir):
    """Check if a directory should be excluded at the top level."""
    return directory.name in EXCLUDED_TOP_LEVEL_DIRECTORIES and directory.parent == script_dir

def print_directory_tree(path, output_file, prefix="", is_last=False):
    """Print the directory tree to the output file."""
    
    # Ensure the path is a pathlib.Path object
    path = pathlib.Path(path)

    # Get a list of all items in the directory
    contents = list(path.iterdir())

    # Prepare the prefix for the current item and print it
    current_item_prefix = "└── " if is_last else "├── "
    output_file.write(f"{prefix}{current_item_prefix}{path.name}\n")

    new_prefix = f"{prefix}    " if is_last else f"{prefix}│   "

    # Separate the items into files and directories, filtering out excluded items
    files = [
        item for item in contents if item.is_file() 
        and (item.suffix not in EXCLUDED_FILE_SUFFIXES or item.name in INCLUDE_FILES_DESPITE_ABOVE)
        and (item.name not in EXCLUDED_FILE_NAMES or item.name in INCLUDE_FILES_DESPITE_ABOVE)
    ]

    dirs = [
        item for item in contents if item.is_dir() 
        and not item.name.startswith(".") 
        and (item.name not in EXCLUDED_DIRECTORIES or item.name in INCLUDE_DIRECTORIES_DESPITE_ABOVE)
        and not is_top_level_excluded(item, path.parent)
    ]

    # Print all directories and files, directories first
    for i, item in enumerate(dirs + files):
        is_last_item = i == len(dirs + files) - 1
        if item.is_dir():
            print_directory_tree(item, output_file, new_prefix, is_last_item)
        else:
            file_prefix = "└── " if is_last_item else "├── "
            output_file.write(f"{new_prefix}{file_prefix}{item.name}\n")

def print_file_paths_and_content(path, script_dir, output_file, is_root=True):
    """Print the paths and content of the files to the output file."""
    
    # Ensure the path is a pathlib.Path object
    path = pathlib.Path(path)

    # Iterate over all items in the directory
    for item in path.iterdir():
        # Check for files
        if item.is_file():
            # Skip unwanted files unless they are explicitly included
            if (item.suffix in EXCLUDED_FILE_SUFFIXES and item.name not in INCLUDE_FILES_DESPITE_ABOVE) \
               or (item.name in EXCLUDED_FILE_NAMES and item.name not in INCLUDE_FILES_DESPITE_ABOVE):
                continue
            # Print the relative path of the file
            relative_path = item.relative_to(script_dir)
            output_file.write(f"\n\n./{relative_path}\n")
            
            # Try to open the file and print its contents
            try:
                with open(item, "r", encoding="utf-8") as file:
                    output_file.write(file.read() + "\n")
            except Exception as e:
                # If an error occurs, print the error message
                output_file.write(f"Couldn't read file {item} due to: {e}\n")
                
        # Check for directories
        elif item.is_dir():
            # Skip unwanted directories unless they are explicitly included
            if (
                (is_root and item.name in (*EXCLUDED_DIRECTORIES, *EXCLUDED_HIDDEN_DIRECTORIES) and item.name not in INCLUDE_DIRECTORIES_DESPITE_ABOVE) 
                or (not is_root and item.name.startswith(".") and item.name not in INCLUDE_DIRECTORIES_DESPITE_ABOVE)
                or (not is_root and item.name in EXCLUDED_DIRECTORIES and item.name not in INCLUDE_DIRECTORIES_DESPITE_ABOVE)
                or is_top_level_excluded(item, script_dir)
            ):
                continue
            # Recurse into the directory
            print_file_paths_and_content(item, script_dir, output_file, is_root=False)

if __name__ == "__main__":
    # Get the directory where this script is located
    script_dir = pathlib.Path(os.path.dirname(os.path.abspath(__file__)))

    # If the script is in the /utils directory, set the root directory as its parent directory
    if script_dir.name == "utils":
        script_dir = script_dir.parent

    # Define the path for the output file
    output_file_path = script_dir / "PROJECT_SUMMARY.txt"
    
    # Open the output file
    with open(output_file_path, "w", encoding="utf-8") as output_file:
        # Print the directory tree
        print_directory_tree(script_dir, output_file, is_last=True)
        # Print the contents of the files
        print_file_paths_and_content(script_dir, script_dir, output_file)