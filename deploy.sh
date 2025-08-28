#!/bin/bash
set -exo
SCRIPT_DIR=$(dirname "$(realpath $0)")
sudo chown -R :www-data "$SCRIPT_DIR"
sudo chmod -R g+w "$SCRIPT_DIR"
cd "$SCRIPT_DIR"
rm local_ssh_script-before*.sh || true
sudo chmod -Rf 777 app/storage/
php app/reactor migration:up --env=prod