#!/usr/bin/env python3
"""
Web Fetch Enhanced v2.0 - 增强版网页抓取工具
使用共享utils模块，改进的错误处理和日志
"""

import sys
from typing import Optional, Tuple
from web_fetch import smart_fetch
from utils import Article, Config, validate_url, send_to_telegram, logger


def fetch_and_save(url: str, max_chars: int = 30000) -> Tuple[Optional[Article], Optional[str]]:
    """
    抓取文章并保存
    
    Args:
        url: 目标URL
        max_chars: 最大字符数
    
    Returns:
        (Article, filepath) 或 (None, error_message)
    """
    # 验证URL
    is_valid, error = validate_url(url)
    if not is_valid:
        logger.error(f"URL验证失败: {error}")
        return None, f"URL验证失败: {error}"
    
    # 抓取内容
    try:
        logger.info(f"开始抓取: {url}")
        content, method = smart_fetch(url, max_chars)
        
        if not content:
            logger.error(f"抓取失败: {method}")
            return None, f"抓取失败: {method}"
        
        logger.info(f"抓取成功，使用方案: {method}")
        
    except Exception as e:
        logger.error(f"抓取异常: {type(e).__name__}: {str(e)}", exc_info=True)
        return None, f"抓取异常: {type(e).__name__}: {str(e)}"
    
    # 创建文章对象
    try:
        article = Article(url, content, method)
        logger.info(f"文章标题: {article.title}")
        
    except Exception as e:
        logger.error(f"创建文章对象失败: {e}", exc_info=True)
        return None, f"创建文章对象失败: {str(e)}"
    
    # 保存文件
    try:
        filepath = article.save_to_file()
        logger.info(f"文件已保存: {filepath}")
        return article, filepath
        
    except Exception as e:
        logger.error(f"保存文件失败: {e}", exc_info=True)
        return article, f"保存失败: {str(e)}"


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python3 web_fetch_enhanced.py <url> [max_chars]")
        sys.exit(1)
    
    url = sys.argv[1]
    max_chars = int(sys.argv[2]) if len(sys.argv) > 2 else 30000
    
    print(f"🔍 正在抓取: {url}", file=sys.stderr)
    
    # 抓取并保存
    article, result = fetch_and_save(url, max_chars)
    
    if not article:
        print(f"❌ {result}", file=sys.stderr)
        sys.exit(1)
    
    # 输出到终端（AI 处理区域）
    print(f"\n✅ 抓取成功！", file=sys.stderr)
    print(f"📄 标题: {article.title}", file=sys.stderr)
    print(f"📁 文件: {result}", file=sys.stderr)
    print(f"🔧 方案: {article.method}", file=sys.stderr)
    
    # 发送文件到 Telegram
    if isinstance(result, str) and result.endswith('.md'):
        send_to_telegram(result)
        print(f"📱 已发送到 Telegram", file=sys.stderr)
    
    # 输出文章信息供 AI 处理
    print(f"\n--- 文章信息 ---")
    print(f"标题: {article.title}")
    print(f"URL: {article.url}")
    print(f"抓取时间: {article.timestamp}")
    print(f"抓取方案: {article.method}")
    print(f"内容长度: {len(article.content)} 字符")
    print(f"\n--- 内容预览（前 500 字符）---")
    print(article.content[:500])
    print(f"\n--- 完整内容已保存到文件 ---")


if __name__ == "__main__":
    main()
