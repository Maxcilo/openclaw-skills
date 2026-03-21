#!/bin/bash
# EVM 地址管理快速脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 主地址
MAIN_ADDRESS="0x2fEE02faD2FF69A7905767b6E5B54C610D425941"

echo -e "${BLUE}🔐 EVM 地址管理工具${NC}"
echo "===================="
echo ""

# 显示菜单
show_menu() {
    echo -e "${GREEN}请选择操作：${NC}"
    echo ""
    echo "  1. 查询主地址余额"
    echo "  2. 查询所有子地址余额"
    echo "  3. 分发 Gas (0.01 ETH)"
    echo "  4. 分发 Gas (0.001 ETH)"
    echo "  5. 归集 ETH 到主地址"
    echo "  6. 归集代币到主地址"
    echo "  7. 查询主地址信息"
    echo "  8. 批量转账代币"
    echo "  9. 查看地址清单"
    echo "  0. 退出"
    echo ""
}

# 查询主地址余额
query_main_balance() {
    echo -e "${BLUE}📊 查询主地址余额...${NC}"
    ./evm.js balance --address $MAIN_ADDRESS
    echo ""
}

# 查询所有子地址余额
query_all_balance() {
    echo -e "${BLUE}📊 查询所有子地址余额...${NC}"
    ./evm.js balance --file sub-wallets-1-20.json
    echo ""
}

# 分发 Gas (0.01 ETH)
distribute_gas_01() {
    echo -e "${YELLOW}⚠️  即将向20个子地址分发 Gas（每个 0.01 ETH）${NC}"
    echo -e "${YELLOW}   总计需要: 0.2 ETH + gas 费用${NC}"
    echo ""
    read -p "确认继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始分发...${NC}"
        ./evm.js transfer --eth --file gas-distribution-0.01.json
    else
        echo -e "${RED}❌ 已取消${NC}"
    fi
    echo ""
}

# 分发 Gas (0.001 ETH)
distribute_gas_001() {
    echo -e "${YELLOW}⚠️  即将向20个子地址分发 Gas（每个 0.001 ETH）${NC}"
    echo -e "${YELLOW}   总计需要: 0.02 ETH + gas 费用${NC}"
    echo ""
    read -p "确认继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始分发...${NC}"
        ./evm.js transfer --eth --file gas-distribution-0.001.json
    else
        echo -e "${RED}❌ 已取消${NC}"
    fi
    echo ""
}

# 归集 ETH
collect_eth() {
    echo -e "${YELLOW}⚠️  即将归集所有子地址的 ETH 到主地址${NC}"
    echo ""
    read -p "确认继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始归集...${NC}"
        ./evm.js collect --eth --file sub-wallets-1-20.json
    else
        echo -e "${RED}❌ 已取消${NC}"
    fi
    echo ""
}

# 归集代币
collect_token() {
    echo -e "${BLUE}📝 请输入代币合约地址:${NC}"
    read token_address
    
    if [ -z "$token_address" ]; then
        echo -e "${RED}❌ 地址不能为空${NC}"
        return
    fi
    
    echo -e "${YELLOW}⚠️  即将归集所有子地址的代币到主地址${NC}"
    echo -e "${YELLOW}   代币地址: $token_address${NC}"
    echo ""
    read -p "确认继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始归集...${NC}"
        ./evm.js collect --token $token_address --file sub-wallets-1-20.json
    else
        echo -e "${RED}❌ 已取消${NC}"
    fi
    echo ""
}

# 查询主地址信息
query_main_info() {
    echo -e "${BLUE}📊 查询主地址详细信息...${NC}"
    ./evm.js info --address $MAIN_ADDRESS --tokens
    echo ""
}

# 批量转账代币
batch_transfer_token() {
    echo -e "${BLUE}📝 请输入代币合约地址:${NC}"
    read token_address
    
    if [ -z "$token_address" ]; then
        echo -e "${RED}❌ 地址不能为空${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 请输入接收地址列表文件:${NC}"
    read recipients_file
    
    if [ ! -f "$recipients_file" ]; then
        echo -e "${RED}❌ 文件不存在: $recipients_file${NC}"
        return
    fi
    
    echo -e "${YELLOW}⚠️  即将批量转账代币${NC}"
    echo -e "${YELLOW}   代币地址: $token_address${NC}"
    echo -e "${YELLOW}   接收列表: $recipients_file${NC}"
    echo ""
    read -p "确认继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始转账...${NC}"
        ./evm.js transfer --token $token_address --file $recipients_file
    else
        echo -e "${RED}❌ 已取消${NC}"
    fi
    echo ""
}

# 查看地址清单
view_addresses() {
    echo -e "${BLUE}📋 地址清单${NC}"
    echo ""
    echo -e "${GREEN}0号地址（主地址）:${NC}"
    echo "  $MAIN_ADDRESS"
    echo ""
    echo -e "${GREEN}1-20号地址（子地址）:${NC}"
    cat addresses-only.txt | head -20 | nl
    echo ""
}

# 主循环
while true; do
    show_menu
    read -p "请输入选项 (0-9): " choice
    echo ""
    
    case $choice in
        1)
            query_main_balance
            ;;
        2)
            query_all_balance
            ;;
        3)
            distribute_gas_01
            ;;
        4)
            distribute_gas_001
            ;;
        5)
            collect_eth
            ;;
        6)
            collect_token
            ;;
        7)
            query_main_info
            ;;
        8)
            batch_transfer_token
            ;;
        9)
            view_addresses
            ;;
        0)
            echo -e "${GREEN}👋 再见！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项，请重新选择${NC}"
            echo ""
            ;;
    esac
    
    read -p "按回车键继续..."
    clear
done
