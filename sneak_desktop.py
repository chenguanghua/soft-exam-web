#!/usr/bin/env python3
"""
软考速记卡片 - 桌面摸鱼版
基于 tkinter，无需额外依赖
"""
import json
import random
import os
import tkinter as tk
from tkinter import ttk, messagebox


class SneakApp:
    def __init__(self, root):
        self.root = root
        self.root.title("备忘录")
        self.root.geometry("420x520")
        self.root.resizable(True, True)
        self.root.configure(bg="#f5f5f0")
        
        # 设置窗口图标（使用默认）
        try:
            self.root.iconbitmap(default='')
        except:
            pass
        
        # 数据
        self.flashcards = []
        self.questions = []
        self.list = []
        self.idx = 0
        self.flipped = False
        self.mode = "cards"  # cards or questions
        
        # 颜色配置
        self.colors = {
            "bg": "#f5f5f0",
            "card_bg": "#fffef8",
            "text": "#2a2a2a",
            "text_muted": "#888888",
            "accent": "#4a6741",
            "border": "#e0e0d8",
            "accent_light": "rgba(74, 103, 65, 0.08)"
        }
        
        self._build_ui()
        self._load_data()
        self._bind_keys()
    
    def _build_ui(self):
        """构建界面"""
        # 主容器
        main_frame = tk.Frame(self.root, bg=self.colors["bg"])
        main_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=12)
        
        # 模式切换
        mode_frame = tk.Frame(main_frame, bg=self.colors["bg"])
        mode_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.mode_var = tk.StringVar(value="cards")
        
        self.btn_cards = tk.Button(
            mode_frame, text="速记卡片", font=("Microsoft YaHei", 10),
            bg=self.colors["accent"], fg="white", relief=tk.FLAT,
            padx=14, pady=5, command=lambda: self._set_mode("cards")
        )
        self.btn_cards.pack(side=tk.LEFT, padx=(80, 8))
        
        self.btn_questions = tk.Button(
            mode_frame, text="刷题目", font=("Microsoft YaHei", 10),
            bg=self.colors["card_bg"], fg=self.colors["text_muted"], relief=tk.FLAT,
            padx=14, pady=5, command=lambda: self._set_mode("questions")
        )
        self.btn_questions.pack(side=tk.LEFT)
        
        # 卡片区域
        self.card_frame = tk.Frame(
            main_frame, bg=self.colors["card_bg"],
            highlightbackground=self.colors["border"], highlightthickness=1,
            relief=tk.FLAT
        )
        self.card_frame.pack(fill=tk.BOTH, expand=True, pady=8)
        self.card_frame.pack_propagate(False)
        self.card_frame.configure(height=340)
        
        # 卡片头部
        header_frame = tk.Frame(self.card_frame, bg=self.colors["card_bg"])
        header_frame.pack(fill=tk.X, padx=16, pady=(14, 8))
        
        self.tag_label = tk.Label(
            header_frame, text="速记", font=("Microsoft YaHei", 9),
            bg=self.colors["accent"], fg="white", padx=8, pady=2
        )
        self.tag_label.pack(side=tk.LEFT)
        
        self.counter_label = tk.Label(
            header_frame, text="1 / 158", font=("Microsoft YaHei", 9),
            bg=self.colors["card_bg"], fg=self.colors["text_muted"]
        )
        self.counter_label.pack(side=tk.RIGHT)
        
        # 分隔线
        separator = tk.Frame(self.card_frame, height=1, bg=self.colors["border"])
        separator.pack(fill=tk.X, padx=16)
        
        # 内容区域（可滚动）
        content_frame = tk.Frame(self.card_frame, bg=self.colors["card_bg"])
        content_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=12)
        
        self.content_text = tk.Text(
            content_frame, font=("Microsoft YaHei", 11),
            bg=self.colors["card_bg"], fg=self.colors["text"],
            wrap=tk.WORD, relief=tk.FLAT, height=10,
            selectbackground=self.colors["accent"],
            selectforeground="white"
        )
        self.content_text.pack(fill=tk.BOTH, expand=True)
        self.content_text.configure(state=tk.DISABLED)
        
        # 提示
        self.hint_label = tk.Label(
            self.card_frame, text="点击卡片或按空格键翻面",
            font=("Microsoft YaHei", 9), bg=self.colors["card_bg"],
            fg=self.colors["text_muted"]
        )
        self.hint_label.pack(pady=(0, 10))
        
        # 进度条
        self.progress_canvas = tk.Canvas(
            main_frame, height=3, bg=self.colors["border"],
            highlightthickness=0
        )
        self.progress_canvas.pack(fill=tk.X, pady=(0, 10))
        self.progress_rect = self.progress_canvas.create_rectangle(
            0, 0, 0, 3, fill=self.colors["accent"], outline=""
        )
        
        # 控制按钮
        ctrl_frame = tk.Frame(main_frame, bg=self.colors["bg"])
        ctrl_frame.pack(fill=tk.X)
        
        btn_style = {
            "font": ("Microsoft YaHei", 12),
            "bg": self.colors["card_bg"],
            "fg": self.colors["text_muted"],
            "relief": tk.FLAT,
            "width": 4,
            "cursor": "hand2"
        }
        
        self.btn_prev = tk.Button(
            ctrl_frame, text="‹", **btn_style, command=self._prev
        )
        self.btn_prev.pack(side=tk.LEFT, padx=(60, 8))
        
        self.btn_shuffle = tk.Button(
            ctrl_frame, text="⟳", **btn_style, command=self._shuffle
        )
        self.btn_shuffle.pack(side=tk.LEFT, padx=8)
        
        self.btn_next = tk.Button(
            ctrl_frame, text="›", **btn_style, command=self._next
        )
        self.btn_next.pack(side=tk.LEFT, padx=8)
        
        # 快捷键提示
        hint_frame = tk.Frame(main_frame, bg=self.colors["bg"])
        hint_frame.pack(fill=tk.X, pady=(10, 0))
        
        hint_text = "← → 切换  |  空格 翻面  |  R 随机"
        tk.Label(
            hint_frame, text=hint_text, font=("Microsoft YaHei", 8),
            bg=self.colors["bg"], fg=self.colors["text_muted"]
        ).pack()
        
        # 绑定卡片点击
        self.card_frame.bind("<Button-1>", lambda e: self._flip())
        self.content_text.bind("<Button-1>", lambda e: self._flip())
        self.hint_label.bind("<Button-1>", lambda e: self._flip())
        header_frame.bind("<Button-1>", lambda e: self._flip())
        separator.bind("<Button-1>", lambda e: self._flip())
    
    def _load_data(self):
        """加载数据"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        try:
            with open(os.path.join(base_dir, "data", "flashcards.json"), "r", encoding="utf-8") as f:
                self.flashcards = json.load(f)
        except Exception as e:
            messagebox.showerror("错误", f"加载速记卡片失败: {e}")
            self.flashcards = []
        
        try:
            with open(os.path.join(base_dir, "data", "questions.json"), "r", encoding="utf-8") as f:
                all_questions = json.load(f)
                self.questions = [q for q in all_questions if q.get("questionType") != "case"]
        except Exception as e:
            messagebox.showerror("错误", f"加载题目失败: {e}")
            self.questions = []
        
        self.list = self.flashcards
        self._render()
    
    def _bind_keys(self):
        """绑定快捷键"""
        self.root.bind("<Left>", lambda e: self._prev())
        self.root.bind("<Right>", lambda e: self._next())
        self.root.bind("<space>", lambda e: self._flip())
        self.root.bind("<r>", lambda e: self._shuffle())
        self.root.bind("<R>", lambda e: self._shuffle())
        
        # 数字键 1-9 快速跳转
        for i in range(1, 10):
            self.root.bind(str(i), lambda e, idx=i-1: self._jump_to(idx))
    
    def _set_mode(self, mode):
        """切换模式"""
        self.mode = mode
        self.idx = 0
        self.flipped = False
        
        if mode == "cards":
            self.list = self.flashcards
            self.btn_cards.configure(bg=self.colors["accent"], fg="white")
            self.btn_questions.configure(bg=self.colors["card_bg"], fg=self.colors["text_muted"])
        else:
            self.list = self.questions
            self.btn_cards.configure(bg=self.colors["card_bg"], fg=self.colors["text_muted"])
            self.btn_questions.configure(bg=self.colors["accent"], fg="white")
        
        self._render()
    
    def _flip(self):
        """翻面"""
        self.flipped = not self.flipped
        self._render()
    
    def _next(self):
        """下一张"""
        if not self.list:
            return
        self.idx = (self.idx + 1) % len(self.list)
        self.flipped = False
        self._render()
    
    def _prev(self):
        """上一张"""
        if not self.list:
            return
        self.idx = (self.idx - 1 + len(self.list)) % len(self.list)
        self.flipped = False
        self._render()
    
    def _shuffle(self):
        """随机打乱"""
        if not self.list:
            return
        random.shuffle(self.list)
        self.idx = 0
        self.flipped = False
        self._render()
    
    def _jump_to(self, idx):
        """跳转到指定索引"""
        if not self.list or idx >= len(self.list):
            return
        self.idx = idx
        self.flipped = False
        self._render()
    
    def _render(self):
        """渲染当前卡片"""
        if not self.list:
            return
        
        item = self.list[self.idx]
        total = len(self.list)
        
        # 更新标签
        if self.mode == "cards":
            tag = item.get("tag", "速记")
            self.tag_label.configure(text=tag)
            
            if self.flipped:
                content = item.get("answer", "暂无解析")
                self.hint_label.configure(text="点击卡片或按空格键翻回")
            else:
                content = item.get("question", "")
                self.hint_label.configure(text="点击卡片或按空格键翻面")
        else:
            tag = item.get("category", "题目")
            self.tag_label.configure(text=tag)
            
            if self.flipped:
                # 显示答案和解析
                correct_idx = item.get("answerIndex", -1)
                correct = chr(65 + correct_idx) if correct_idx >= 0 else "?"
                explanation = item.get("explanation", "暂无解析")
                content = f"正确答案：{correct}\n\n{explanation}"
                self.hint_label.configure(text="点击卡片或按空格键翻回")
            else:
                # 显示题目和选项
                question = item.get("question", "")
                options = item.get("options", [])
                opts_text = "\n".join(
                    f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)
                )
                content = f"{question}\n\n{opts_text}" if opts_text else question
                self.hint_label.configure(text="点击卡片或按空格键翻面")
        
        # 更新内容
        self.content_text.configure(state=tk.NORMAL)
        self.content_text.delete("1.0", tk.END)
        self.content_text.insert("1.0", content)
        self.content_text.configure(state=tk.DISABLED)
        
        # 更新计数器
        counter_text = f"{self.idx + 1} / {total}"
        self.counter_label.configure(text=counter_text)
        
        # 更新进度条
        progress = (self.idx + 1) / total
        width = self.progress_canvas.winfo_width()
        self.progress_canvas.coords(self.progress_rect, 0, 0, int(width * progress), 3)


def main():
    root = tk.Tk()
    
    # 设置 DPI 感知（Windows）
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass
    
    app = SneakApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
