#!/usr/bin/env python3
"""
PCS (Power Conversion System) UI Design Mockups Generator - Version 3
Creates multiple design variations for energy storage system PCS monitoring
Optimized for showing PCS business logic and architecture at a glance

Design Styles:
1. Industrial HMI - Classic industrial control interface
2. Modern Dark Dashboard - Dark theme with neon accents
3. Energy Flow Diagram - Clear energy flow visualization
4. Clean Flat Design - Minimalist modern style
5. Technical Single Line - Professional electrical diagram
6. Control Room Display - Large screen monitoring style
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, FancyArrowPatch, Wedge, Arc
from matplotlib.collections import PatchCollection
import numpy as np
import os

# Create output directory
OUTPUT_DIR = '/workspace/designs/pcs_v3'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================================
# Color Schemes
# ============================================================================
COLORS = {
    # Industrial
    'ind_bg': '#E8E8E8',
    'ind_panel': '#F5F5F5',
    'ind_header': '#2E7D32',
    'ind_border': '#BDBDBD',
    'ind_text': '#212121',
    'ind_blue': '#1565C0',
    'ind_green': '#2E7D32',
    'ind_orange': '#EF6C00',
    'ind_red': '#C62828',
    
    # Modern Dark
    'dark_bg': '#0D1117',
    'dark_card': '#161B22',
    'dark_border': '#30363D',
    'dark_text': '#C9D1D9',
    'dark_accent': '#58A6FF',
    'dark_green': '#3FB950',
    'dark_yellow': '#D29922',
    'dark_red': '#F85149',
    'dark_purple': '#A371F7',
    
    # Neon
    'neon_cyan': '#00F5FF',
    'neon_green': '#00FF88',
    'neon_orange': '#FF6B35',
    'neon_pink': '#FF3366',
    
    # Flat
    'flat_blue': '#3498DB',
    'flat_green': '#27AE60',
    'flat_orange': '#F39C12',
    'flat_red': '#E74C3C',
    'flat_purple': '#9B59B6',
    'flat_dark': '#2C3E50',
    'flat_gray': '#95A5A6',
    'flat_light': '#ECF0F1',
}


# ============================================================================
# DESIGN 1: Industrial HMI Style
# ============================================================================
def create_industrial_hmi():
    """Create industrial HMI style PCS monitoring interface"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['ind_bg'])
    ax.set_facecolor(COLORS['ind_bg'])
    
    # Header bar
    header = Rectangle((0, 9.2), 16, 0.8, facecolor=COLORS['ind_header'])
    ax.add_patch(header)
    ax.text(8, 9.6, 'PCS MONITORING SYSTEM', ha='center', va='center',
            fontsize=18, fontweight='bold', color='white', family='monospace')
    
    # Status indicator lights in header
    status_lights = [
        ('RUN', 2, COLORS['ind_green']),
        ('GRID', 4, COLORS['ind_green']),
        ('FAULT', 6, '#888888'),
        ('COMM', 14, COLORS['ind_green']),
    ]
    for label, x, color in status_lights:
        circle = Circle((x, 9.6), 0.15, facecolor=color, edgecolor='white', linewidth=2)
        ax.add_patch(circle)
        ax.text(x + 0.4, 9.6, label, ha='left', va='center', fontsize=9, color='white')
    
    # Main topology panel
    topo_bg = FancyBboxPatch((0.3, 4.5), 10.5, 4.5, boxstyle="round,pad=0.02",
                              facecolor=COLORS['ind_panel'], edgecolor=COLORS['ind_border'], linewidth=2)
    ax.add_patch(topo_bg)
    ax.text(0.5, 8.8, 'SYSTEM TOPOLOGY', ha='left', fontsize=12, fontweight='bold', 
            color=COLORS['ind_text'], family='monospace')
    
    # Grid symbol (transformer style)
    grid_box = Rectangle((1, 5.8), 1.5, 1.5, facecolor='white', 
                          edgecolor=COLORS['ind_blue'], linewidth=3)
    ax.add_patch(grid_box)
    # Transformer windings
    ax.plot([1.4, 1.4], [5.9, 7.2], color=COLORS['ind_blue'], linewidth=2)
    ax.plot([2.1, 2.1], [5.9, 7.2], color=COLORS['ind_blue'], linewidth=2)
    for y in [6.1, 6.4, 6.7, 7.0]:
        ax.plot([1.3, 1.5], [y, y+0.15], color=COLORS['ind_blue'], linewidth=1.5)
        ax.plot([2.0, 2.2], [y, y+0.15], color=COLORS['ind_blue'], linewidth=1.5)
    ax.text(1.75, 5.5, 'GRID', ha='center', fontsize=10, fontweight='bold', color=COLORS['ind_blue'])
    
    # Grid data
    ax.text(1.75, 8.5, 'Vab: 380.5 V', ha='center', fontsize=9, color=COLORS['ind_text'])
    ax.text(1.75, 8.2, 'P: 125.8 kW', ha='center', fontsize=9, color=COLORS['ind_blue'], fontweight='bold')
    ax.text(1.75, 7.9, 'Q: 12.5 kVar', ha='center', fontsize=9, color=COLORS['ind_text'])
    
    # AC Bus bar
    ax.plot([2.7, 3.8], [6.55, 6.55], color=COLORS['ind_orange'], linewidth=6)
    ax.text(3.25, 6.2, 'AC BUS', ha='center', fontsize=8, color=COLORS['ind_orange'], fontweight='bold')
    
    # Contactor symbol (AC)
    ax.plot([3.8, 4.2], [6.55, 6.55], 'k-', linewidth=2)
    ax.plot([4.2, 4.5], [6.55, 6.8], 'k-', linewidth=2)  # Open contact representation
    circle_ac = Circle((4.35, 6.55), 0.15, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(circle_ac)
    ax.text(4.35, 6.1, 'AC CB', ha='center', fontsize=7, color=COLORS['ind_text'])
    
    # PCS Module
    pcs_box = FancyBboxPatch((5, 5.5), 2.2, 2.2, boxstyle="round,pad=0.05",
                              facecolor='white', edgecolor=COLORS['ind_orange'], linewidth=3)
    ax.add_patch(pcs_box)
    ax.text(6.1, 7.4, 'PCS', ha='center', fontsize=14, fontweight='bold', color=COLORS['ind_orange'])
    
    # PCS internal symbol (AC/DC conversion)
    ax.plot([5.4, 5.8], [6.5, 6.5], 'k-', linewidth=2)
    ax.text(5.6, 6.8, 'AC', ha='center', fontsize=8)
    ax.annotate('', xy=(6.4, 6.5), xytext=(5.9, 6.5),
                arrowprops=dict(arrowstyle='->', color='black', lw=2))
    ax.plot([6.5, 6.8], [6.5, 6.5], 'k-', linewidth=2)
    ax.text(6.65, 6.8, 'DC', ha='center', fontsize=8)
    ax.text(6.1, 5.8, 'Eff: 98.9%', ha='center', fontsize=9, color=COLORS['ind_green'], fontweight='bold')
    
    # DC Bus bar
    ax.plot([7.4, 8.5], [6.55, 6.55], color=COLORS['ind_green'], linewidth=6)
    ax.text(7.95, 6.2, 'DC BUS', ha='center', fontsize=8, color=COLORS['ind_green'], fontweight='bold')
    ax.text(7.95, 7.0, '750.2 V', ha='center', fontsize=10, color=COLORS['ind_green'], fontweight='bold')
    
    # DC Contactor
    ax.plot([8.5, 8.9], [6.55, 6.55], 'k-', linewidth=2)
    ax.plot([8.9, 9.2], [6.55, 6.8], 'k-', linewidth=2)
    circle_dc = Circle((9.05, 6.55), 0.15, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(circle_dc)
    ax.text(9.05, 6.1, 'DC CB', ha='center', fontsize=7, color=COLORS['ind_text'])
    
    # Battery symbol
    batt_outer = Rectangle((9.5, 5.8), 1.3, 1.5, facecolor='white',
                            edgecolor=COLORS['ind_green'], linewidth=3)
    ax.add_patch(batt_outer)
    batt_term = Rectangle((9.95, 7.3), 0.4, 0.15, facecolor=COLORS['ind_green'])
    ax.add_patch(batt_term)
    # Battery cells
    for i in range(3):
        y = 6.0 + i*0.4
        rect = Rectangle((9.6, y), 1.1, 0.3, facecolor=COLORS['ind_green'], alpha=0.3)
        ax.add_patch(rect)
    ax.text(10.15, 5.5, 'BATTERY', ha='center', fontsize=10, fontweight='bold', color=COLORS['ind_green'])
    
    # Battery data
    ax.text(10.15, 8.5, 'V: 748.5 V', ha='center', fontsize=9, color=COLORS['ind_text'])
    ax.text(10.15, 8.2, 'SOC: 75.5%', ha='center', fontsize=9, color=COLORS['ind_green'], fontweight='bold')
    ax.text(10.15, 7.9, 'I: 166.0 A', ha='center', fontsize=9, color=COLORS['ind_text'])
    
    # Right control panel
    ctrl_bg = FancyBboxPatch((11, 4.5), 4.7, 4.5, boxstyle="round,pad=0.02",
                              facecolor=COLORS['ind_panel'], edgecolor=COLORS['ind_border'], linewidth=2)
    ax.add_patch(ctrl_bg)
    ax.text(11.2, 8.8, 'CONTROL PANEL', ha='left', fontsize=12, fontweight='bold',
            color=COLORS['ind_text'], family='monospace')
    
    # Operation mode selector
    ax.text(11.2, 8.4, 'Operation Mode:', ha='left', fontsize=10, color=COLORS['ind_text'])
    modes = ['STANDBY', 'CHARGE', 'DISCHARGE']
    for i, mode in enumerate(modes):
        btn_color = COLORS['ind_green'] if i == 1 else COLORS['ind_border']
        text_color = 'white' if i == 1 else COLORS['ind_text']
        btn = FancyBboxPatch((11.2 + i*1.5, 7.9), 1.4, 0.4, boxstyle="round,pad=0.02",
                              facecolor=btn_color, edgecolor='#666666', linewidth=1)
        ax.add_patch(btn)
        ax.text(11.9 + i*1.5, 8.1, mode, ha='center', va='center', fontsize=7, 
                color=text_color, fontweight='bold')
    
    # Control mode
    ax.text(11.2, 7.5, 'Control Mode:', ha='left', fontsize=10, color=COLORS['ind_text'])
    ctrl_modes = ['LOCAL', 'REMOTE', 'EMS']
    for i, mode in enumerate(ctrl_modes):
        btn_color = COLORS['ind_blue'] if i == 2 else COLORS['ind_border']
        text_color = 'white' if i == 2 else COLORS['ind_text']
        btn = FancyBboxPatch((11.2 + i*1.5, 7.0), 1.4, 0.4, boxstyle="round,pad=0.02",
                              facecolor=btn_color, edgecolor='#666666', linewidth=1)
        ax.add_patch(btn)
        ax.text(11.9 + i*1.5, 7.2, mode, ha='center', va='center', fontsize=8,
                color=text_color, fontweight='bold')
    
    # Setpoint displays
    setpoints = [
        ('P Setpoint', '100.0 kW', 6.3),
        ('Q Setpoint', '0.0 kVar', 5.9),
        ('V Setpoint', '750.0 V', 5.5),
    ]
    for label, value, y in setpoints:
        ax.text(11.2, y, label + ':', ha='left', fontsize=9, color=COLORS['ind_text'])
        display = FancyBboxPatch((13.5, y-0.15), 1.8, 0.35, boxstyle="round,pad=0.02",
                                  facecolor='#1A1A1A', edgecolor='#333333', linewidth=1)
        ax.add_patch(display)
        ax.text(14.4, y+0.02, value, ha='center', va='center', fontsize=10,
                color=COLORS['neon_green'], fontweight='bold', family='monospace')
    
    # Action buttons
    ax.text(11.2, 5.0, 'Commands:', ha='left', fontsize=10, color=COLORS['ind_text'])
    buttons = [
        ('START', COLORS['ind_green']),
        ('STOP', COLORS['ind_red']),
        ('RESET', COLORS['ind_orange']),
    ]
    for i, (label, color) in enumerate(buttons):
        btn = FancyBboxPatch((11.2 + i*1.6, 4.5), 1.5, 0.4, boxstyle="round,pad=0.02",
                              facecolor=color, edgecolor='#333333', linewidth=2)
        ax.add_patch(btn)
        ax.text(11.95 + i*1.6, 4.7, label, ha='center', va='center', fontsize=9,
                color='white', fontweight='bold')
    
    # Bottom data panel
    data_bg = FancyBboxPatch((0.3, 0.3), 15.4, 4, boxstyle="round,pad=0.02",
                              facecolor=COLORS['ind_panel'], edgecolor=COLORS['ind_border'], linewidth=2)
    ax.add_patch(data_bg)
    ax.text(0.5, 4.1, 'REAL-TIME DATA', ha='left', fontsize=12, fontweight='bold',
            color=COLORS['ind_text'], family='monospace')
    
    # Data table
    col_headers = ['Parameter', 'Value', 'Unit', '', 'Parameter', 'Value', 'Unit']
    col_x = [0.5, 2.5, 3.5, 4.5, 5, 7, 8]
    for h, x in zip(col_headers, col_x):
        if h:
            ax.text(x, 3.7, h, ha='left', fontsize=9, fontweight='bold', color=COLORS['ind_text'])
    
    # Separator line
    ax.plot([0.5, 15.5], [3.55, 3.55], color=COLORS['ind_border'], linewidth=1)
    
    left_data = [
        ('Grid Voltage (Vab)', '380.5', 'V'),
        ('Grid Voltage (Vbc)', '381.2', 'V'),
        ('Grid Voltage (Vca)', '380.8', 'V'),
        ('Grid Frequency', '50.02', 'Hz'),
        ('AC Power (Active)', '125.8', 'kW'),
        ('AC Power (Reactive)', '12.5', 'kVar'),
        ('Power Factor', '0.995', ''),
    ]
    
    right_data = [
        ('DC Bus Voltage', '750.2', 'V'),
        ('DC Bus Current', '167.4', 'A'),
        ('DC Power', '125.5', 'kW'),
        ('Battery Voltage', '748.5', 'V'),
        ('Battery Current', '166.0', 'A'),
        ('Battery SOC', '75.5', '%'),
        ('PCS Efficiency', '98.9', '%'),
    ]
    
    for i, (param, val, unit) in enumerate(left_data):
        y = 3.3 - i*0.4
        ax.text(0.5, y, param, ha='left', fontsize=8, color=COLORS['ind_text'])
        ax.text(2.5, y, val, ha='left', fontsize=8, color=COLORS['ind_blue'], fontweight='bold')
        ax.text(3.5, y, unit, ha='left', fontsize=8, color=COLORS['ind_text'])
    
    for i, (param, val, unit) in enumerate(right_data):
        y = 3.3 - i*0.4
        ax.text(5, y, param, ha='left', fontsize=8, color=COLORS['ind_text'])
        ax.text(7, y, val, ha='left', fontsize=8, color=COLORS['ind_green'], fontweight='bold')
        ax.text(8, y, unit, ha='left', fontsize=8, color=COLORS['ind_text'])
    
    # Trend chart area
    trend_bg = FancyBboxPatch((9, 0.5), 6.5, 3.5, boxstyle="round,pad=0.02",
                               facecolor='white', edgecolor=COLORS['ind_border'], linewidth=1)
    ax.add_patch(trend_bg)
    ax.text(9.2, 3.8, 'POWER TREND', ha='left', fontsize=9, fontweight='bold', color=COLORS['ind_text'])
    
    # Simple trend line
    t = np.linspace(0, 6, 60)
    power = 125 + 10*np.sin(t) + np.random.randn(60)*3
    t_scaled = 9.3 + t
    power_scaled = 0.7 + (power - 100) * 0.05
    ax.plot(t_scaled, power_scaled, color=COLORS['ind_blue'], linewidth=2)
    ax.fill_between(t_scaled, 0.7, power_scaled, color=COLORS['ind_blue'], alpha=0.2)
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 2: Modern Dark Dashboard
# ============================================================================
def create_modern_dark_dashboard():
    """Create modern dark themed dashboard"""
    fig = plt.figure(figsize=(16, 10))
    fig.patch.set_facecolor(COLORS['dark_bg'])
    
    # Title
    fig.suptitle('PCS Real-Time Dashboard', fontsize=24, fontweight='bold',
                 color=COLORS['dark_text'], y=0.97)
    
    # Create subplots grid
    gs = fig.add_gridspec(3, 4, hspace=0.25, wspace=0.2,
                          left=0.03, right=0.97, top=0.91, bottom=0.04)
    
    def style_card(ax, title=''):
        ax.set_facecolor(COLORS['dark_card'])
        for spine in ax.spines.values():
            spine.set_color(COLORS['dark_border'])
            spine.set_linewidth(2)
        if title:
            ax.text(0.05, 0.95, title, transform=ax.transAxes, fontsize=11,
                   color=COLORS['dark_accent'], fontweight='bold', va='top')
        ax.set_xticks([])
        ax.set_yticks([])
    
    # Card 1: AC Power (large gauge style)
    ax1 = fig.add_subplot(gs[0, 0])
    style_card(ax1, 'AC POWER')
    # Gauge background
    theta = np.linspace(0.75*np.pi, 0.25*np.pi, 100)
    r_outer, r_inner = 0.35, 0.25
    ax1.plot(0.5 + r_outer*np.cos(theta), 0.4 + r_outer*np.sin(theta), 
             color=COLORS['dark_border'], linewidth=8)
    # Gauge fill (75% full)
    theta_fill = np.linspace(0.75*np.pi, 0.375*np.pi, 75)
    ax1.plot(0.5 + r_outer*np.cos(theta_fill), 0.4 + r_outer*np.sin(theta_fill),
             color=COLORS['neon_green'], linewidth=8)
    ax1.text(0.5, 0.35, '125.8', ha='center', va='center', fontsize=24,
             color=COLORS['neon_green'], fontweight='bold')
    ax1.text(0.5, 0.2, 'kW', ha='center', va='center', fontsize=14, color=COLORS['dark_text'])
    
    # Card 2: DC Power
    ax2 = fig.add_subplot(gs[0, 1])
    style_card(ax2, 'DC POWER')
    theta = np.linspace(0.75*np.pi, 0.25*np.pi, 100)
    ax2.plot(0.5 + r_outer*np.cos(theta), 0.4 + r_outer*np.sin(theta),
             color=COLORS['dark_border'], linewidth=8)
    theta_fill = np.linspace(0.75*np.pi, 0.38*np.pi, 74)
    ax2.plot(0.5 + r_outer*np.cos(theta_fill), 0.4 + r_outer*np.sin(theta_fill),
             color=COLORS['neon_cyan'], linewidth=8)
    ax2.text(0.5, 0.35, '124.5', ha='center', va='center', fontsize=24,
             color=COLORS['neon_cyan'], fontweight='bold')
    ax2.text(0.5, 0.2, 'kW', ha='center', va='center', fontsize=14, color=COLORS['dark_text'])
    
    # Card 3: Efficiency
    ax3 = fig.add_subplot(gs[0, 2])
    style_card(ax3, 'EFFICIENCY')
    # Circular progress
    circle_bg = Circle((0.5, 0.45), 0.3, facecolor='none', 
                        edgecolor=COLORS['dark_border'], linewidth=10)
    ax3.add_patch(circle_bg)
    theta = np.linspace(0.5*np.pi, 0.5*np.pi - 2*np.pi*0.989, 100)
    ax3.plot(0.5 + 0.3*np.cos(theta), 0.45 + 0.3*np.sin(theta),
             color=COLORS['dark_green'], linewidth=10)
    ax3.text(0.5, 0.45, '98.9%', ha='center', va='center', fontsize=20,
             color=COLORS['dark_green'], fontweight='bold')
    ax3.text(0.5, 0.08, 'System Efficiency', ha='center', fontsize=9, color=COLORS['dark_text'])
    
    # Card 4: Battery SOC
    ax4 = fig.add_subplot(gs[0, 3])
    style_card(ax4, 'BATTERY SOC')
    # Battery icon with fill
    batt_x, batt_y = 0.3, 0.2
    batt_w, batt_h = 0.4, 0.55
    batt = FancyBboxPatch((batt_x, batt_y), batt_w, batt_h, boxstyle="round,pad=0.02",
                           facecolor='none', edgecolor=COLORS['dark_green'], linewidth=3,
                           transform=ax4.transAxes)
    ax4.add_patch(batt)
    # Battery terminal
    term = Rectangle((0.42, 0.75), 0.16, 0.06, facecolor=COLORS['dark_green'],
                      transform=ax4.transAxes)
    ax4.add_patch(term)
    # Fill level
    fill = Rectangle((batt_x+0.02, batt_y+0.02), batt_w-0.04, (batt_h-0.04)*0.755,
                      facecolor=COLORS['dark_green'], alpha=0.6, transform=ax4.transAxes)
    ax4.add_patch(fill)
    ax4.text(0.5, 0.47, '75.5%', ha='center', va='center', fontsize=18,
             color='white', fontweight='bold')
    ax4.text(0.5, 0.08, '748.5 V', ha='center', fontsize=10, color=COLORS['dark_text'])
    
    # Card 5: System Status (spans 2 columns)
    ax5 = fig.add_subplot(gs[1, 0:2])
    style_card(ax5, 'SYSTEM STATUS')
    
    statuses = [
        ('Grid Connection', 'CONNECTED', COLORS['dark_green']),
        ('PCS Status', 'CHARGING', COLORS['neon_cyan']),
        ('DC Contactor', 'CLOSED', COLORS['dark_green']),
        ('AC Contactor', 'CLOSED', COLORS['dark_green']),
        ('Communication', 'NORMAL', COLORS['dark_green']),
        ('Fault Status', 'NO FAULT', COLORS['dark_green']),
    ]
    
    for i, (name, status, color) in enumerate(statuses):
        row, col = i // 2, i % 2
        x = 0.05 + col*0.5
        y = 0.75 - row*0.25
        ax5.text(x, y, name, ha='left', va='center', transform=ax5.transAxes,
                fontsize=10, color=COLORS['dark_text'])
        # Status badge
        badge = FancyBboxPatch((x+0.28, y-0.06), 0.18, 0.12, boxstyle="round,pad=0.01",
                                facecolor=color, alpha=0.2, edgecolor=color, linewidth=1,
                                transform=ax5.transAxes)
        ax5.add_patch(badge)
        ax5.text(x+0.37, y, status, ha='center', va='center', transform=ax5.transAxes,
                fontsize=8, color=color, fontweight='bold')
    
    # Card 6: Energy Flow Diagram
    ax6 = fig.add_subplot(gs[1, 2:4])
    style_card(ax6, 'ENERGY FLOW')
    
    # Grid node
    grid_circle = Circle((0.15, 0.5), 0.1, facecolor=COLORS['dark_card'],
                          edgecolor=COLORS['flat_blue'], linewidth=3, transform=ax6.transAxes)
    ax6.add_patch(grid_circle)
    ax6.text(0.15, 0.5, 'GRID', ha='center', va='center', transform=ax6.transAxes,
             fontsize=8, color=COLORS['flat_blue'], fontweight='bold')
    ax6.text(0.15, 0.32, '380V AC', ha='center', transform=ax6.transAxes,
             fontsize=7, color=COLORS['dark_text'])
    
    # PCS node
    pcs_box = FancyBboxPatch((0.4, 0.4), 0.2, 0.2, boxstyle="round,pad=0.02",
                              facecolor=COLORS['dark_card'], edgecolor=COLORS['neon_orange'],
                              linewidth=3, transform=ax6.transAxes)
    ax6.add_patch(pcs_box)
    ax6.text(0.5, 0.5, 'PCS', ha='center', va='center', transform=ax6.transAxes,
             fontsize=10, color=COLORS['neon_orange'], fontweight='bold')
    ax6.text(0.5, 0.32, '98.9%', ha='center', transform=ax6.transAxes,
             fontsize=7, color=COLORS['dark_text'])
    
    # Battery node
    batt_circle = Circle((0.85, 0.5), 0.1, facecolor=COLORS['dark_card'],
                          edgecolor=COLORS['dark_green'], linewidth=3, transform=ax6.transAxes)
    ax6.add_patch(batt_circle)
    ax6.text(0.85, 0.5, 'BATT', ha='center', va='center', transform=ax6.transAxes,
             fontsize=8, color=COLORS['dark_green'], fontweight='bold')
    ax6.text(0.85, 0.32, '750V DC', ha='center', transform=ax6.transAxes,
             fontsize=7, color=COLORS['dark_text'])
    
    # Flow arrows
    ax6.annotate('', xy=(0.38, 0.5), xytext=(0.27, 0.5),
                arrowprops=dict(arrowstyle='->', color=COLORS['neon_cyan'], lw=3),
                transform=ax6.transAxes)
    ax6.text(0.325, 0.6, '125.8 kW', ha='center', transform=ax6.transAxes,
             fontsize=8, color=COLORS['neon_cyan'], fontweight='bold')
    
    ax6.annotate('', xy=(0.73, 0.5), xytext=(0.62, 0.5),
                arrowprops=dict(arrowstyle='->', color=COLORS['neon_green'], lw=3),
                transform=ax6.transAxes)
    ax6.text(0.675, 0.6, '124.5 kW', ha='center', transform=ax6.transAxes,
             fontsize=8, color=COLORS['neon_green'], fontweight='bold')
    
    # Mode indicator
    mode_box = FancyBboxPatch((0.35, 0.1), 0.3, 0.12, boxstyle="round,pad=0.01",
                               facecolor=COLORS['neon_cyan'], alpha=0.2,
                               edgecolor=COLORS['neon_cyan'], linewidth=2, transform=ax6.transAxes)
    ax6.add_patch(mode_box)
    ax6.text(0.5, 0.16, 'CHARGING MODE', ha='center', va='center', transform=ax6.transAxes,
             fontsize=9, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Card 7: Three Phase Parameters
    ax7 = fig.add_subplot(gs[2, 0:2])
    style_card(ax7, 'THREE PHASE AC')
    
    phases = ['A', 'B', 'C']
    phase_colors = [COLORS['dark_yellow'], COLORS['dark_green'], COLORS['dark_red']]
    voltages = [220.1, 220.3, 219.8]
    currents = [186.2, 185.7, 186.0]
    
    for i, (phase, color, v, c) in enumerate(zip(phases, phase_colors, voltages, currents)):
        x = 0.1 + i*0.32
        # Phase label
        phase_circle = Circle((x, 0.75), 0.06, facecolor=color, alpha=0.3,
                               edgecolor=color, linewidth=2, transform=ax7.transAxes)
        ax7.add_patch(phase_circle)
        ax7.text(x, 0.75, phase, ha='center', va='center', transform=ax7.transAxes,
                fontsize=10, color=color, fontweight='bold')
        # Values
        ax7.text(x, 0.55, f'{v} V', ha='center', transform=ax7.transAxes,
                fontsize=12, color=color, fontweight='bold')
        ax7.text(x, 0.35, f'{c} A', ha='center', transform=ax7.transAxes,
                fontsize=12, color=COLORS['dark_text'])
    
    # Card 8: Power Trend
    ax8 = fig.add_subplot(gs[2, 2:4])
    ax8.set_facecolor(COLORS['dark_card'])
    for spine in ax8.spines.values():
        spine.set_color(COLORS['dark_border'])
        spine.set_linewidth(2)
    
    t = np.linspace(0, 60, 120)
    ac_power = 125 + 5*np.sin(t/10) + np.random.randn(120)*2
    dc_power = 124 + 5*np.sin(t/10 + 0.5) + np.random.randn(120)*2
    
    ax8.plot(t, ac_power, color=COLORS['neon_cyan'], linewidth=2, label='AC Power')
    ax8.plot(t, dc_power, color=COLORS['neon_green'], linewidth=2, label='DC Power')
    ax8.fill_between(t, ac_power, alpha=0.1, color=COLORS['neon_cyan'])
    ax8.fill_between(t, dc_power, alpha=0.1, color=COLORS['neon_green'])
    
    ax8.set_xlabel('Time (min)', color=COLORS['dark_text'], fontsize=9)
    ax8.set_ylabel('Power (kW)', color=COLORS['dark_text'], fontsize=9)
    ax8.tick_params(colors=COLORS['dark_text'], labelsize=8)
    ax8.legend(loc='upper right', facecolor=COLORS['dark_card'],
               edgecolor=COLORS['dark_border'], labelcolor=COLORS['dark_text'], fontsize=8)
    ax8.grid(True, alpha=0.2, color=COLORS['dark_border'])
    ax8.set_title('POWER TREND', color=COLORS['dark_accent'], fontsize=11,
                  fontweight='bold', loc='left', pad=5)
    
    return fig


# ============================================================================
# DESIGN 3: Clean Energy Flow Diagram
# ============================================================================
def create_energy_flow_diagram():
    """Create clean energy flow visualization"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('#0A192F')
    ax.set_facecolor('#0A192F')
    
    # Title
    ax.text(8, 9.5, 'PCS ENERGY FLOW MONITOR', ha='center', va='center',
            fontsize=22, fontweight='bold', color='white')
    ax.text(8, 9.1, 'Real-time Power Conversion System Status', ha='center',
            fontsize=11, color='#8892B0')
    
    # Grid Section (Left)
    # Outer glow effect
    grid_glow = Circle((2.5, 5.5), 1.4, facecolor=COLORS['flat_blue'], alpha=0.1)
    ax.add_patch(grid_glow)
    grid_circle = Circle((2.5, 5.5), 1.2, facecolor='#112240', 
                          edgecolor=COLORS['flat_blue'], linewidth=4)
    ax.add_patch(grid_circle)
    
    # Grid icon
    ax.plot([2.1, 2.1], [5.1, 5.9], color=COLORS['flat_blue'], linewidth=3)
    ax.plot([2.5, 2.5], [4.9, 6.1], color=COLORS['flat_blue'], linewidth=3)
    ax.plot([2.9, 2.9], [5.1, 5.9], color=COLORS['flat_blue'], linewidth=3)
    ax.plot([2.0, 3.0], [5.5, 5.5], color=COLORS['flat_blue'], linewidth=3)
    
    ax.text(2.5, 4.0, 'GRID', ha='center', fontsize=14, fontweight='bold', color=COLORS['flat_blue'])
    ax.text(2.5, 3.6, '380V AC / 50Hz', ha='center', fontsize=10, color='#8892B0')
    
    # Grid metrics
    grid_metrics = [
        ('Active Power', '125.8 kW'),
        ('Reactive Power', '12.5 kVar'),
        ('Power Factor', '0.995'),
    ]
    for i, (label, value) in enumerate(grid_metrics):
        y = 7.8 - i*0.5
        ax.text(0.8, y, label, ha='left', fontsize=9, color='#8892B0')
        ax.text(4.2, y, value, ha='right', fontsize=10, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Flow line Grid -> PCS
    for i in range(5):
        alpha = 0.3 + (4-i)*0.15
        ax.plot([3.8 + i*0.3, 4.1 + i*0.3], [5.5, 5.5], 
                color=COLORS['neon_cyan'], linewidth=8, alpha=alpha, solid_capstyle='round')
    ax.annotate('', xy=(5.8, 5.5), xytext=(5.3, 5.5),
                arrowprops=dict(arrowstyle='->', color=COLORS['neon_cyan'], lw=4))
    
    # Power value on flow
    ax.text(4.9, 6.0, '125.8 kW', ha='center', fontsize=12, fontweight='bold',
            color=COLORS['neon_cyan'], 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#0A192F', edgecolor=COLORS['neon_cyan']))
    ax.text(4.9, 5.0, 'AC Side', ha='center', fontsize=9, color='#8892B0')
    
    # PCS Section (Center)
    pcs_glow = FancyBboxPatch((6, 4), 4, 3, boxstyle="round,pad=0.1",
                               facecolor=COLORS['neon_orange'], alpha=0.1)
    ax.add_patch(pcs_glow)
    pcs_box = FancyBboxPatch((6.2, 4.2), 3.6, 2.6, boxstyle="round,pad=0.1",
                              facecolor='#112240', edgecolor=COLORS['neon_orange'], linewidth=4)
    ax.add_patch(pcs_box)
    
    ax.text(8, 6.3, 'PCS', ha='center', fontsize=18, fontweight='bold', color=COLORS['neon_orange'])
    ax.text(8, 5.8, 'Power Conversion', ha='center', fontsize=10, color='#8892B0')
    
    # Efficiency display
    eff_circle = Circle((8, 5.0), 0.6, facecolor='#0A192F', 
                         edgecolor=COLORS['dark_green'], linewidth=3)
    ax.add_patch(eff_circle)
    ax.text(8, 5.0, '98.9%', ha='center', va='center', fontsize=14, 
            fontweight='bold', color=COLORS['dark_green'])
    ax.text(8, 4.3, 'Efficiency', ha='center', fontsize=9, color='#8892B0')
    
    # PCS metrics
    pcs_metrics = [
        ('AC Input', '125.8 kW'),
        ('DC Output', '124.5 kW'),
        ('Temp', '45.2 C'),
    ]
    for i, (label, value) in enumerate(pcs_metrics):
        y = 7.8 - i*0.5
        ax.text(6.2, y, label, ha='left', fontsize=9, color='#8892B0')
        ax.text(9.8, y, value, ha='right', fontsize=10, color=COLORS['neon_orange'], fontweight='bold')
    
    # Flow line PCS -> Battery
    for i in range(5):
        alpha = 0.3 + (4-i)*0.15
        ax.plot([10.0 + i*0.3, 10.3 + i*0.3], [5.5, 5.5],
                color=COLORS['neon_green'], linewidth=8, alpha=alpha, solid_capstyle='round')
    ax.annotate('', xy=(12.2, 5.5), xytext=(11.7, 5.5),
                arrowprops=dict(arrowstyle='->', color=COLORS['neon_green'], lw=4))
    
    # Power value on flow
    ax.text(11.1, 6.0, '124.5 kW', ha='center', fontsize=12, fontweight='bold',
            color=COLORS['neon_green'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#0A192F', edgecolor=COLORS['neon_green']))
    ax.text(11.1, 5.0, 'DC Side', ha='center', fontsize=9, color='#8892B0')
    
    # Battery Section (Right)
    batt_glow = FancyBboxPatch((12.4, 4.3), 2.2, 2.4, boxstyle="round,pad=0.1",
                                facecolor=COLORS['dark_green'], alpha=0.1)
    ax.add_patch(batt_glow)
    batt_box = FancyBboxPatch((12.6, 4.5), 1.8, 2, boxstyle="round,pad=0.05",
                               facecolor='#112240', edgecolor=COLORS['dark_green'], linewidth=4)
    ax.add_patch(batt_box)
    # Battery terminal
    batt_term = Rectangle((13.2, 6.5), 0.6, 0.2, facecolor=COLORS['dark_green'])
    ax.add_patch(batt_term)
    
    # Battery fill level
    fill_height = 1.8 * 0.755
    batt_fill = Rectangle((12.7, 4.6), 1.6, fill_height, facecolor=COLORS['dark_green'], alpha=0.4)
    ax.add_patch(batt_fill)
    
    ax.text(13.5, 5.5, '75.5%', ha='center', va='center', fontsize=16,
            fontweight='bold', color='white')
    
    ax.text(13.5, 4.0, 'BATTERY', ha='center', fontsize=14, fontweight='bold', color=COLORS['dark_green'])
    ax.text(13.5, 3.6, '750V DC', ha='center', fontsize=10, color='#8892B0')
    
    # Battery metrics
    batt_metrics = [
        ('Voltage', '748.5 V'),
        ('Current', '166.0 A'),
        ('SOH', '98.2%'),
    ]
    for i, (label, value) in enumerate(batt_metrics):
        y = 7.8 - i*0.5
        ax.text(11.8, y, label, ha='left', fontsize=9, color='#8892B0')
        ax.text(15.2, y, value, ha='right', fontsize=10, color=COLORS['neon_green'], fontweight='bold')
    
    # Bottom status bar
    status_bar = FancyBboxPatch((0.5, 0.5), 15, 2.5, boxstyle="round,pad=0.05",
                                 facecolor='#112240', edgecolor='#233554', linewidth=2)
    ax.add_patch(status_bar)
    
    # Mode indicator (center)
    mode_box = FancyBboxPatch((6, 1.5), 4, 1, boxstyle="round,pad=0.05",
                               facecolor=COLORS['neon_cyan'], alpha=0.2,
                               edgecolor=COLORS['neon_cyan'], linewidth=2)
    ax.add_patch(mode_box)
    ax.text(8, 2.3, 'Current Mode', ha='center', fontsize=9, color='#8892B0')
    ax.text(8, 1.8, 'CHARGING', ha='center', fontsize=16, fontweight='bold', color=COLORS['neon_cyan'])
    
    # Statistics
    stats = [
        ('Today In', '1,245 kWh', 1.5),
        ('Today Out', '1,189 kWh', 3.5),
        ('Cycles', '1,847', 11),
        ('Runtime', '12,456 h', 13.5),
    ]
    for label, value, x in stats:
        ax.text(x, 2.3, label, ha='center', fontsize=9, color='#8892B0')
        ax.text(x, 1.8, value, ha='center', fontsize=12, fontweight='bold', color='white')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 4: Technical Single Line Diagram
# ============================================================================
def create_single_line_diagram():
    """Create professional electrical single line diagram style"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    
    # Title block
    title_box = Rectangle((0, 9), 16, 1, facecolor='#2C3E50', edgecolor='none')
    ax.add_patch(title_box)
    ax.text(0.3, 9.5, 'PCS SINGLE LINE DIAGRAM', ha='left', va='center',
            fontsize=16, fontweight='bold', color='white', family='monospace')
    ax.text(15.7, 9.5, 'DWG: PCS-SLD-001', ha='right', va='center',
            fontsize=10, color='#95A5A6', family='monospace')
    
    # Main bus line
    ax.plot([1, 15], [7, 7], color='black', linewidth=4)
    ax.text(8, 7.3, '380V AC BUS', ha='center', fontsize=10, fontweight='bold')
    
    # Grid connection
    # Utility symbol (circle with arrow)
    grid_circle = Circle((2, 8), 0.4, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(grid_circle)
    ax.annotate('', xy=(2, 7.6), xytext=(2, 8.4),
                arrowprops=dict(arrowstyle='->', color='black', lw=2))
    ax.plot([2, 2], [7, 7.6], 'k-', linewidth=2)
    ax.text(2, 8.7, 'UTILITY', ha='center', fontsize=9, fontweight='bold')
    ax.text(2, 6.6, '10kV/380V', ha='center', fontsize=8)
    
    # Circuit breaker symbol (CB1)
    cb1_y = 7
    ax.plot([3.5, 3.5], [cb1_y-0.3, cb1_y+0.3], 'k-', linewidth=2)
    ax.plot([3.3, 3.7], [cb1_y+0.3, cb1_y+0.3], 'k-', linewidth=2)
    ax.plot([3.3, 3.7], [cb1_y-0.3, cb1_y-0.3], 'k-', linewidth=2)
    cb1_rect = Rectangle((3.35, cb1_y-0.15), 0.3, 0.3, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb1_rect)
    ax.text(3.5, 6.4, 'CB1', ha='center', fontsize=8, fontweight='bold')
    
    # Measurement point (CT/PT)
    ax.plot([5, 5], [6.7, 7.3], 'k-', linewidth=2)
    ct_circle = Circle((5, 7), 0.2, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(ct_circle)
    ax.text(5, 7, 'CT', ha='center', va='center', fontsize=7)
    
    # Data box for grid
    grid_data = FancyBboxPatch((0.5, 4.5), 3, 1.8, boxstyle="round,pad=0.05",
                                facecolor='#ECF0F1', edgecolor='#BDC3C7', linewidth=1)
    ax.add_patch(grid_data)
    ax.text(2, 6.1, 'GRID DATA', ha='center', fontsize=9, fontweight='bold', color='#2C3E50')
    grid_params = [
        ('Vab', '380.5 V'),
        ('P', '125.8 kW'),
        ('Q', '12.5 kVar'),
        ('PF', '0.995'),
    ]
    for i, (param, val) in enumerate(grid_params):
        y = 5.7 - i*0.35
        ax.text(0.7, y, param + ':', ha='left', fontsize=8)
        ax.text(3.3, y, val, ha='right', fontsize=8, color='#2980B9', fontweight='bold')
    
    # PCS feeder line
    ax.plot([8, 8], [7, 5.5], 'k-', linewidth=2)
    
    # Circuit breaker (CB2)
    cb2_y = 6.5
    ax.plot([7.7, 8.3], [cb2_y+0.2, cb2_y+0.2], 'k-', linewidth=2)
    ax.plot([7.7, 8.3], [cb2_y-0.2, cb2_y-0.2], 'k-', linewidth=2)
    cb2_rect = Rectangle((7.85, cb2_y-0.15), 0.3, 0.3, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb2_rect)
    ax.text(8.5, cb2_y, 'CB2', ha='left', fontsize=8, fontweight='bold')
    
    # PCS Symbol (Rectifier/Inverter)
    pcs_box = Rectangle((7, 4), 2, 1.3, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(pcs_box)
    
    # AC side symbol (sine wave)
    t = np.linspace(0, 2*np.pi, 20)
    sine_x = 7.3 + 0.3*np.linspace(0, 1, 20)
    sine_y = 4.65 + 0.2*np.sin(t)
    ax.plot(sine_x, sine_y, 'k-', linewidth=1.5)
    
    # DC side symbol
    ax.plot([8.4, 8.7], [4.75, 4.75], 'k-', linewidth=2)
    ax.plot([8.4, 8.7], [4.55, 4.55], 'k-', linewidth=1)
    
    # Bidirectional arrows
    ax.annotate('', xy=(8.2, 4.65), xytext=(7.8, 4.65),
                arrowprops=dict(arrowstyle='<->', color='black', lw=1.5))
    
    ax.text(8, 3.7, 'PCS', ha='center', fontsize=10, fontweight='bold')
    ax.text(8, 3.4, '125kW', ha='center', fontsize=9)
    
    # PCS data box
    pcs_data = FancyBboxPatch((5.5, 1), 3, 2.2, boxstyle="round,pad=0.05",
                               facecolor='#FDF2E9', edgecolor='#E59866', linewidth=1)
    ax.add_patch(pcs_data)
    ax.text(7, 3.0, 'PCS DATA', ha='center', fontsize=9, fontweight='bold', color='#D35400')
    pcs_params = [
        ('AC Power', '125.8 kW'),
        ('DC Power', '124.5 kW'),
        ('Efficiency', '98.9 %'),
        ('Status', 'RUNNING'),
        ('Temp', '45.2 C'),
    ]
    for i, (param, val) in enumerate(pcs_params):
        y = 2.6 - i*0.35
        ax.text(5.7, y, param + ':', ha='left', fontsize=8)
        ax.text(8.3, y, val, ha='right', fontsize=8, color='#D35400', fontweight='bold')
    
    # DC Bus
    ax.plot([8, 8], [4, 3], 'k-', linewidth=2)
    ax.plot([6, 10], [3, 3], color='#E74C3C', linewidth=4)
    ax.plot([6, 10], [2.7, 2.7], color='#3498DB', linewidth=4)
    ax.text(8, 2.3, 'DC BUS (750V)', ha='center', fontsize=9, fontweight='bold')
    ax.text(5.5, 3, '+', ha='center', fontsize=12, color='#E74C3C', fontweight='bold')
    ax.text(5.5, 2.7, '-', ha='center', fontsize=12, color='#3498DB', fontweight='bold')
    
    # DC Circuit Breaker (CB3)
    ax.plot([11, 11], [3, 2.7], 'k-', linewidth=2)
    ax.plot([11, 11], [2.7, 1.5], 'k-', linewidth=2)
    cb3_rect = Rectangle((10.85, 2.0), 0.3, 0.3, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb3_rect)
    ax.text(11.5, 2.15, 'CB3', ha='left', fontsize=8, fontweight='bold')
    
    # Battery Symbol
    batt_y = 1.0
    ax.plot([11, 11], [1.5, batt_y + 0.4], 'k-', linewidth=2)
    
    # Battery plates
    ax.plot([10.6, 11.4], [batt_y + 0.3, batt_y + 0.3], 'k-', linewidth=3)
    ax.plot([10.8, 11.2], [batt_y + 0.1, batt_y + 0.1], 'k-', linewidth=3)
    ax.plot([10.6, 11.4], [batt_y - 0.1, batt_y - 0.1], 'k-', linewidth=3)
    ax.plot([10.8, 11.2], [batt_y - 0.3, batt_y - 0.3], 'k-', linewidth=3)
    ax.text(11, 0.3, 'BATTERY', ha='center', fontsize=9, fontweight='bold')
    ax.text(11, 0.0, '750V / 500Ah', ha='center', fontsize=8)
    
    # Battery data box
    batt_data = FancyBboxPatch((12.5, 0.5), 3, 2.5, boxstyle="round,pad=0.05",
                                facecolor='#E8F8F5', edgecolor='#1ABC9C', linewidth=1)
    ax.add_patch(batt_data)
    ax.text(14, 2.8, 'BATTERY DATA', ha='center', fontsize=9, fontweight='bold', color='#16A085')
    batt_params = [
        ('Voltage', '748.5 V'),
        ('Current', '166.0 A'),
        ('SOC', '75.5 %'),
        ('SOH', '98.2 %'),
        ('Temp', '32.1 C'),
    ]
    for i, (param, val) in enumerate(batt_params):
        y = 2.4 - i*0.35
        ax.text(12.7, y, param + ':', ha='left', fontsize=8)
        ax.text(15.3, y, val, ha='right', fontsize=8, color='#16A085', fontweight='bold')
    
    # Load connection
    ax.plot([14, 14], [7, 5], 'k-', linewidth=2)
    # Load circuit breaker
    cb4_rect = Rectangle((13.85, 6.0), 0.3, 0.3, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(cb4_rect)
    ax.text(14.5, 6.15, 'CB4', ha='left', fontsize=8, fontweight='bold')
    
    # Load symbol (arrow pointing down)
    load_box = Rectangle((13.5, 4.2), 1, 0.6, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(load_box)
    ax.annotate('', xy=(14, 4.3), xytext=(14, 4.7),
                arrowprops=dict(arrowstyle='->', color='black', lw=2))
    ax.text(14, 3.9, 'LOAD', ha='center', fontsize=9, fontweight='bold')
    
    # Legend
    legend_box = FancyBboxPatch((12.5, 7.5), 3, 1.3, boxstyle="round,pad=0.05",
                                 facecolor='#F8F9FA', edgecolor='#DEE2E6', linewidth=1)
    ax.add_patch(legend_box)
    ax.text(14, 8.6, 'LEGEND', ha='center', fontsize=9, fontweight='bold')
    
    # Legend items
    legend_items = [
        ('CB', 'Circuit Breaker'),
        ('CT', 'Current Transformer'),
        ('PCS', 'Power Conversion System'),
    ]
    for i, (sym, desc) in enumerate(legend_items):
        y = 8.2 - i*0.25
        ax.text(12.7, y, sym + ':', ha='left', fontsize=7, fontweight='bold')
        ax.text(13.2, y, desc, ha='left', fontsize=7)
    
    # Notes
    ax.text(0.3, 0.3, 'NOTE: All voltages are nominal values. System designed for bidirectional power flow.',
            fontsize=8, color='#7F8C8D', style='italic')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 5: Control Room Large Display
# ============================================================================
def create_control_room_display():
    """Create control room large screen display style"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('#1A1A2E')
    ax.set_facecolor('#1A1A2E')
    
    # Header
    header = Rectangle((0, 9.2), 16, 0.8, facecolor='#16213E')
    ax.add_patch(header)
    ax.text(0.3, 9.6, 'ENERGY STORAGE SYSTEM - CONTROL CENTER', ha='left',
            fontsize=16, fontweight='bold', color='white', family='monospace')
    
    # Status indicators in header
    status_items = [
        ('SYSTEM', 'ONLINE', COLORS['neon_green']),
        ('GRID', 'CONNECTED', COLORS['neon_green']),
        ('ALARMS', '0 ACTIVE', COLORS['neon_green']),
    ]
    for i, (label, status, color) in enumerate(status_items):
        x = 10 + i*2
        ax.text(x, 9.6, label, ha='center', fontsize=8, color='#8892B0')
        ax.text(x, 9.35, status, ha='center', fontsize=9, color=color, fontweight='bold')
    
    # Time display
    ax.text(15.7, 9.5, '2025-04-23 15:24:39', ha='right', fontsize=10,
            color=COLORS['neon_cyan'], family='monospace')
    
    # Main topology area
    topo_bg = FancyBboxPatch((0.2, 5), 10.5, 4, boxstyle="round,pad=0.02",
                              facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(topo_bg)
    ax.text(0.4, 8.8, 'SYSTEM TOPOLOGY', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Grid node
    grid_node = FancyBboxPatch((0.8, 6), 2, 1.8, boxstyle="round,pad=0.05",
                                facecolor='#0F3460', edgecolor=COLORS['flat_blue'], linewidth=3)
    ax.add_patch(grid_node)
    ax.text(1.8, 7.5, 'GRID', ha='center', fontsize=12, fontweight='bold', color=COLORS['flat_blue'])
    ax.text(1.8, 7.0, '380V AC', ha='center', fontsize=9, color='#8892B0')
    ax.text(1.8, 6.5, '125.8 kW', ha='center', fontsize=14, fontweight='bold', color=COLORS['neon_cyan'])
    ax.text(1.8, 6.15, '50.02 Hz', ha='center', fontsize=9, color='#8892B0')
    
    # Connection animation dots
    for i in range(4):
        x = 3.0 + i*0.5
        alpha = 0.3 + (3-i)*0.2
        dot = Circle((x, 6.9), 0.08, facecolor=COLORS['neon_cyan'], alpha=alpha)
        ax.add_patch(dot)
    
    # PCS node
    pcs_node = FancyBboxPatch((4.2, 5.8), 2.5, 2.2, boxstyle="round,pad=0.05",
                               facecolor='#0F3460', edgecolor=COLORS['neon_orange'], linewidth=3)
    ax.add_patch(pcs_node)
    ax.text(5.45, 7.7, 'PCS', ha='center', fontsize=12, fontweight='bold', color=COLORS['neon_orange'])
    
    # Status indicator
    pcs_status = Circle((5.45, 7.2), 0.25, facecolor=COLORS['neon_green'], alpha=0.8)
    ax.add_patch(pcs_status)
    ax.text(5.45, 7.2, 'RUN', ha='center', va='center', fontsize=7, color='white', fontweight='bold')
    
    ax.text(5.45, 6.7, 'Eff: 98.9%', ha='center', fontsize=10, color=COLORS['neon_green'], fontweight='bold')
    ax.text(5.45, 6.3, '45.2 C', ha='center', fontsize=9, color='#8892B0')
    ax.text(5.45, 5.95, 'CHARGING', ha='center', fontsize=8, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Connection dots PCS to Battery
    for i in range(4):
        x = 6.9 + i*0.5
        alpha = 0.3 + i*0.2
        dot = Circle((x, 6.9), 0.08, facecolor=COLORS['neon_green'], alpha=alpha)
        ax.add_patch(dot)
    
    # Battery node
    batt_node = FancyBboxPatch((8.5, 6), 2, 1.8, boxstyle="round,pad=0.05",
                                facecolor='#0F3460', edgecolor=COLORS['dark_green'], linewidth=3)
    ax.add_patch(batt_node)
    ax.text(9.5, 7.5, 'BATTERY', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark_green'])
    ax.text(9.5, 7.0, '750V DC', ha='center', fontsize=9, color='#8892B0')
    ax.text(9.5, 6.5, '75.5%', ha='center', fontsize=18, fontweight='bold', color=COLORS['neon_green'])
    ax.text(9.5, 6.15, 'SOC', ha='center', fontsize=9, color='#8892B0')
    
    # Right panels
    # Key metrics panel
    metrics_bg = FancyBboxPatch((10.9, 5), 4.9, 4, boxstyle="round,pad=0.02",
                                 facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(metrics_bg)
    ax.text(11.1, 8.8, 'KEY METRICS', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    metrics = [
        ('AC Power', '125.8', 'kW', COLORS['neon_cyan']),
        ('DC Power', '124.5', 'kW', COLORS['neon_green']),
        ('DC Voltage', '750.2', 'V', COLORS['dark_yellow']),
        ('DC Current', '167.4', 'A', COLORS['dark_yellow']),
        ('Battery V', '748.5', 'V', COLORS['neon_green']),
        ('Battery I', '166.0', 'A', COLORS['neon_green']),
    ]
    
    for i, (label, value, unit, color) in enumerate(metrics):
        y = 8.3 - i*0.55
        ax.text(11.1, y, label, ha='left', fontsize=9, color='#8892B0')
        ax.text(14.5, y, value, ha='right', fontsize=12, color=color, fontweight='bold')
        ax.text(15.6, y, unit, ha='right', fontsize=9, color='#8892B0')
    
    # Three phase display
    phase_bg = FancyBboxPatch((0.2, 2.5), 5, 2.3, boxstyle="round,pad=0.02",
                               facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(phase_bg)
    ax.text(0.4, 4.6, 'THREE PHASE AC', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    phases = [
        ('A', '220.1 V', '186.2 A', COLORS['dark_yellow']),
        ('B', '220.3 V', '185.7 A', COLORS['dark_green']),
        ('C', '219.8 V', '186.0 A', COLORS['dark_red']),
    ]
    
    for i, (phase, voltage, current, color) in enumerate(phases):
        x = 0.8 + i*1.6
        # Phase indicator
        phase_circle = Circle((x + 0.4, 4.1), 0.2, facecolor=color, alpha=0.3, edgecolor=color, linewidth=2)
        ax.add_patch(phase_circle)
        ax.text(x + 0.4, 4.1, phase, ha='center', va='center', fontsize=10, color=color, fontweight='bold')
        ax.text(x + 0.4, 3.6, voltage, ha='center', fontsize=10, color=color, fontweight='bold')
        ax.text(x + 0.4, 3.2, current, ha='center', fontsize=10, color='white')
    
    # Power trend
    trend_bg = FancyBboxPatch((5.4, 2.5), 5.3, 2.3, boxstyle="round,pad=0.02",
                               facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(trend_bg)
    ax.text(5.6, 4.6, 'POWER TREND (1h)', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Mini trend chart
    t = np.linspace(0, 1, 50)
    power = 0.3 + 0.15*np.sin(t*10) + 0.05*np.random.randn(50)
    t_scaled = 5.6 + t*4.9
    power_scaled = 2.7 + power*1.5
    ax.plot(t_scaled, power_scaled, color=COLORS['neon_cyan'], linewidth=2)
    ax.fill_between(t_scaled, 2.7, power_scaled, color=COLORS['neon_cyan'], alpha=0.1)
    
    # Statistics panel
    stats_bg = FancyBboxPatch((10.9, 2.5), 4.9, 2.3, boxstyle="round,pad=0.02",
                               facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(stats_bg)
    ax.text(11.1, 4.6, 'STATISTICS', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    stats = [
        ('Today Charge', '1,245.6 kWh'),
        ('Today Discharge', '1,189.2 kWh'),
        ('Total Cycles', '1,847'),
        ('Running Hours', '12,456 h'),
    ]
    for i, (label, value) in enumerate(stats):
        y = 4.2 - i*0.4
        ax.text(11.1, y, label, ha='left', fontsize=9, color='#8892B0')
        ax.text(15.6, y, value, ha='right', fontsize=10, color='white', fontweight='bold')
    
    # Alarm panel
    alarm_bg = FancyBboxPatch((0.2, 0.2), 15.6, 2.1, boxstyle="round,pad=0.02",
                               facecolor='#16213E', edgecolor='#30363D', linewidth=2)
    ax.add_patch(alarm_bg)
    ax.text(0.4, 2.1, 'EVENTS & ALARMS', ha='left', fontsize=11, color=COLORS['neon_cyan'], fontweight='bold')
    
    # Event log header
    headers = ['Time', 'Level', 'Source', 'Description']
    header_x = [0.4, 3.5, 5, 7]
    for h, x in zip(headers, header_x):
        ax.text(x, 1.7, h, ha='left', fontsize=9, color='#8892B0', fontweight='bold')
    
    # Event entries
    events = [
        ('15:24:39', 'INFO', 'PCS', 'Charging mode activated'),
        ('15:20:11', 'INFO', 'GRID', 'Grid voltage nominal'),
        ('15:15:00', 'INFO', 'BATT', 'SOC reached 75%'),
    ]
    for i, (time, level, source, desc) in enumerate(events):
        y = 1.35 - i*0.35
        level_color = COLORS['neon_green'] if level == 'INFO' else COLORS['dark_yellow']
        ax.text(0.4, y, time, ha='left', fontsize=8, color='#8892B0', family='monospace')
        ax.text(3.5, y, level, ha='left', fontsize=8, color=level_color, fontweight='bold')
        ax.text(5, y, source, ha='left', fontsize=8, color='white')
        ax.text(7, y, desc, ha='left', fontsize=8, color='#8892B0')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 6: Minimal Flat Design
# ============================================================================
def create_minimal_flat_design():
    """Create clean minimal flat design"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('#F7F9FC')
    ax.set_facecolor('#F7F9FC')
    
    # Header
    ax.text(8, 9.5, 'PCS Monitor', ha='center', fontsize=28, fontweight='bold', color=COLORS['flat_dark'])
    ax.text(8, 9.0, 'Power Conversion System Overview', ha='center', fontsize=12, color=COLORS['flat_gray'])
    
    # Main flow visualization
    # Grid card
    grid_card = FancyBboxPatch((0.5, 5), 3.5, 3.5, boxstyle="round,pad=0.05",
                                facecolor='white', edgecolor='#E1E8ED', linewidth=2)
    ax.add_patch(grid_card)
    
    # Grid icon circle
    grid_icon = Circle((2.25, 7.5), 0.6, facecolor=COLORS['flat_blue'], alpha=0.1,
                        edgecolor=COLORS['flat_blue'], linewidth=3)
    ax.add_patch(grid_icon)
    # Grid lines in icon
    ax.plot([1.95, 1.95], [7.2, 7.8], color=COLORS['flat_blue'], linewidth=2)
    ax.plot([2.25, 2.25], [7.1, 7.9], color=COLORS['flat_blue'], linewidth=2)
    ax.plot([2.55, 2.55], [7.2, 7.8], color=COLORS['flat_blue'], linewidth=2)
    ax.plot([1.85, 2.65], [7.5, 7.5], color=COLORS['flat_blue'], linewidth=2)
    
    ax.text(2.25, 6.6, 'Grid', ha='center', fontsize=14, fontweight='bold', color=COLORS['flat_dark'])
    ax.text(2.25, 6.2, '380V AC', ha='center', fontsize=10, color=COLORS['flat_gray'])
    
    ax.text(2.25, 5.6, '125.8', ha='center', fontsize=24, fontweight='bold', color=COLORS['flat_blue'])
    ax.text(2.25, 5.2, 'kW', ha='center', fontsize=12, color=COLORS['flat_gray'])
    
    # Arrow 1
    ax.annotate('', xy=(5.3, 6.75), xytext=(4.2, 6.75),
                arrowprops=dict(arrowstyle='->', color=COLORS['flat_blue'], lw=3))
    
    # PCS card
    pcs_card = FancyBboxPatch((5.5, 5), 5, 3.5, boxstyle="round,pad=0.05",
                               facecolor='white', edgecolor='#E1E8ED', linewidth=2)
    ax.add_patch(pcs_card)
    
    # PCS icon
    pcs_icon = FancyBboxPatch((7.4, 7.1), 1.2, 0.8, boxstyle="round,pad=0.05",
                               facecolor=COLORS['flat_orange'], alpha=0.1,
                               edgecolor=COLORS['flat_orange'], linewidth=3)
    ax.add_patch(pcs_icon)
    # Conversion arrows
    ax.annotate('', xy=(8.3, 7.5), xytext=(7.7, 7.5),
                arrowprops=dict(arrowstyle='<->', color=COLORS['flat_orange'], lw=2))
    
    ax.text(8, 6.6, 'PCS', ha='center', fontsize=14, fontweight='bold', color=COLORS['flat_dark'])
    ax.text(8, 6.2, 'Power Conversion', ha='center', fontsize=10, color=COLORS['flat_gray'])
    
    # Efficiency bar
    eff_bg = FancyBboxPatch((6.5, 5.5), 3, 0.4, boxstyle="round,pad=0.02",
                             facecolor='#E8E8E8', edgecolor='none')
    ax.add_patch(eff_bg)
    eff_fill = FancyBboxPatch((6.5, 5.5), 3*0.989, 0.4, boxstyle="round,pad=0.02",
                               facecolor=COLORS['flat_green'], edgecolor='none')
    ax.add_patch(eff_fill)
    ax.text(8, 5.7, '98.9% Efficiency', ha='center', va='center', fontsize=10, color='white', fontweight='bold')
    
    # Arrow 2
    ax.annotate('', xy=(12, 6.75), xytext=(10.7, 6.75),
                arrowprops=dict(arrowstyle='->', color=COLORS['flat_green'], lw=3))
    
    # Battery card
    batt_card = FancyBboxPatch((12.2, 5), 3.3, 3.5, boxstyle="round,pad=0.05",
                                facecolor='white', edgecolor='#E1E8ED', linewidth=2)
    ax.add_patch(batt_card)
    
    # Battery icon
    batt_icon = FancyBboxPatch((13.35, 7.1), 1.0, 0.7, boxstyle="round,pad=0.02",
                                facecolor=COLORS['flat_green'], alpha=0.1,
                                edgecolor=COLORS['flat_green'], linewidth=3)
    ax.add_patch(batt_icon)
    batt_term = Rectangle((13.65, 7.8), 0.4, 0.12, facecolor=COLORS['flat_green'])
    ax.add_patch(batt_term)
    # Battery level
    batt_fill = Rectangle((13.4, 7.15), 0.9*0.755, 0.55, facecolor=COLORS['flat_green'], alpha=0.4)
    ax.add_patch(batt_fill)
    
    ax.text(13.85, 6.6, 'Battery', ha='center', fontsize=14, fontweight='bold', color=COLORS['flat_dark'])
    ax.text(13.85, 6.2, '750V DC', ha='center', fontsize=10, color=COLORS['flat_gray'])
    
    ax.text(13.85, 5.6, '75.5%', ha='center', fontsize=24, fontweight='bold', color=COLORS['flat_green'])
    ax.text(13.85, 5.2, 'SOC', ha='center', fontsize=12, color=COLORS['flat_gray'])
    
    # Bottom metrics cards
    metrics = [
        ('AC Power', '125.8 kW', COLORS['flat_blue']),
        ('DC Power', '124.5 kW', COLORS['flat_green']),
        ('DC Voltage', '750.2 V', COLORS['flat_orange']),
        ('Battery Current', '166.0 A', COLORS['flat_purple']),
    ]
    
    card_width = 3.5
    start_x = 0.5
    for i, (label, value, color) in enumerate(metrics):
        x = start_x + i*(card_width + 0.4)
        card = FancyBboxPatch((x, 2.5), card_width, 2, boxstyle="round,pad=0.05",
                               facecolor='white', edgecolor='#E1E8ED', linewidth=2)
        ax.add_patch(card)
        
        # Color accent bar
        accent = Rectangle((x, 4.35), card_width, 0.15, facecolor=color)
        ax.add_patch(accent)
        
        ax.text(x + card_width/2, 3.9, label, ha='center', fontsize=10, color=COLORS['flat_gray'])
        ax.text(x + card_width/2, 3.2, value, ha='center', fontsize=16, fontweight='bold', color=COLORS['flat_dark'])
    
    # Status pills at bottom
    status_items = [
        ('Grid', 'Connected', COLORS['flat_green']),
        ('PCS', 'Charging', COLORS['flat_blue']),
        ('Battery', 'Normal', COLORS['flat_green']),
        ('System', 'Online', COLORS['flat_green']),
    ]
    
    for i, (label, status, color) in enumerate(status_items):
        x = 2 + i*3.2
        # Pill background
        pill = FancyBboxPatch((x, 1.3), 2.5, 0.7, boxstyle="round,pad=0.1",
                               facecolor=color, alpha=0.1, edgecolor=color, linewidth=1)
        ax.add_patch(pill)
        ax.text(x + 1.25, 1.65, f'{label}: {status}', ha='center', va='center',
                fontsize=10, color=color, fontweight='bold')
    
    # Footer
    ax.text(8, 0.5, 'Last updated: 2025-04-23 15:24:39', ha='center', fontsize=9, color=COLORS['flat_gray'])
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# Main execution
# ============================================================================
def main():
    """Generate all PCS design mockups"""
    designs = [
        ('pcs_industrial_hmi', create_industrial_hmi, 'Industrial HMI Style'),
        ('pcs_modern_dark', create_modern_dark_dashboard, 'Modern Dark Dashboard'),
        ('pcs_energy_flow', create_energy_flow_diagram, 'Energy Flow Diagram'),
        ('pcs_single_line', create_single_line_diagram, 'Technical Single Line'),
        ('pcs_control_room', create_control_room_display, 'Control Room Display'),
        ('pcs_minimal_flat', create_minimal_flat_design, 'Minimal Flat Design'),
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
    
    print(f'\n✅ All {len(designs)} designs generated successfully!')
    print(f'📁 Output directory: {OUTPUT_DIR}')
    print('\nGenerated files:')
    for filename, _, desc in designs:
        print(f'  - {filename}.png ({desc})')
        print(f'  - {filename}.svg ({desc})')


if __name__ == '__main__':
    main()
