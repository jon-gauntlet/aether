#!/bin/bash

# Only execute timer with arguments
if [ $# -eq 0 ]; then
    exit 0
fi

# Forward all arguments to the real timer command
/usr/bin/timer "$@" 