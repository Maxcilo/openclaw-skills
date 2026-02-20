#!/usr/bin/env node
/**
 * Polymarket 玩家地址映射
 */

const players = {
    // 本周高ROI玩家
    'kch123': '0x6a72f61820b26b1fe4d956e17b6dc2a1ea3033ee',
    'PuzzleTricker': '0x003932bc605249fbfeb9ea6c3e15ec6e868a6beb',
    'DrPufferfish': '0xdb27bf2ac5d428a9c63dbc914611036855a6c56e',
    'FeatherLeather': '0xd25c72ac0928385610611c8148803dc717334d20',
    'beachboy4': '0xc2e7800b5af46e6093872b177b7a5e7f0563be51',
    'gmpm': '0x14964aefa2cd7caff7878b3820a690a03c5aa429',
    'anoin123': '0x96489abcb9f583d6835c8ef95ffc923d05a86825',
    
    // 其他玩家
    'weflyhigh': '0x03e8a544e97eeff5753bc1e90d46e5ef22af1697'
};

// 获取地址
function getAddress(username) {
    return players[username] || null;
}

// 获取用户名
function getUsername(address) {
    address = address.toLowerCase();
    for (const [username, addr] of Object.entries(players)) {
        if (addr.toLowerCase() === address) {
            return username;
        }
    }
    return null;
}

// 列出所有玩家
function listPlayers() {
    console.log('已知玩家列表:\n');
    console.log('用户名'.padEnd(25) + '地址');
    console.log('-'.repeat(80));
    
    for (const [username, address] of Object.entries(players)) {
        console.log(username.padEnd(25) + address);
    }
}

// 命令行接口
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        listPlayers();
    } else if (args[0] === 'get') {
        const username = args[1];
        const address = getAddress(username);
        if (address) {
            console.log(address);
        } else {
            console.error('未找到玩家:', username);
            process.exit(1);
        }
    } else {
        console.error('未知命令');
        process.exit(1);
    }
}

module.exports = { players, getAddress, getUsername, listPlayers };
