#!/bin/bash
sudo tee /etc/systemd/system/chatgenius-dev.service << 'EOF'
[Unit]
Description=ChatGenius Development Environment
After=network.target gauntlet-optimizer.service gauntlet-metrics.service
Wants=gauntlet-optimizer.service gauntlet-metrics.service
ConditionPathExists=/etc/gauntlet/chatgenius.env
ConditionPathExists=/usr/local/bin/chatgenius-monitor

[Service]
Type=simple
User=GAUNTLET_USER
EnvironmentFile=/etc/gauntlet/chatgenius.env
ExecStartPre=/bin/mkdir -p ${GAUNTLET_HOME}/logs
ExecStart=/usr/local/bin/chatgenius-monitor
Restart=always
RestartSec=10
CPUWeight=90
IOWeight=90
MemoryHigh=2G
TasksMax=100

[Install]
WantedBy=multi-user.target
EOF 