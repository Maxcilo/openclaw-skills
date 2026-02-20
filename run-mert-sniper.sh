#!/bin/bash
export SIMMER_API_KEY="sk_live_c3f9aaf8996b520fdf181315659aa9d8a794b9222ec7fe85dfa8eef25eaa4028"
export WALLET_PRIVATE_KEY="0x3e28bc642f1ac02e575581a9957e6f769c37cf671c934c039c20181bcf68c016"
export SIMMER_MERT_MAX_BET=10.00
export SIMMER_MERT_EXPIRY_MINS=10
export SIMMER_MERT_MIN_SPLIT=0.52
export SIMMER_MERT_MAX_TRADES=10

cd /root/.openclaw/workspace/skills/polymarket-mert-sniper
/usr/bin/python3 mert_sniper.py --live --smart-sizing
