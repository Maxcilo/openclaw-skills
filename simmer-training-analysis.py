#!/usr/bin/env python3
"""
Simmer 训练数据分析脚本
分析交易日志，生成学习报告
"""

import os
import json
import requests
from datetime import datetime

API_KEY = os.environ.get('SIMMER_API_KEY')
BASE_URL = 'https://api.simmer.markets'

def get_portfolio():
    """获取账户信息"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    resp = requests.get(f'{BASE_URL}/api/sdk/agents/me', headers=headers)
    return resp.json()

def get_positions():
    """获取持仓"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    resp = requests.get(f'{BASE_URL}/api/sdk/positions', headers=headers)
    return resp.json()

def get_trades(limit=100):
    """获取交易历史"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    resp = requests.get(f'{BASE_URL}/api/sdk/trades?limit={limit}', headers=headers)
    return resp.json()

def analyze_training():
    """分析训练数据"""
    print("🎓 Simmer 训练数据分析")
    print("=" * 60)
    
    # 获取数据
    portfolio = get_portfolio()
    positions = get_positions()
    trades = get_trades(100)
    
    # 账户状态
    print("\n💰 账户状态:")
    balance = portfolio.get('balance', 0)
    print(f"  余额: ${balance:.2f} $SIM")
    print(f"  交易数: {portfolio.get('trades_count', 0)}")
    print(f"  胜率: {portfolio.get('win_rate') or 0:.1%}")
    pnl = portfolio.get('total_pnl', 0) or 0
    print(f"  总盈亏: ${pnl:.2f}")
    print(f"  状态: {'✅ 已认领' if portfolio.get('claimed') else '⏳ 未认领'}")
    print(f"  真实交易: {'✅ 已启用' if portfolio.get('real_trading_enabled') else '❌ 未启用'}")
    
    # 交易统计
    print(f"\n📊 交易统计:")
    print(f"  总交易数: {portfolio.get('trades_count', 0)}")
    print(f"  胜: {portfolio.get('win_count', 0)}")
    print(f"  负: {portfolio.get('loss_count', 0)}")
    
    print("\n" + "=" * 60)
    print("💪 继续训练！大胆交易，快速学习！")

if __name__ == '__main__':
    try:
        analyze_training()
    except Exception as e:
        print(f"❌ 错误: {e}")
        print("提示: 确保设置了 SIMMER_API_KEY 环境变量")
