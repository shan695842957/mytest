#!/usr/bin/env python3
"""
PCS Single Line Diagram - Optimized Version
清晰的电气单线图，避免线条交叉
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, FancyArrowPatch
import numpy as np
import os

OUTPUT_DIR = '/workspace/designs/pcs_v3'


def create_single_line_diagram_v2():
    """Create optimized single line diagram with clear layout"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('#FAFBFC')
    
    # Title block
    title_box = Rectangle((0, 9.2), 16, 0.8, facecolor='#2C3E50', edgecolor='none')
    ax.add_patch(title_box)
    ax.text(0.3, 9.6, 'PCS SINGLE LINE DIAGRAM', ha='left', va='center',
            fontsize=18, fontweight='bold', color='white', family='monospace')
    ax.text(15.7, 9.6, 'Rev: 2.0', ha='right', va='center',
            fontsize=10, color='#95A5A6', family='monospace')
    
    # ========================================
    # 简化的水平布局: GRID → PCS → BATTERY
    # ========================================
    
    # 主线高度
    main_y = 6.0
    
    # ========== GRID 部分 (左侧) ==========
    # 电网符号 - 圆圈内带箭头
    grid_x = 2.0
    grid_circle = Circle((grid_x, main_y), 0.5, facecolor='white', 
                          edgecolor='#3498DB', linewidth=3)
    ax.add_patch(grid_circle)
    # 电网内部符号 (正弦波简化)
    t = np.linspace(-0.3, 0.3, 20)
    sine_y = main_y + 0.2 * np.sin(t * 10)
    ax.plot(grid_x + t, sine_y, color='#3498DB', linewidth=2)
    
    ax.text(grid_x, main_y + 1.0, 'GRID', ha='center', fontsize=12, 
            fontweight='bold', color='#2C3E50')
    ax.text(grid_x, main_y + 0.7, '10kV / 380V', ha='center', fontsize=9, color='#7F8C8D')
    
    # 电网数据卡片
    grid_card = FancyBboxPatch((0.5, 3.5), 3, 2.2, boxstyle="round,pad=0.05",
                                facecolor='#EBF5FB', edgecolor='#3498DB', linewidth=2)
    ax.add_patch(grid_card)
    ax.text(2, 5.5, 'GRID DATA', ha='center', fontsize=10, fontweight='bold', color='#2980B9')
    
    grid_params = [
        ('Voltage (Vab)', '380.5 V'),
        ('Active Power', '125.8 kW'),
        ('Reactive Power', '12.5 kVar'),
        ('Power Factor', '0.995'),
        ('Frequency', '50.02 Hz'),
    ]
    for i, (param, val) in enumerate(grid_params):
        y = 5.1 - i * 0.35
        ax.text(0.7, y, param, ha='left', fontsize=8, color='#34495E')
        ax.text(3.3, y, val, ha='right', fontsize=8, color='#2980B9', fontweight='bold')
    
    # ========== 连接线: GRID → CB1 ==========
    ax.plot([grid_x + 0.5, 4.0], [main_y, main_y], color='black', linewidth=2.5)
    
    # ========== CB1 断路器 ==========
    cb1_x = 4.3
    # 断路器符号 - 方框
    cb1_box = Rectangle((cb1_x - 0.2, main_y - 0.25), 0.4, 0.5, 
                         facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb1_box)
    ax.text(cb1_x, main_y, 'CB', ha='center', va='center', fontsize=7, fontweight='bold')
    ax.text(cb1_x, main_y - 0.55, 'AC CB', ha='center', fontsize=8, color='#7F8C8D')
    
    # ========== 连接线: CB1 → PCS ==========
    ax.plot([cb1_x + 0.2, 5.8], [main_y, main_y], color='black', linewidth=2.5)
    
    # ========== PCS 模块 (中央) ==========
    pcs_x = 7.5
    pcs_box = FancyBboxPatch((5.8, main_y - 0.8), 3.4, 1.6, boxstyle="round,pad=0.05",
                              facecolor='white', edgecolor='#E67E22', linewidth=3)
    ax.add_patch(pcs_box)
    
    # PCS 内部 - AC/DC 转换符号
    # AC 侧 (正弦波)
    t_ac = np.linspace(0, 0.6, 30)
    sine_ac = main_y + 0.25 * np.sin(t_ac * 15)
    ax.plot(6.1 + t_ac, sine_ac, color='#3498DB', linewidth=2)
    ax.text(6.4, main_y - 0.4, 'AC', ha='center', fontsize=8, color='#3498DB', fontweight='bold')
    
    # 双向箭头
    ax.annotate('', xy=(7.8, main_y), xytext=(7.2, main_y),
                arrowprops=dict(arrowstyle='<->', color='#2C3E50', lw=2))
    
    # DC 侧 (直线)
    ax.plot([8.1, 8.7], [main_y + 0.15, main_y + 0.15], color='#27AE60', linewidth=3)
    ax.plot([8.1, 8.7], [main_y - 0.15, main_y - 0.15], color='#27AE60', linewidth=2, linestyle='--')
    ax.text(8.4, main_y - 0.4, 'DC', ha='center', fontsize=8, color='#27AE60', fontweight='bold')
    
    ax.text(pcs_x, main_y + 1.2, 'PCS', ha='center', fontsize=14, fontweight='bold', color='#D35400')
    ax.text(pcs_x, main_y + 0.9, '125 kW Bidirectional', ha='center', fontsize=9, color='#7F8C8D')
    
    # PCS 数据卡片
    pcs_card = FancyBboxPatch((5.8, 3.5), 3.4, 2.2, boxstyle="round,pad=0.05",
                               facecolor='#FEF5E7', edgecolor='#E67E22', linewidth=2)
    ax.add_patch(pcs_card)
    ax.text(7.5, 5.5, 'PCS DATA', ha='center', fontsize=10, fontweight='bold', color='#D35400')
    
    pcs_params = [
        ('AC Power', '125.8 kW'),
        ('DC Power', '124.5 kW'),
        ('Efficiency', '98.9 %'),
        ('Status', 'RUNNING'),
        ('Temperature', '45.2 °C'),
    ]
    for i, (param, val) in enumerate(pcs_params):
        y = 5.1 - i * 0.35
        ax.text(6.0, y, param, ha='left', fontsize=8, color='#34495E')
        color = '#27AE60' if val == 'RUNNING' else '#D35400'
        ax.text(9.0, y, val, ha='right', fontsize=8, color=color, fontweight='bold')
    
    # ========== 连接线: PCS → DC BUS ==========
    ax.plot([9.2, 10.5], [main_y, main_y], color='#27AE60', linewidth=3)
    
    # ========== DC BUS (直流母线) ==========
    dc_bus_x = 10.8
    # 正极母线 (红色)
    ax.plot([dc_bus_x - 0.1, dc_bus_x + 0.1], [main_y + 0.5, main_y + 0.5], 
            color='#E74C3C', linewidth=6, solid_capstyle='round')
    ax.plot([dc_bus_x, dc_bus_x], [main_y + 0.5, main_y], color='#E74C3C', linewidth=3)
    ax.text(dc_bus_x - 0.4, main_y + 0.5, '+', ha='center', va='center',
            fontsize=14, color='#E74C3C', fontweight='bold')
    
    # 负极母线 (蓝色)
    ax.plot([dc_bus_x - 0.1, dc_bus_x + 0.1], [main_y - 0.5, main_y - 0.5],
            color='#3498DB', linewidth=6, solid_capstyle='round')
    ax.plot([dc_bus_x, dc_bus_x], [main_y - 0.5, main_y], color='#3498DB', linewidth=3)
    ax.text(dc_bus_x - 0.4, main_y - 0.5, '-', ha='center', va='center',
            fontsize=14, color='#3498DB', fontweight='bold')
    
    ax.text(dc_bus_x, main_y + 1.0, 'DC BUS', ha='center', fontsize=10, fontweight='bold', color='#2C3E50')
    ax.text(dc_bus_x, main_y + 0.75, '750V', ha='center', fontsize=9, color='#7F8C8D')
    
    # ========== 连接线: DC BUS → CB2 ==========
    ax.plot([dc_bus_x + 0.1, 11.8], [main_y, main_y], color='#27AE60', linewidth=3)
    
    # ========== CB2 直流断路器 ==========
    cb2_x = 12.1
    cb2_box = Rectangle((cb2_x - 0.2, main_y - 0.25), 0.4, 0.5,
                         facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb2_box)
    ax.text(cb2_x, main_y, 'CB', ha='center', va='center', fontsize=7, fontweight='bold')
    ax.text(cb2_x, main_y - 0.55, 'DC CB', ha='center', fontsize=8, color='#7F8C8D')
    
    # ========== 连接线: CB2 → BATTERY ==========
    ax.plot([cb2_x + 0.2, 13.3], [main_y, main_y], color='#27AE60', linewidth=3)
    
    # ========== BATTERY 电池 (右侧) ==========
    batt_x = 14.0
    
    # 电池符号 - 简化版
    # 电池主体
    batt_body = Rectangle((batt_x - 0.5, main_y - 0.5), 1.0, 1.0,
                           facecolor='white', edgecolor='#27AE60', linewidth=3)
    ax.add_patch(batt_body)
    
    # 电池正极端子
    batt_term = Rectangle((batt_x - 0.15, main_y + 0.5), 0.3, 0.15,
                           facecolor='#27AE60', edgecolor='#27AE60')
    ax.add_patch(batt_term)
    
    # 电池内部线条 (表示电池层)
    for i in range(3):
        y_line = main_y - 0.3 + i * 0.3
        ax.plot([batt_x - 0.35, batt_x + 0.35], [y_line, y_line], 
                color='#27AE60', linewidth=2, alpha=0.5)
    
    ax.text(batt_x, main_y + 1.0, 'BATTERY', ha='center', fontsize=12,
            fontweight='bold', color='#1E8449')
    ax.text(batt_x, main_y + 0.75, '750V / 500Ah', ha='center', fontsize=9, color='#7F8C8D')
    
    # 电池数据卡片
    batt_card = FancyBboxPatch((12.5, 3.5), 3, 2.2, boxstyle="round,pad=0.05",
                                facecolor='#E8F8F5', edgecolor='#27AE60', linewidth=2)
    ax.add_patch(batt_card)
    ax.text(14, 5.5, 'BATTERY DATA', ha='center', fontsize=10, fontweight='bold', color='#1E8449')
    
    batt_params = [
        ('Voltage', '748.5 V'),
        ('Current', '166.0 A'),
        ('SOC', '75.5 %'),
        ('SOH', '98.2 %'),
        ('Temperature', '32.1 °C'),
    ]
    for i, (param, val) in enumerate(batt_params):
        y = 5.1 - i * 0.35
        ax.text(12.7, y, param, ha='left', fontsize=8, color='#34495E')
        ax.text(15.3, y, val, ha='right', fontsize=8, color='#1E8449', fontweight='bold')
    
    # ========== 能量流向指示 ==========
    # 箭头显示当前充电方向
    flow_y = 7.8
    ax.annotate('', xy=(12, flow_y), xytext=(4, flow_y),
                arrowprops=dict(arrowstyle='->', color='#3498DB', lw=3,
                               connectionstyle='arc3,rad=0'))
    ax.text(8, flow_y + 0.3, 'ENERGY FLOW: CHARGING (125.8 kW)', ha='center',
            fontsize=10, color='#3498DB', fontweight='bold')
    
    # ========== 图例 ==========
    legend_box = FancyBboxPatch((0.5, 0.5), 4, 2.5, boxstyle="round,pad=0.05",
                                 facecolor='#F8F9FA', edgecolor='#DEE2E6', linewidth=1)
    ax.add_patch(legend_box)
    ax.text(2.5, 2.8, 'LEGEND', ha='center', fontsize=10, fontweight='bold', color='#2C3E50')
    
    legend_items = [
        ('━━━', 'AC Line', 'black', 0.7, 2.3),
        ('━━━', 'DC Line (+)', '#E74C3C', 0.7, 1.9),
        ('━ ━', 'DC Line (-)', '#3498DB', 0.7, 1.5),
        ('□', 'Circuit Breaker (CB)', 'black', 2.7, 2.3),
        ('○', 'Grid Connection', '#3498DB', 2.7, 1.9),
        ('▢', 'Battery', '#27AE60', 2.7, 1.5),
    ]
    
    for symbol, desc, color, x, y in legend_items:
        if symbol in ['━━━', '━ ━']:
            style = '-' if symbol == '━━━' else '--'
            ax.plot([x, x + 0.4], [y, y], color=color, linewidth=2, linestyle=style)
        elif symbol == '□':
            rect = Rectangle((x, y - 0.1), 0.2, 0.2, facecolor='white', edgecolor=color, linewidth=1.5)
            ax.add_patch(rect)
        elif symbol == '○':
            circ = Circle((x + 0.1, y), 0.12, facecolor='white', edgecolor=color, linewidth=1.5)
            ax.add_patch(circ)
        elif symbol == '▢':
            rect = Rectangle((x, y - 0.12), 0.2, 0.24, facecolor='white', edgecolor=color, linewidth=1.5)
            ax.add_patch(rect)
        ax.text(x + 0.55, y, desc, ha='left', va='center', fontsize=8, color='#34495E')
    
    # ========== 状态指示器 ==========
    status_box = FancyBboxPatch((5, 0.5), 6, 2.5, boxstyle="round,pad=0.05",
                                 facecolor='#F8F9FA', edgecolor='#DEE2E6', linewidth=1)
    ax.add_patch(status_box)
    ax.text(8, 2.8, 'SYSTEM STATUS', ha='center', fontsize=10, fontweight='bold', color='#2C3E50')
    
    statuses = [
        ('Grid Connection', 'CONNECTED', '#27AE60'),
        ('PCS Status', 'RUNNING', '#27AE60'),
        ('DC Contactor', 'CLOSED', '#27AE60'),
        ('System Mode', 'CHARGING', '#3498DB'),
    ]
    
    for i, (label, status, color) in enumerate(statuses):
        col = i % 2
        row = i // 2
        x = 5.3 + col * 3
        y = 2.3 - row * 0.7
        
        # 状态指示灯
        indicator = Circle((x, y), 0.1, facecolor=color, edgecolor='none')
        ax.add_patch(indicator)
        ax.text(x + 0.2, y, f'{label}: ', ha='left', va='center', fontsize=8, color='#34495E')
        ax.text(x + 2.5, y, status, ha='right', va='center', fontsize=8, 
                color=color, fontweight='bold')
    
    # ========== 注释 ==========
    note_box = FancyBboxPatch((11.5, 0.5), 4, 2.5, boxstyle="round,pad=0.05",
                               facecolor='#FEF9E7', edgecolor='#F4D03F', linewidth=1)
    ax.add_patch(note_box)
    ax.text(13.5, 2.8, 'NOTES', ha='center', fontsize=10, fontweight='bold', color='#9A7D0A')
    
    notes = [
        '• Bidirectional power flow',
        '• All voltages nominal',
        '• CB = Circuit Breaker',
        '• Max power: 125 kW',
    ]
    for i, note in enumerate(notes):
        ax.text(11.7, 2.3 - i * 0.45, note, ha='left', fontsize=8, color='#7D6608')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


def main():
    """Generate optimized single line diagram"""
    print('Creating optimized Single Line Diagram...')
    fig = create_single_line_diagram_v2()
    
    # Save as PNG
    png_path = f'{OUTPUT_DIR}/pcs_single_line.png'
    fig.savefig(png_path, dpi=150, bbox_inches='tight',
                facecolor=fig.get_facecolor(), edgecolor='none')
    print(f'  Saved: {png_path}')
    
    # Save as SVG
    svg_path = f'{OUTPUT_DIR}/pcs_single_line.svg'
    fig.savefig(svg_path, format='svg', bbox_inches='tight',
                facecolor=fig.get_facecolor(), edgecolor='none')
    print(f'  Saved: {svg_path}')
    
    plt.close(fig)
    print('\n✅ Optimized single line diagram generated!')


if __name__ == '__main__':
    main()
