#!/bin/bash
set -e

# If the command is in the list, we want to run it as the host-equivalent user
if [ "$1" = "npm" ] && [ "$2" = "install" ]; then
  echo "Running command as $UID:$GID: $*"
  exec gosu "$UID:$GID" "$@"
else
  # Hand off to whatever command was passed
  exec "$@"
fi
