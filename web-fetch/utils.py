"""
Web Fetch 共享工具模块
提供共享的类和函数，减少代码重复
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
from dataclasses import dataclass

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class Config:
    """配置管理"""
    OUTPUT_DIR: str = "/root/.openclaw/media/outbound"
    MAX_CHARS: int = 30000
    JINA_TIMEOUT: int = 30
    SCRAPLING_TIMEOUT: int = 60
    MAX_RETRIES: int = 2
    MIN_CONTENT_LENGTH_JINA: int = 100
    MIN_CONTENT_LENGTH_SCRAPLING: int = 50
    MAX_CONTENT_SIZE: int = 10485760  # 10MB
    MAX_URL_LENGTH: int = 2048
    
    # 内网IP黑名单（SSRF防护）
    BLOCKED_IPS: list = None
    
    def __post_init__(self):
        if self.BLOCKED_IPS is None:
            self.BLOCKED_IPS = [
                '127.0.0.1',
                'localhost',
                '0.0.0.0',
                '10.',
                '172.16.',
                '172.17.',
                '172.18.',
                '172.19.',
                '172.20.',
                '172.21.',
                '172.22.',
                '172.23.',
                '172.24.',
                '172.25.',
                '172.26.',
                '172.27.',
                '172.28.',
                '172.29.',
                '172.30.',
                '172.31.',
                '192.168.',
            ]
    
    @classmethod
    def from_env(cls):
        """从环境变量加载配置"""
        return cls(
            OUTPUT_DIR=os.getenv('WEB_FETCH_OUTPUT_DIR', cls.OUTPUT_DIR),
            MAX_CHARS=int(os.getenv('WEB_FETCH_MAX_CHARS', cls.MAX_CHARS)),
            JINA_TIMEOUT=int(os.getenv('JINA_TIMEOUT', cls.JINA_TIMEOUT)),
            SCRAPLING_TIMEOUT=int(os.getenv('SCRAPLING_TIMEOUT', cls.SCRAPLING_TIMEOUT)),
            MAX_RETRIES=int(os.getenv('MAX_RETRIES', cls.MAX_RETRIES)),
        )


class Article:
    """文章数据结构"""
    
    def __init__(self, url: str, content: str, method: str, title: str = None):
        self.url = url
        self.content = content
        self.method = method
        self.timestamp = datetime.now().isoformat()
        self.title = title if title else self._extract_title(content)
        
    def _extract_title(self, content: str) -> str:
        """从内容中提取标题"""
        try:
            # 尝试从 Scrapling 返回的标题行提取
            if content.startswith('标题: '):
                lines = content.split('\n')
                return lines[0].replace('标题: ', '').strip()[:100]
            
            # 否则从内容提取
            lines = content.strip().split('\n')
            for line in lines:
                line = line.strip()
                # 跳过图片链接
                if line.startswith('![]('):
                    continue
                # 跳过空行
                if not line:
                    continue
                # 如果是 Markdown 标题
                if line.startswith('# '):
                    return line[2:].strip()[:100]
                # 如果是普通文本
                if line and not line.startswith('#'):
                    return line[:100]
            return "无标题"
        except Exception as e:
            logger.error(f"提取标题失败: {e}")
            return "无标题"
    
    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "url": self.url,
            "title": self.title,
            "content": self.content,
            "method": self.method,
            "timestamp": self.timestamp
        }
    
    def to_markdown(self) -> str:
        """转换为 Markdown 格式"""
        return f"""# {self.title}

**URL:** {self.url}  
**抓取时间:** {self.timestamp}  
**抓取方案:** {self.method}

---

{self.content}

---

*由 Web Fetch 抓取 | 作者: [@Go8888I](https://twitter.com/Go8888I)*
"""
    
    def save_to_file(self, output_dir: Optional[str] = None) -> str:
        """保存为 MD 文件"""
        if output_dir is None:
            config = Config.from_env()
            output_dir = config.OUTPUT_DIR
        
        try:
            Path(output_dir).mkdir(parents=True, exist_ok=True)
            
            # 生成安全的文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_title = self._sanitize_filename(self.title)
            filename = f"article_{timestamp}_{safe_title}.md"
            filepath = Path(output_dir) / filename
            
            # 保存文件
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(self.to_markdown())
            
            logger.info(f"文件已保存: {filepath}")
            return str(filepath)
        except Exception as e:
            logger.error(f"保存文件失败: {e}", exc_info=True)
            raise
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """清理文件名，防止路径遍历"""
        # 只保留字母、数字、空格、横线、下划线
        safe_chars = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_'))
        # 限制长度
        return safe_chars[:50]


def validate_url(url: str) -> tuple[bool, Optional[str]]:
    """
    验证URL安全性
    
    Returns:
        (is_valid, error_message)
    """
    config = Config.from_env()
    
    # 基本格式检查
    if not url or not isinstance(url, str):
        return False, "URL不能为空"
    
    if not url.startswith(('http://', 'https://')):
        return False, "URL必须以http://或https://开头"
    
    # 长度检查
    if len(url) > config.MAX_URL_LENGTH:
        return False, f"URL长度超过限制({config.MAX_URL_LENGTH})"
    
    # 控制字符检查
    if any(ord(c) < 32 for c in url):
        return False, "URL包含非法控制字符"
    
    # NULL字节检查
    if '\x00' in url:
        return False, "URL包含NULL字节"
    
    # SSRF防护：检查内网IP
    url_lower = url.lower()
    for blocked in config.BLOCKED_IPS:
        if blocked in url_lower:
            logger.warning(f"阻止访问内网地址: {url}")
            return False, f"不允许访问内网地址"
    
    return True, None


def send_to_telegram(filepath: str) -> None:
    """发送文件到Telegram"""
    try:
        print(f"\nMEDIA:{filepath}")
        logger.info(f"已发送到Telegram: {filepath}")
    except Exception as e:
        logger.error(f"发送到Telegram失败: {e}", exc_info=True)


def count_pure_text(content: str) -> int:
    """
    统计纯文本字数（去除图片、URL、Markdown标记）
    """
    import re
    
    # 去除Base64图片
    text = re.sub(r'!\[.*?\]\(data:image/[^)]+\)', '', content)
    
    # 去除普通图片链接
    text = re.sub(r'!\[.*?\]\([^)]+\)', '', content)
    
    # 去除URL
    text = re.sub(r'https?://[^\s]+', '', text)
    
    # 去除Markdown标记
    text = re.sub(r'[#*_`\[\]()]', '', text)
    
    # 去除多余空白
    text = ' '.join(text.split())
    
    return len(text)


def count_images(content: str) -> int:
    """统计图片数量"""
    import re
    return len(re.findall(r'!\[.*?\]\(', content))
