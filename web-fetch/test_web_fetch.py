"""
Web Fetch 单元测试
"""

import pytest
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from utils import Config, Article, validate_url, count_pure_text, count_images


class TestConfig:
    """测试配置类"""
    
    def test_default_config(self):
        """测试默认配置"""
        config = Config()
        assert config.OUTPUT_DIR == "/root/.openclaw/media/outbound"
        assert config.MAX_CHARS == 30000
        assert config.JINA_TIMEOUT == 30
        assert config.SCRAPLING_TIMEOUT == 60
    
    def test_blocked_ips(self):
        """测试内网IP黑名单"""
        config = Config()
        assert '127.0.0.1' in config.BLOCKED_IPS
        assert 'localhost' in config.BLOCKED_IPS
        assert '192.168.' in config.BLOCKED_IPS


class TestArticle:
    """测试Article类"""
    
    def test_create_article(self):
        """测试创建文章"""
        article = Article(
            url="https://example.com",
            content="# Test Title\n\nTest content",
            method="test"
        )
        assert article.url == "https://example.com"
        assert article.title == "Test Title"
        assert article.method == "test"
    
    def test_extract_title_from_markdown(self):
        """测试从Markdown提取标题"""
        article = Article(
            url="https://example.com",
            content="# My Title\n\nContent here",
            method="test"
        )
        assert article.title == "My Title"
    
    def test_extract_title_from_text(self):
        """测试从普通文本提取标题"""
        article = Article(
            url="https://example.com",
            content="This is the first line\n\nMore content",
            method="test"
        )
        assert article.title == "This is the first line"
    
    def test_sanitize_filename(self):
        """测试文件名清理"""
        safe = Article._sanitize_filename("Test/File\\Name:With*Special?Chars")
        assert '/' not in safe
        assert '\\' not in safe
        assert ':' not in safe
        assert '*' not in safe
        assert '?' not in safe
    
    def test_to_dict(self):
        """测试转换为字典"""
        article = Article(
            url="https://example.com",
            content="Test content",
            method="test"
        )
        data = article.to_dict()
        assert data['url'] == "https://example.com"
        assert data['content'] == "Test content"
        assert data['method'] == "test"
        assert 'timestamp' in data


class TestValidateUrl:
    """测试URL验证"""
    
    def test_valid_http_url(self):
        """测试有效的HTTP URL"""
        is_valid, error = validate_url("http://example.com")
        assert is_valid is True
        assert error is None
    
    def test_valid_https_url(self):
        """测试有效的HTTPS URL"""
        is_valid, error = validate_url("https://example.com")
        assert is_valid is True
        assert error is None
    
    def test_empty_url(self):
        """测试空URL"""
        is_valid, error = validate_url("")
        assert is_valid is False
        assert "不能为空" in error
    
    def test_invalid_protocol(self):
        """测试无效协议"""
        is_valid, error = validate_url("ftp://example.com")
        assert is_valid is False
        assert "http" in error.lower()
    
    def test_localhost_blocked(self):
        """测试localhost被阻止"""
        is_valid, error = validate_url("http://localhost/test")
        assert is_valid is False
        assert "内网" in error
    
    def test_private_ip_blocked(self):
        """测试私有IP被阻止"""
        is_valid, error = validate_url("http://192.168.1.1/test")
        assert is_valid is False
        assert "内网" in error
    
    def test_loopback_blocked(self):
        """测试回环地址被阻止"""
        is_valid, error = validate_url("http://127.0.0.1/test")
        assert is_valid is False
        assert "内网" in error
    
    def test_control_chars_blocked(self):
        """测试控制字符被阻止"""
        is_valid, error = validate_url("http://example.com\x00")
        assert is_valid is False
    
    def test_long_url_blocked(self):
        """测试超长URL被阻止"""
        long_url = "http://example.com/" + "a" * 3000
        is_valid, error = validate_url(long_url)
        assert is_valid is False
        assert "长度" in error


class TestTextProcessing:
    """测试文本处理函数"""
    
    def test_count_pure_text(self):
        """测试纯文本统计"""
        content = "# Title\n\nThis is text.\n\n![image](data:image/png;base64,xxx)"
        count = count_pure_text(content)
        assert count > 0
        assert "image" not in content or count < len(content)
    
    def test_count_images(self):
        """测试图片统计"""
        content = "Text\n\n![img1](url1)\n\n![img2](url2)"
        count = count_images(content)
        assert count == 2
    
    def test_count_images_none(self):
        """测试无图片"""
        content = "Just text without images"
        count = count_images(content)
        assert count == 0


class TestSSRFProtection:
    """测试SSRF防护"""
    
    def test_block_localhost(self):
        """测试阻止localhost"""
        urls = [
            "http://localhost/",
            "http://127.0.0.1/",
            "http://0.0.0.0/",
        ]
        for url in urls:
            is_valid, error = validate_url(url)
            assert is_valid is False, f"应该阻止: {url}"
    
    def test_block_private_networks(self):
        """测试阻止私有网络"""
        urls = [
            "http://10.0.0.1/",
            "http://172.16.0.1/",
            "http://192.168.0.1/",
        ]
        for url in urls:
            is_valid, error = validate_url(url)
            assert is_valid is False, f"应该阻止: {url}"
    
    def test_allow_public_ips(self):
        """测试允许公网IP"""
        urls = [
            "http://8.8.8.8/",
            "http://1.1.1.1/",
            "http://example.com/",
        ]
        for url in urls:
            is_valid, error = validate_url(url)
            assert is_valid is True, f"应该允许: {url}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
