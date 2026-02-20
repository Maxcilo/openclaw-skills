#!/bin/bash
export SIMMER_API_KEY="sk_live_c3f9aaf8996b520fdf181315659aa9d8a794b9222ec7fe85dfa8eef25eaa4028"
export WALLET_PRIVATE_KEY="0x3e28bc642f1ac02e575581a9957e6f769c37cf671c934c039c20181bcf68c016"
export SIMMER_WEATHER_ENTRY=0.35
export SIMMER_WEATHER_EXIT=0.45
export SIMMER_WEATHER_MAX_POSITION=5.00
export SIMMER_WEATHER_MAX_TRADES=10
export SIMMER_WEATHER_LOCATIONS="NYC,Chicago,Seattle,Atlanta,Dallas,Miami"

cd /root/.openclaw/workspace/skills/polymarket-weather-trader
/usr/bin/python3 weather_trader.py --live --smart-sizing
