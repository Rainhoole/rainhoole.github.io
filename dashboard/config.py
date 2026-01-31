#!/usr/bin/env python3
"""
clawVERSE Dashboard 核心配置和架构

这是 clawVERSE 中央控制面板的主入口文件
包含所有组件的配置、路由和数据结构定义
"""

import json
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

# 数据目录
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

# 核心配置
CONFIG = {
    "version": "2.0.0",
    "name": "clawVERSE Control Panel",
    "theme": "parliamentary",  # 议会风格
    "language": "zh-CN",
    
    # 数据库配置 (Bolt/JSON)
    "database": {
        "type": "json",
        "path": str(DATA_DIR),
        "tables": [
            "agents",
            "agent_metrics", 
            "proposals",
            "discussions",
            "votes",
            "activity_logs",
            "user_settings"
        ]
    },
    
    # 路由配置
    "routes": [
        {"path": "/", "name": "dashboard", "icon": "layout-dashboard"},
        {"path": "/agents", "name": "agents", "icon": "users"},
        {"path": "/agents/:id", "name": "agent-detail", "icon": "user"},
        {"path": "/discussions", "name": "discussions", "icon": "message-square"},
        {"path": "/discussions/:id", "name": "proposal-detail", "icon": "file-text"},
        {"path": "/logs", "name": "logs", "icon": "activity"},
        {"path": "/settings", "name": "settings", "icon": "settings"}
    ],
    
    # Agent 定义
    "agents": {
        "大管家": {
            "type": "coordinator",
            "role": "统筹调度",
            "color": "gold",
            "status": "online"
        },
        "社交Agent": {
            "type": "social",
            "role": "Moltbook/Twitter",
            "color": "emerald", 
            "status": "online"
        },
        "研究Agent": {
            "type": "research",
            "role": "博客雷达/新闻",
            "color": "blue",
            "status": "busy"
        },
        "开发Agent": {
            "type": "dev",
            "role": "自动化脚本",
            "color": "purple",
            "status": "offline"
        },
        "数据Agent": {
            "type": "data",
            "role": "记忆管理/KPI",
            "color": "orange",
            "status": "offline"
        }
    },
    
    # 提案状态
    "proposal_status": {
        "draft": {"label": "草稿", "color": "gray"},
        "discussing": {"label": "讨论中", "color": "blue"},
        "voting": {"label": "投票中", "color": "amber"},
        "passed": {"label": "已通过", "color": "emerald"},
        "rejected": {"label": "已否决", "color": "red"},
        "implemented": {"label": "已实施", "color": "purple"}
    },
    
    # Agent 状态
    "agent_status": {
        "online": {"label": "在线", "color": "emerald"},
        "busy": {"label": "忙碌", "color": "amber"},
        "offline": {"label": "离线", "color": "gray"},
        "error": {"label": "错误", "color": "red"}
    }
}

# 初始化数据文件
def init_database():
    """初始化数据库表"""
    for table in CONFIG["database"]["tables"]:
        table_path = DATA_DIR / f"{table}.json"
        if not table_path.exists():
            if table == "agents":
                data = {"agents": list(CONFIG["agents"].keys())}
            elif table == "proposals":
                data = {"proposals": []}
            elif table == "votes":
                data = {"votes": []}
            elif table == "activity_logs":
                data = {"logs": []}
            elif table == "user_settings":
                data = {"settings": {"theme": "light", "notifications": True, "refresh_interval": 30}}
            else:
                data = {"data": []}
            table_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            print(f"✅ Created {table}.json")

if __name__ == "__main__":
    print("🦊 clawVERSE Dashboard Configuration")
    print(f"Version: {CONFIG['version']}")
    print(f"Theme: {CONFIG['theme']}")
    print(f"Routes: {len(CONFIG['routes'])}")
    print(f"Agents: {len(CONFIG['agents'])}")
    print()
    init_database()
    print("\n✨ Initialization complete!")
