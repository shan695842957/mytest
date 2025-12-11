#!/usr/bin/env python3
"""
PCS Focused Designs - Only PCS Key Variables
Focus on PCS itself without other devices (Grid, BMS, etc.)

Key Variables (by priority):
1. Active Power (有功功率)
2. Accumulated Charge/Discharge Energy (累计充放电量)
3. Real-time Faults (实时故障)
4. Three-phase Voltage/Current (三相电压电流)
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Wedge, Arc
import numpy as np
import os

OUTPUT_DIR = '/workspace/designs/pcs_v3'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Color schemes
COLORS = {
    'dark_bg': '#0D1117',
    'card_bg': '#161B22',
    'border': '#30363D',
    'text': '#C9D1D9',
    'text_dim': '#8B949E',
    'accent_blue': '#58A6FF',
    'accent_green': '#3FB950',
    'accent_yellow': '#D29922',
    'accent_red': '#F85149',
    'accent_purple': '#A371F7',
    'accent_cyan': '#39C5CF',
    'accent_orange': '#F0883E',
}


# ============================================================================
# DESIGN 1: PCS Power Focus - 大功率数字展示
# ============================================================================
def create_pcs_power_focus():
    """PCS design focusing on Active Power as the hero metric"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    ax.set_facecolor(COLORS['dark_bg'])
    
    # Header
    ax.text(8, 9.5, 'PCS POWER MONITOR', ha='center', fontsize=24, 
            fontweight='bold', color='white')
    ax.text(8, 9.1, 'Power Conversion System - Real-time Status', ha='center',
            fontsize=11, color=COLORS['text_dim'])
    
    # ========== 主要功率显示区 (中央大数字) ==========
    power_bg = FancyBboxPatch((3, 5.5), 10, 3, boxstyle="round,pad=0.1",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=2)
    ax.add_patch(power_bg)
    
    # 功率值 - 超大字体
    ax.text(8, 7.5, '125.8', ha='center', va='center', fontsize=72, 
            fontweight='bold', color=COLORS['accent_green'])
    ax.text(8, 6.3, 'kW', ha='center', fontsize=24, color=COLORS['text_dim'])
    
    # 功率标签
    ax.text(8, 8.3, 'ACTIVE POWER', ha='center', fontsize=14, 
            fontweight='bold', color=COLORS['accent_green'])
    
    # 功率方向指示
    direction_bg = FancyBboxPatch((6.5, 5.65), 3, 0.5, boxstyle="round,pad=0.05",
                                   facecolor=COLORS['accent_cyan'], alpha=0.2,
                                   edgecolor=COLORS['accent_cyan'], linewidth=2)
    ax.add_patch(direction_bg)
    ax.text(8, 5.9, '▶ CHARGING', ha='center', va='center', fontsize=12,
            fontweight='bold', color=COLORS['accent_cyan'])
    
    # ========== 功率表盘 (左右两侧) ==========
    # 左侧 - AC功率
    ac_gauge_x, ac_gauge_y = 1.8, 7.0
    gauge_r = 1.2
    
    # 表盘背景
    theta_bg = np.linspace(0.75*np.pi, 0.25*np.pi, 100)
    ax.plot(ac_gauge_x + gauge_r*np.cos(theta_bg), ac_gauge_y + gauge_r*np.sin(theta_bg),
            color=COLORS['border'], linewidth=12, solid_capstyle='round')
    
    # 表盘填充 (80%)
    theta_fill = np.linspace(0.75*np.pi, 0.35*np.pi, 80)
    ax.plot(ac_gauge_x + gauge_r*np.cos(theta_fill), ac_gauge_y + gauge_r*np.sin(theta_fill),
            color=COLORS['accent_blue'], linewidth=12, solid_capstyle='round')
    
    ax.text(ac_gauge_x, ac_gauge_y - 0.1, '125.8', ha='center', fontsize=18, 
            fontweight='bold', color=COLORS['accent_blue'])
    ax.text(ac_gauge_x, ac_gauge_y - 0.5, 'kW', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(ac_gauge_x, ac_gauge_y + 1.6, 'AC POWER', ha='center', fontsize=11, 
            fontweight='bold', color=COLORS['accent_blue'])
    
    # 右侧 - DC功率
    dc_gauge_x, dc_gauge_y = 14.2, 7.0
    
    ax.plot(dc_gauge_x + gauge_r*np.cos(theta_bg), dc_gauge_y + gauge_r*np.sin(theta_bg),
            color=COLORS['border'], linewidth=12, solid_capstyle='round')
    
    theta_fill_dc = np.linspace(0.75*np.pi, 0.36*np.pi, 78)
    ax.plot(dc_gauge_x + gauge_r*np.cos(theta_fill_dc), dc_gauge_y + gauge_r*np.sin(theta_fill_dc),
            color=COLORS['accent_green'], linewidth=12, solid_capstyle='round')
    
    ax.text(dc_gauge_x, dc_gauge_y - 0.1, '124.5', ha='center', fontsize=18,
            fontweight='bold', color=COLORS['accent_green'])
    ax.text(dc_gauge_x, dc_gauge_y - 0.5, 'kW', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(dc_gauge_x, dc_gauge_y + 1.6, 'DC POWER', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['accent_green'])
    
    # ========== 底部关键指标卡片 ==========
    metrics = [
        ('EFFICIENCY', '98.9%', COLORS['accent_green']),
        ('REACTIVE POWER', '12.5 kVar', COLORS['accent_purple']),
        ('POWER FACTOR', '0.995', COLORS['accent_cyan']),
        ('FREQUENCY', '50.02 Hz', COLORS['accent_yellow']),
    ]
    
    card_width = 3.5
    start_x = 0.5
    for i, (label, value, color) in enumerate(metrics):
        x = start_x + i * (card_width + 0.4)
        
        card = FancyBboxPatch((x, 2.8), card_width, 2.2, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
        ax.add_patch(card)
        
        # 顶部颜色条
        accent = Rectangle((x, 4.85), card_width, 0.15, facecolor=color)
        ax.add_patch(accent)
        
        ax.text(x + card_width/2, 4.4, label, ha='center', fontsize=9, 
                color=COLORS['text_dim'], fontweight='bold')
        ax.text(x + card_width/2, 3.5, value, ha='center', fontsize=20,
                fontweight='bold', color=color)
    
    # ========== 累计电量显示 (底部) ==========
    energy_bg = FancyBboxPatch((0.5, 0.3), 15, 2.2, boxstyle="round,pad=0.05",
                                facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(energy_bg)
    
    ax.text(8, 2.3, 'ACCUMULATED ENERGY', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    energy_items = [
        ('Today Charge', '1,245.6 kWh', COLORS['accent_cyan'], 2),
        ('Today Discharge', '1,189.2 kWh', COLORS['accent_orange'], 5.5),
        ('Total Charge', '2.45 MWh', COLORS['accent_blue'], 9),
        ('Total Discharge', '2.31 MWh', COLORS['accent_purple'], 12.5),
    ]
    
    for label, value, color, x in energy_items:
        ax.text(x, 1.7, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x, 1.1, value, ha='center', fontsize=14, fontweight='bold', color=color)
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 2: PCS Energy Statistics - 累计充放电量为核心
# ============================================================================
def create_pcs_energy_stats():
    """PCS design focusing on accumulated charge/discharge energy"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    ax.set_facecolor(COLORS['dark_bg'])
    
    # Header
    ax.text(8, 9.5, 'PCS ENERGY STATISTICS', ha='center', fontsize=24,
            fontweight='bold', color='white')
    ax.text(8, 9.1, 'Charge & Discharge Energy Tracking', ha='center',
            fontsize=11, color=COLORS['text_dim'])
    
    # ========== 今日充放电量 (主要展示) ==========
    # 充电量卡片 (左)
    charge_bg = FancyBboxPatch((0.5, 5.5), 7, 3.2, boxstyle="round,pad=0.05",
                                facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_cyan'], linewidth=3)
    ax.add_patch(charge_bg)
    
    ax.text(4, 8.4, 'TODAY CHARGE', ha='center', fontsize=14,
            fontweight='bold', color=COLORS['accent_cyan'])
    ax.text(4, 7.0, '1,245.6', ha='center', fontsize=48, fontweight='bold',
            color=COLORS['accent_cyan'])
    ax.text(4, 6.2, 'kWh', ha='center', fontsize=18, color=COLORS['text_dim'])
    
    # 充电进度条
    bar_bg = FancyBboxPatch((1, 5.7), 6, 0.4, boxstyle="round,pad=0.02",
                             facecolor=COLORS['border'])
    ax.add_patch(bar_bg)
    bar_fill = FancyBboxPatch((1, 5.7), 6*0.75, 0.4, boxstyle="round,pad=0.02",
                               facecolor=COLORS['accent_cyan'])
    ax.add_patch(bar_fill)
    ax.text(7.2, 5.9, '75%', ha='left', va='center', fontsize=10, color=COLORS['accent_cyan'])
    
    # 放电量卡片 (右)
    discharge_bg = FancyBboxPatch((8.5, 5.5), 7, 3.2, boxstyle="round,pad=0.05",
                                   facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_orange'], linewidth=3)
    ax.add_patch(discharge_bg)
    
    ax.text(12, 8.4, 'TODAY DISCHARGE', ha='center', fontsize=14,
            fontweight='bold', color=COLORS['accent_orange'])
    ax.text(12, 7.0, '1,189.2', ha='center', fontsize=48, fontweight='bold',
            color=COLORS['accent_orange'])
    ax.text(12, 6.2, 'kWh', ha='center', fontsize=18, color=COLORS['text_dim'])
    
    # 放电进度条
    bar_bg2 = FancyBboxPatch((9, 5.7), 6, 0.4, boxstyle="round,pad=0.02",
                              facecolor=COLORS['border'])
    ax.add_patch(bar_bg2)
    bar_fill2 = FancyBboxPatch((9, 5.7), 6*0.72, 0.4, boxstyle="round,pad=0.02",
                                facecolor=COLORS['accent_orange'])
    ax.add_patch(bar_fill2)
    ax.text(15.2, 5.9, '72%', ha='left', va='center', fontsize=10, color=COLORS['accent_orange'])
    
    # ========== 累计总量 ==========
    total_bg = FancyBboxPatch((0.5, 3), 15, 2.2, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(total_bg)
    
    ax.text(8, 5.0, 'LIFETIME STATISTICS', ha='center', fontsize=12,
            fontweight='bold', color=COLORS['text_dim'])
    
    totals = [
        ('Total Charge', '2.45', 'MWh', COLORS['accent_cyan']),
        ('Total Discharge', '2.31', 'MWh', COLORS['accent_orange']),
        ('Net Energy', '+140', 'kWh', COLORS['accent_green']),
        ('Cycles', '1,847', '', COLORS['accent_purple']),
    ]
    
    for i, (label, value, unit, color) in enumerate(totals):
        x = 2 + i * 3.5
        ax.text(x, 4.4, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x, 3.7, value, ha='center', fontsize=22, fontweight='bold', color=color)
        if unit:
            ax.text(x, 3.2, unit, ha='center', fontsize=10, color=COLORS['text_dim'])
    
    # ========== 实时功率 (小卡片) ==========
    power_bg = FancyBboxPatch((0.5, 0.3), 7.2, 2.4, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(power_bg)
    
    ax.text(4.1, 2.5, 'REAL-TIME POWER', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    # 当前功率
    ax.text(2.2, 1.5, 'Active', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(2.2, 0.9, '125.8 kW', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_green'])
    
    ax.text(4.1, 1.5, 'Reactive', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(4.1, 0.9, '12.5 kVar', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_purple'])
    
    ax.text(6, 1.5, 'Apparent', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(6, 0.9, '126.4 kVA', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_blue'])
    
    # ========== 运行时间统计 ==========
    time_bg = FancyBboxPatch((8.3, 0.3), 7.2, 2.4, boxstyle="round,pad=0.05",
                              facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(time_bg)
    
    ax.text(11.9, 2.5, 'OPERATION TIME', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    ax.text(9.8, 1.5, 'Today', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(9.8, 0.9, '18.5 h', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_yellow'])
    
    ax.text(11.9, 1.5, 'This Month', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(11.9, 0.9, '456 h', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_cyan'])
    
    ax.text(14, 1.5, 'Total', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(14, 0.9, '12,456 h', ha='center', fontsize=14, fontweight='bold',
            color=COLORS['accent_green'])
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 3: PCS Fault Monitor - 实时故障监控
# ============================================================================
def create_pcs_fault_monitor():
    """PCS design focusing on real-time fault monitoring"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    ax.set_facecolor(COLORS['dark_bg'])
    
    # Header
    ax.text(8, 9.5, 'PCS FAULT MONITOR', ha='center', fontsize=24,
            fontweight='bold', color='white')
    ax.text(8, 9.1, 'Real-time Fault & Alarm Status', ha='center',
            fontsize=11, color=COLORS['text_dim'])
    
    # ========== 故障状态总览 (顶部大卡片) ==========
    status_bg = FancyBboxPatch((0.5, 6.5), 15, 2.3, boxstyle="round,pad=0.05",
                                facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_green'], linewidth=3)
    ax.add_patch(status_bg)
    
    # 大状态指示灯
    status_circle = Circle((2.5, 7.65), 0.6, facecolor=COLORS['accent_green'], alpha=0.3,
                            edgecolor=COLORS['accent_green'], linewidth=4)
    ax.add_patch(status_circle)
    inner_circle = Circle((2.5, 7.65), 0.35, facecolor=COLORS['accent_green'])
    ax.add_patch(inner_circle)
    
    ax.text(5.5, 8.2, 'SYSTEM STATUS', ha='left', fontsize=12, color=COLORS['text_dim'])
    ax.text(5.5, 7.4, 'NORMAL - NO ACTIVE FAULTS', ha='left', fontsize=20,
            fontweight='bold', color=COLORS['accent_green'])
    ax.text(5.5, 6.8, 'Last fault cleared: 2025-04-22 08:15:33', ha='left',
            fontsize=10, color=COLORS['text_dim'])
    
    # 故障计数器
    counters = [
        ('Active Faults', '0', COLORS['accent_green']),
        ('Warnings', '2', COLORS['accent_yellow']),
        ('Today Events', '5', COLORS['accent_blue']),
    ]
    for i, (label, count, color) in enumerate(counters):
        x = 11.5 + i * 1.5
        ax.text(x, 8.2, label, ha='center', fontsize=8, color=COLORS['text_dim'])
        ax.text(x, 7.3, count, ha='center', fontsize=24, fontweight='bold', color=color)
    
    # ========== 故障类型监控 ==========
    fault_types = [
        ('OVER VOLTAGE', 'OV', 'Normal', COLORS['accent_green'], 0.5),
        ('UNDER VOLTAGE', 'UV', 'Normal', COLORS['accent_green'], 4.3),
        ('OVER CURRENT', 'OC', 'Normal', COLORS['accent_green'], 8.1),
        ('OVER TEMP', 'OT', 'Warning', COLORS['accent_yellow'], 11.9),
    ]
    
    for label, code, status, color, x in fault_types:
        card = FancyBboxPatch((x, 4), 3.5, 2.2, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
        ax.add_patch(card)
        
        # 状态指示灯
        indicator = Circle((x + 0.4, 5.7), 0.2, facecolor=color, alpha=0.8)
        ax.add_patch(indicator)
        
        ax.text(x + 0.9, 5.7, code, ha='left', va='center', fontsize=12,
                fontweight='bold', color=color)
        ax.text(x + 1.75, 5.0, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x + 1.75, 4.4, status, ha='center', fontsize=12, fontweight='bold', color=color)
    
    # ========== 保护阈值显示 ==========
    threshold_bg = FancyBboxPatch((0.5, 1.5), 7.2, 2.2, boxstyle="round,pad=0.05",
                                   facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(threshold_bg)
    
    ax.text(4.1, 3.5, 'PROTECTION THRESHOLDS', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    thresholds = [
        ('OV Trip', '880 V', '750.2 V'),
        ('UV Trip', '580 V', '750.2 V'),
        ('OC Trip', '250 A', '167.4 A'),
        ('OT Trip', '85 °C', '45.2 °C'),
    ]
    
    for i, (label, trip, current) in enumerate(thresholds):
        x = 1.0 + i * 1.7
        ax.text(x, 2.9, label, ha='left', fontsize=8, color=COLORS['text_dim'])
        ax.text(x, 2.5, trip, ha='left', fontsize=9, color=COLORS['accent_red'])
        ax.text(x, 2.1, current, ha='left', fontsize=9, fontweight='bold', color=COLORS['accent_green'])
    
    # ========== 实时故障日志 ==========
    log_bg = FancyBboxPatch((8.3, 1.5), 7.2, 2.2, boxstyle="round,pad=0.05",
                             facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(log_bg)
    
    ax.text(11.9, 3.5, 'RECENT EVENTS', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    # 日志条目
    logs = [
        ('15:24:39', 'INFO', 'Mode changed to CHARGING'),
        ('08:15:33', 'CLEAR', 'OT warning cleared'),
        ('08:12:11', 'WARN', 'Temperature high (82°C)'),
    ]
    
    for i, (time, level, msg) in enumerate(logs):
        y = 3.0 - i * 0.45
        level_color = COLORS['accent_green'] if level in ['INFO', 'CLEAR'] else COLORS['accent_yellow']
        ax.text(8.5, y, time, ha='left', fontsize=8, color=COLORS['text_dim'], family='monospace')
        ax.text(10.0, y, level, ha='left', fontsize=8, fontweight='bold', color=level_color)
        ax.text(11.0, y, msg, ha='left', fontsize=8, color=COLORS['text'])
    
    # ========== 当前功率显示 (底部小卡片) ==========
    power_bg = FancyBboxPatch((0.5, 0.2), 15, 1.1, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(power_bg)
    
    power_items = [
        ('Active Power', '125.8 kW', COLORS['accent_green']),
        ('DC Voltage', '750.2 V', COLORS['accent_cyan']),
        ('DC Current', '167.4 A', COLORS['accent_blue']),
        ('Temperature', '45.2 °C', COLORS['accent_yellow']),
        ('Efficiency', '98.9 %', COLORS['accent_purple']),
    ]
    
    for i, (label, value, color) in enumerate(power_items):
        x = 1.5 + i * 3
        ax.text(x, 1.0, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x, 0.55, value, ha='center', fontsize=12, fontweight='bold', color=color)
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 4: PCS Three Phase Monitor - 三相电压电流详细展示
# ============================================================================
def create_pcs_three_phase():
    """PCS design focusing on three-phase voltage and current"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    ax.set_facecolor(COLORS['dark_bg'])
    
    # Header
    ax.text(8, 9.5, 'PCS THREE PHASE MONITOR', ha='center', fontsize=24,
            fontweight='bold', color='white')
    ax.text(8, 9.1, 'AC Side Voltage & Current Details', ha='center',
            fontsize=11, color=COLORS['text_dim'])
    
    # 相位颜色
    phase_colors = {
        'A': '#FFD93D',  # 黄色
        'B': '#6BCB77',  # 绿色
        'C': '#FF6B6B',  # 红色
    }
    
    # ========== 三相电压大卡片 ==========
    voltage_bg = FancyBboxPatch((0.5, 5.5), 15, 3.2, boxstyle="round,pad=0.05",
                                 facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=2)
    ax.add_patch(voltage_bg)
    
    ax.text(8, 8.5, 'THREE PHASE VOLTAGE', ha='center', fontsize=14,
            fontweight='bold', color=COLORS['text_dim'])
    
    # 三相电压显示
    phases_v = [
        ('A', '220.1', 'Va'),
        ('B', '220.3', 'Vb'),
        ('C', '219.8', 'Vc'),
    ]
    
    for i, (phase, voltage, label) in enumerate(phases_v):
        x = 2.5 + i * 5
        color = phase_colors[phase]
        
        # 相位圆圈
        phase_circle = Circle((x, 7.5), 0.5, facecolor=color, alpha=0.2,
                               edgecolor=color, linewidth=3)
        ax.add_patch(phase_circle)
        ax.text(x, 7.5, phase, ha='center', va='center', fontsize=18,
                fontweight='bold', color=color)
        
        # 电压值
        ax.text(x, 6.6, voltage, ha='center', fontsize=32, fontweight='bold', color=color)
        ax.text(x, 6.0, 'V (rms)', ha='center', fontsize=12, color=COLORS['text_dim'])
    
    # 线电压
    ax.text(14.5, 7.8, 'Line Voltage', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(14.5, 7.3, 'Vab: 380.5 V', ha='center', fontsize=10, color=phase_colors['A'])
    ax.text(14.5, 6.9, 'Vbc: 381.2 V', ha='center', fontsize=10, color=phase_colors['B'])
    ax.text(14.5, 6.5, 'Vca: 380.8 V', ha='center', fontsize=10, color=phase_colors['C'])
    
    # ========== 三相电流大卡片 ==========
    current_bg = FancyBboxPatch((0.5, 2), 15, 3.2, boxstyle="round,pad=0.05",
                                 facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=2)
    ax.add_patch(current_bg)
    
    ax.text(8, 5.0, 'THREE PHASE CURRENT', ha='center', fontsize=14,
            fontweight='bold', color=COLORS['text_dim'])
    
    # 三相电流显示
    phases_i = [
        ('A', '186.2', 'Ia'),
        ('B', '185.7', 'Ib'),
        ('C', '186.0', 'Ic'),
    ]
    
    for i, (phase, current, label) in enumerate(phases_i):
        x = 2.5 + i * 5
        color = phase_colors[phase]
        
        # 相位圆圈
        phase_circle = Circle((x, 4.0), 0.5, facecolor=color, alpha=0.2,
                               edgecolor=color, linewidth=3)
        ax.add_patch(phase_circle)
        ax.text(x, 4.0, phase, ha='center', va='center', fontsize=18,
                fontweight='bold', color=color)
        
        # 电流值
        ax.text(x, 3.1, current, ha='center', fontsize=32, fontweight='bold', color=color)
        ax.text(x, 2.5, 'A (rms)', ha='center', fontsize=12, color=COLORS['text_dim'])
    
    # 电流不平衡度
    ax.text(14.5, 4.3, 'Unbalance', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(14.5, 3.8, '0.27%', ha='center', fontsize=14, fontweight='bold', color=COLORS['accent_green'])
    ax.text(14.5, 3.3, '< 2% OK', ha='center', fontsize=9, color=COLORS['accent_green'])
    
    # ========== 底部综合指标 ==========
    bottom_bg = FancyBboxPatch((0.5, 0.2), 15, 1.5, boxstyle="round,pad=0.05",
                                facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(bottom_bg)
    
    bottom_metrics = [
        ('Active Power', '125.8 kW', COLORS['accent_green']),
        ('Reactive Power', '12.5 kVar', COLORS['accent_purple']),
        ('Apparent Power', '126.4 kVA', COLORS['accent_blue']),
        ('Power Factor', '0.995', COLORS['accent_cyan']),
        ('Frequency', '50.02 Hz', COLORS['accent_yellow']),
    ]
    
    for i, (label, value, color) in enumerate(bottom_metrics):
        x = 1.5 + i * 3
        ax.text(x, 1.4, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x, 0.8, value, ha='center', fontsize=14, fontweight='bold', color=color)
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 5: PCS Compact Overview - 紧凑型综合视图
# ============================================================================
def create_pcs_compact_overview():
    """Compact PCS overview with all key metrics prioritized"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    ax.set_facecolor(COLORS['dark_bg'])
    
    # Header
    ax.text(8, 9.5, 'PCS OVERVIEW', ha='center', fontsize=24,
            fontweight='bold', color='white')
    
    # ========== #1 有功功率 (最大最醒目) ==========
    power_bg = FancyBboxPatch((0.5, 6.2), 6, 3), 
    power_bg = FancyBboxPatch((0.5, 6.2), 6, 2.8, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_green'], linewidth=3)
    ax.add_patch(power_bg)
    
    ax.text(3.5, 8.8, '① ACTIVE POWER', ha='center', fontsize=12,
            fontweight='bold', color=COLORS['accent_green'])
    ax.text(3.5, 7.6, '125.8', ha='center', fontsize=42, fontweight='bold',
            color=COLORS['accent_green'])
    ax.text(3.5, 6.8, 'kW', ha='center', fontsize=16, color=COLORS['text_dim'])
    
    # 功率方向
    direction = FancyBboxPatch((1.5, 6.35), 4, 0.4, boxstyle="round,pad=0.02",
                                facecolor=COLORS['accent_cyan'], alpha=0.3,
                                edgecolor=COLORS['accent_cyan'], linewidth=1)
    ax.add_patch(direction)
    ax.text(3.5, 6.55, '▶ CHARGING', ha='center', va='center', fontsize=10,
            fontweight='bold', color=COLORS['accent_cyan'])
    
    # ========== #2 累计充放电量 ==========
    energy_bg = FancyBboxPatch((7, 6.2), 8.5, 2.8, boxstyle="round,pad=0.05",
                                facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_orange'], linewidth=3)
    ax.add_patch(energy_bg)
    
    ax.text(11.25, 8.8, '② ACCUMULATED ENERGY', ha='center', fontsize=12,
            fontweight='bold', color=COLORS['accent_orange'])
    
    # 充电
    ax.text(9, 7.8, 'Charge', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(9, 7.1, '1,245.6', ha='center', fontsize=24, fontweight='bold',
            color=COLORS['accent_cyan'])
    ax.text(9, 6.6, 'kWh', ha='center', fontsize=11, color=COLORS['text_dim'])
    
    # 放电
    ax.text(13.5, 7.8, 'Discharge', ha='center', fontsize=10, color=COLORS['text_dim'])
    ax.text(13.5, 7.1, '1,189.2', ha='center', fontsize=24, fontweight='bold',
            color=COLORS['accent_orange'])
    ax.text(13.5, 6.6, 'kWh', ha='center', fontsize=11, color=COLORS['text_dim'])
    
    # ========== #3 实时故障 ==========
    fault_bg = FancyBboxPatch((0.5, 3.3), 6, 2.6, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_green'], linewidth=3)
    ax.add_patch(fault_bg)
    
    ax.text(3.5, 5.7, '③ FAULT STATUS', ha='center', fontsize=12,
            fontweight='bold', color=COLORS['accent_green'])
    
    # 状态指示灯
    status_light = Circle((2, 4.5), 0.35, facecolor=COLORS['accent_green'], alpha=0.8)
    ax.add_patch(status_light)
    
    ax.text(4, 4.7, 'NO FAULT', ha='center', fontsize=16, fontweight='bold',
            color=COLORS['accent_green'])
    ax.text(4, 4.1, 'System Normal', ha='center', fontsize=10, color=COLORS['text_dim'])
    
    # 故障计数
    ax.text(2, 3.6, 'Active: 0', ha='center', fontsize=9, color=COLORS['accent_green'])
    ax.text(5, 3.6, 'Warnings: 2', ha='center', fontsize=9, color=COLORS['accent_yellow'])
    
    # ========== #4 三相电压电流 ==========
    three_phase_bg = FancyBboxPatch((7, 3.3), 8.5, 2.6, boxstyle="round,pad=0.05",
                                     facecolor=COLORS['card_bg'], edgecolor=COLORS['accent_blue'], linewidth=3)
    ax.add_patch(three_phase_bg)
    
    ax.text(11.25, 5.7, '④ THREE PHASE V/I', ha='center', fontsize=12,
            fontweight='bold', color=COLORS['accent_blue'])
    
    # 相位数据
    phases = [
        ('A', '220.1V', '186.2A', '#FFD93D'),
        ('B', '220.3V', '185.7A', '#6BCB77'),
        ('C', '219.8V', '186.0A', '#FF6B6B'),
    ]
    
    for i, (phase, v, a, color) in enumerate(phases):
        x = 8.2 + i * 2.5
        
        # 相位标识
        phase_circle = Circle((x, 4.9), 0.25, facecolor=color, alpha=0.3,
                               edgecolor=color, linewidth=2)
        ax.add_patch(phase_circle)
        ax.text(x, 4.9, phase, ha='center', va='center', fontsize=10,
                fontweight='bold', color=color)
        
        ax.text(x, 4.3, v, ha='center', fontsize=12, fontweight='bold', color=color)
        ax.text(x, 3.8, a, ha='center', fontsize=12, color=COLORS['text'])
    
    # 频率
    ax.text(14.8, 4.9, 'Freq', ha='center', fontsize=9, color=COLORS['text_dim'])
    ax.text(14.8, 4.3, '50.02', ha='center', fontsize=12, fontweight='bold',
            color=COLORS['accent_yellow'])
    ax.text(14.8, 3.8, 'Hz', ha='center', fontsize=9, color=COLORS['text_dim'])
    
    # ========== 底部其他指标 ==========
    other_bg = FancyBboxPatch((0.5, 0.3), 15, 2.7, boxstyle="round,pad=0.05",
                               facecolor=COLORS['card_bg'], edgecolor=COLORS['border'], linewidth=1)
    ax.add_patch(other_bg)
    
    ax.text(8, 2.8, 'OTHER METRICS', ha='center', fontsize=11,
            fontweight='bold', color=COLORS['text_dim'])
    
    other_metrics = [
        ('DC Voltage', '750.2 V', COLORS['accent_cyan']),
        ('DC Current', '167.4 A', COLORS['accent_blue']),
        ('Efficiency', '98.9 %', COLORS['accent_green']),
        ('Power Factor', '0.995', COLORS['accent_purple']),
        ('Temperature', '45.2 °C', COLORS['accent_yellow']),
        ('Reactive', '12.5 kVar', COLORS['accent_orange']),
    ]
    
    for i, (label, value, color) in enumerate(other_metrics):
        x = 1.3 + i * 2.5
        ax.text(x, 2.2, label, ha='center', fontsize=9, color=COLORS['text_dim'])
        ax.text(x, 1.5, value, ha='center', fontsize=13, fontweight='bold', color=color)
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# Main execution
# ============================================================================
def main():
    """Generate all PCS-focused designs"""
    designs = [
        ('pcs_power_focus', create_pcs_power_focus, 'Power Focus (Active Power Hero)'),
        ('pcs_energy_stats', create_pcs_energy_stats, 'Energy Statistics'),
        ('pcs_fault_monitor', create_pcs_fault_monitor, 'Fault Monitor'),
        ('pcs_three_phase', create_pcs_three_phase, 'Three Phase V/I'),
        ('pcs_compact_overview', create_pcs_compact_overview, 'Compact Overview (Prioritized)'),
    ]
    
    for filename, create_func, desc in designs:
        print(f'Creating {desc}...')
        fig = create_func()
        
        # Save as PNG
        png_path = f'{OUTPUT_DIR}/{filename}.png'
        fig.savefig(png_path, dpi=150, bbox_inches='tight',
                    facecolor=fig.get_facecolor(), edgecolor='none')
        print(f'  Saved: {png_path}')
        
        # Save as SVG
        svg_path = f'{OUTPUT_DIR}/{filename}.svg'
        fig.savefig(svg_path, format='svg', bbox_inches='tight',
                    facecolor=fig.get_facecolor(), edgecolor='none')
        print(f'  Saved: {svg_path}')
        
        plt.close(fig)
    
    print(f'\n✅ All {len(designs)} PCS-focused designs generated!')
    print(f'📁 Output directory: {OUTPUT_DIR}')


if __name__ == '__main__':
    main()
