#!/usr/bin/env python3
"""
Trade Logger - 自动记录预测市场交易到 prediction-log.js
"""

import subprocess
import json
from pathlib import Path

# prediction-log.js 的路径（相对于 workspace root）
WORKSPACE_ROOT = Path(__file__).parent.parent.parent
PREDICTION_LOG = WORKSPACE_ROOT / "prediction-log.js"


def log_buy(platform: str, market: str, option: str, price: float, amount: float, 
            strategy: str = "Weather", reason: str = "") -> bool:
    """
    记录买入交易
    
    Args:
        platform: 平台名称 (Simmer/Polymarket)
        market: 市场名称
        option: 选项 (Yes/No)
        price: 买入价格 (0-1)
        amount: 投入金额 (USD)
        strategy: 策略名称
        reason: 交易依据
    
    Returns:
        bool: 是否记录成功
    """
    try:
        cmd = [
            str(PREDICTION_LOG),
            "add",
            platform,
            market,
            option,
            str(price),
            str(amount),
            strategy,
            reason
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"  📝 Trade logged to prediction-log.js")
            return True
        else:
            print(f"  ⚠️  Failed to log trade: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  ⚠️  Trade logging error: {e}")
        return False


def log_sell(trade_id: int, outcome: str) -> bool:
    """
    记录卖出/结算
    
    Args:
        trade_id: 交易ID
        outcome: 结果 (win/loss/refund)
    
    Returns:
        bool: 是否记录成功
    """
    try:
        cmd = [
            str(PREDICTION_LOG),
            "resolve",
            str(trade_id),
            outcome
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"  📝 Trade resolved in prediction-log.js")
            return True
        else:
            print(f"  ⚠️  Failed to resolve trade: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  ⚠️  Trade resolve error: {e}")
        return False


def get_open_positions() -> list:
    """
    获取持仓列表
    
    Returns:
        list: 持仓列表
    """
    try:
        cmd = [str(PREDICTION_LOG), "list"]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            trades = json.loads(result.stdout)
            return [t for t in trades if t.get('status') == 'open']
        else:
            return []
            
    except Exception as e:
        print(f"  ⚠️  Failed to get positions: {e}")
        return []


if __name__ == "__main__":
    # 测试
    print("Testing trade logger...")
    
    # 测试买入
    success = log_buy(
        platform="Simmer",
        market="Will BTC hit $100k by March?",
        option="Yes",
        price=0.65,
        amount=100.0,
        strategy="Weather",
        reason="NOAA forecast test"
    )
    
    print(f"Buy log: {'✅' if success else '❌'}")
    
    # 测试获取持仓
    positions = get_open_positions()
    print(f"Open positions: {len(positions)}")
