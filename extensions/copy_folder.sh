#!/bin/bash

# Check the number of command-line arguments
if [ $# -ne 2 ]; then
  echo "Usage: $0 <source_folder> <destination_folder>"
  exit 1
fi

# Source folder
source_folder="$1"

# Destination folder
destination_folder="$2"

# Check if the source folder exists
if [ ! -d "$source_folder" ]; then
  echo "Source folder does not exist: $source_folder"
  exit 1
fi

# Check if the destination folder exists, and if not, create it
if [ ! -d "$destination_folder" ]; then
  mkdir -p "$destination_folder"
fi

# Copy all files from the source folder to the destination folder
cp -r "$source_folder"/* "$destination_folder/"

echo "Files copied from $source_folder to $destination_folder"