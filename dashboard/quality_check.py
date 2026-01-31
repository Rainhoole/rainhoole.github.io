#!/usr/bin/env python3
"""
Rainhoole Dashboard - 代码质量检查脚本
测试工程师: AI Testing Agent
"""

import os
import re
import json
from pathlib import Path

class QualityChecker:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.issues = []
        self.warnings = []
        self.passed = []
    
    def check_file_exists(self, filepath):
        """检查文件是否存在"""
        full_path = self.project_root / filepath
        if full_path.exists():
            self.passed.append(f"文件存在: {filepath}")
            return True
        else:
            self.issues.append(f"缺失文件: {filepath}")
            return False
    
    def check_html_structure(self, html_content):
        """检查HTML结构质量"""
        # 检查 lang 属性
        if 'lang="' in html_content or "lang='" in html_content:
            self.passed.append("HTML lang 属性已设置")
        else:
            self.warnings.append("HTML 缺少 lang 属性")
        
        # 检查 meta charset
        if 'charset' in html_content:
            self.passed.append("字符编码已设置")
        else:
            self.issues.append("HTML 缺少字符编码设置")
        
        # 检查 viewport
        if 'viewport' in html_content:
            self.passed.append("移动端视口已配置")
        else:
            self.warnings.append("HTML 缺少 viewport 设置")
        
        # 检查 title
        if '<title>' in html_content and '</title>' in html_content:
            self.passed.append("页面标题已设置")
        else:
            self.issues.append("HTML 缺少页面标题")
        
        # 检查图片 alt 属性
        img_tags = re.findall(r'<img[^>]*>', html_content)
        for img in img_tags:
            if 'alt=' not in img:
                self.warnings.append(f"图片缺少 alt 属性: {img[:50]}...")
        
        if not img_tags:
            self.passed.append("无图片需要 alt 属性")
    
    def check_python_code(self, py_content):
        """检查Python代码质量"""
        # 检查异常处理
        if 'try:' in py_content or 'except' in py_content:
            self.passed.append("包含异常处理机制")
        else:
            self.warnings.append("Python 代码缺少异常处理")
        
        # 检查类型注解
        if ': str' in py_content or ': int' in py_content or ': bool' in py_content:
            self.passed.append("使用类型注解")
        else:
            self.warnings.append("Python 代码未使用类型注解")
        
        # 检查 docstring
        if '"""' in py_content or "'''" in py_content:
            self.passed.append("包含文档字符串")
        else:
            self.warnings.append("Python 函数缺少文档字符串")
        
        # 检查常量命名
        const_pattern = r'^[A-Z][A-Z0-9_]*\s*='
        lines = py_content.split('\n')
        for i, line in enumerate(lines, 1):
            if '=' in line and not line.strip().startswith('#'):
                if re.match(const_pattern, line.strip()):
                    self.passed.append(f"常量命名规范 (行 {i})")
    
    def check_css_quality(self, css_content):
        """检查CSS代码质量"""
        # 检查分号使用
        if '}' in css_content:
            lines = css_content.split('\n')
            missing_semicolons = 0
            for i, line in enumerate(lines, 1):
                line = line.strip()
                if line and not line.startswith('//') and not line.startswith('/*'):
                    if not line.endswith(';') and not line.endswith('}') and not line.startswith('@'):
                        missing_semicolons += 1
            
            if missing_semicolons == 0:
                self.passed.append("CSS 分号使用正确")
            else:
                self.warnings.append(f"CSS 可能缺少 {missing_semicolons} 个分号")
        
        # 检查颜色值
        if 'color:' in css_content or 'background' in css_content:
            self.passed.append("CSS 包含样式定义")
    
    def run_checks(self):
        """执行所有检查"""
        print("🔍 开始代码质量检查...\n")
        
        # 检查必要文件
        print("📁 检查必要文件...")
        required_files = [
            'index.html',
            'README.md',
            'dashboard/README.md',
            'dashboard/config.py'
        ]
        for f in required_files:
            self.check_file_exists(f)
        
        # 检查 HTML 文件
        html_path = self.project_root / 'index.html'
        if html_path.exists():
            print("\n📄 检查 HTML 结构...")
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.check_html_structure(html_content)
        
        # 检查 Python 文件
        py_path = self.project_root / 'dashboard' / 'config.py'
        if py_path.exists():
            print("\n🐍 检查 Python 代码...")
            with open(py_path, 'r', encoding='utf-8') as f:
                py_content = f.read()
            self.check_python_code(py_content)
        
        # 生成报告
        self.generate_report()
    
    def generate_report(self):
        """生成质量检查报告"""
        report = {
            "meta": {
                "project": "Rainhoole Dashboard",
                "checkTime": str(Path(__file__).stat().st_mtime),
                "checkType": "Code Quality Audit"
            },
            "summary": {
                "passed": len(self.passed),
                "warnings": len(self.warnings),
                "issues": len(self.issues),
                "total": len(self.passed) + len(self.warnings) + len(self.issues)
            },
            "details": {
                "passed": self.passed,
                "warnings": self.warnings,
                "issues": self.issues
            },
            "recommendations": []
        }
        
        # 添加建议
        if self.issues:
            report["recommendations"].append({
                "priority": "HIGH",
                "category": "Issues",
                "message": f"发现 {len(self.issues)} 个问题需要立即修复"
            })
        
        if self.warnings:
            report["recommendations"].append({
                "priority": "MEDIUM",
                "category": "Warnings",
                "message": f"发现 {len(self.warnings)} 个警告，建议优化"
            })
        
        # 保存报告
        report_path = self.project_root / 'quality-report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 打印摘要
        print("\n" + "="*50)
        print("  📊 代码质量检查报告")
        print("="*50)
        print(f"  ✅ 通过: {len(self.passed)}")
        print(f"  ⚠️  警告: {len(self.warnings)}")
        print(f"  ❌ 问题: {len(self.issues)}")
        print(f"  📄 报告: {report_path}")
        print("="*50 + "\n")
        
        return report


if __name__ == '__main__':
    checker = QualityChecker('/tmp/rainhoole-dashboard')
    checker.run_checks()
