#!/usr/bin/env python3
"""
PCS (Power Conversion System) UI Design Mockups Generator
Creates multiple design variations for energy storage system controller
Based on reference style from reeviewer1.jpg and reeviewer2.jpg
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, FancyArrowPatch
import numpy as np

# Color scheme based on reference images
COLORS = {
    'header_green': '#2E8B57',
    'header_light': '#90EE90',
    'bg_white': '#FFFFFF',
    'bg_light_gray': '#F5F5F5',
    'bg_dark_gray': '#E0E0E0',
    'text_blue': '#0066CC',
    'text_black': '#333333',
    'line_black': '#000000',
    'accent_green': '#32CD32',
    'warning_yellow': '#FFD700',
    'error_red': '#FF4444',
    'grid_blue': '#4169E1',
    'battery_green': '#228B22',
    'pcs_orange': '#FF8C00',
}


def draw_grid_tower(ax, x, y, scale=1.0):
    """Draw a transmission tower/grid icon"""
    s = scale
    # Tower structure
    tower_x = [x, x-0.3*s, x-0.5*s, x-0.3*s, x-0.15*s, x-0.15*s]
    tower_y = [y+0.8*s, y+0.5*s, y+0.3*s, y+0.3*s, y, y]
    ax.plot(tower_x, tower_y, 'k-', linewidth=2)
    
    # Mirror for right side
    tower_x_r = [x, x+0.3*s, x+0.5*s, x+0.3*s, x+0.15*s, x+0.15*s]
    ax.plot(tower_x_r, tower_y, 'k-', linewidth=2)
    
    # Cross beams
    ax.plot([x-0.35*s, x+0.35*s], [y+0.4*s, y+0.4*s], 'k-', linewidth=1.5)
    ax.plot([x-0.25*s, x+0.25*s], [y+0.55*s, y+0.55*s], 'k-', linewidth=1.5)
    
    # Power lines
    ax.plot([x-0.5*s, x-0.7*s], [y+0.3*s, y+0.35*s], 'k-', linewidth=1)
    ax.plot([x+0.5*s, x+0.7*s], [y+0.3*s, y+0.35*s], 'k-', linewidth=1)
    ax.plot([x, x], [y+0.8*s, y+0.9*s], 'k-', linewidth=1)


def draw_pcs_module(ax, x, y, scale=1.0):
    """Draw PCS (Power Conversion System) module icon"""
    s = scale
    # Main box
    rect = Rectangle((x-0.4*s, y-0.3*s), 0.8*s, 0.6*s, 
                      fill=False, edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    
    # AC/DC conversion symbol (bidirectional arrows)
    ax.annotate('', xy=(x+0.15*s, y+0.1*s), xytext=(x-0.15*s, y+0.1*s),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.5))
    ax.annotate('', xy=(x-0.15*s, y-0.1*s), xytext=(x+0.15*s, y-0.1*s),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.5))


def draw_relay_module(ax, x, y, scale=1.0, label='R'):
    """Draw relay/contactor module"""
    s = scale
    # Main box
    rect = Rectangle((x-0.25*s, y-0.2*s), 0.5*s, 0.4*s, 
                      fill=True, facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    ax.text(x, y, label, ha='center', va='center', fontsize=10*s, fontweight='bold')


def draw_battery(ax, x, y, scale=1.0):
    """Draw battery icon"""
    s = scale
    # Main battery body
    rect = Rectangle((x-0.3*s, y-0.4*s), 0.6*s, 0.8*s, 
                      fill=False, edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    
    # Battery terminal
    rect_top = Rectangle((x-0.1*s, y+0.4*s), 0.2*s, 0.1*s, 
                          fill=True, facecolor='black', edgecolor='black')
    ax.add_patch(rect_top)
    
    # Battery level lines
    for i in range(3):
        y_line = y - 0.2*s + i*0.25*s
        ax.plot([x-0.2*s, x+0.2*s], [y_line, y_line], 'k-', linewidth=1)


def draw_connection_line(ax, x1, y1, x2, y2, style='solid'):
    """Draw connection line between components"""
    if style == 'solid':
        ax.plot([x1, x2], [y1, y2], 'k-', linewidth=2)
    elif style == 'dashed':
        ax.plot([x1, x2], [y1, y2], 'k--', linewidth=2)


def draw_zigzag_line(ax, x1, y1, x2, y2, n_zigs=3):
    """Draw zigzag/wave line for AC representation"""
    x = np.linspace(x1, x2, 50)
    amplitude = 0.05
    y = y1 + amplitude * np.sin(np.linspace(0, n_zigs*2*np.pi, 50))
    ax.plot(x, y, 'k-', linewidth=2)


# ============================================================================
# DESIGN 1: Classic Topology View (Based on reference)
# ============================================================================
def create_topology_view():
    """Create classic PCS topology view similar to reference images"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('white')
    
    # Header bar
    header = FancyBboxPatch((0, 9.2), 16, 0.8, boxstyle="square,pad=0",
                             facecolor=COLORS['header_green'], edgecolor='none')
    ax.add_patch(header)
    
    # Header title
    ax.text(8, 9.6, 'PCS Topology Monitor', ha='center', va='center', 
            fontsize=18, fontweight='bold', color='white')
    
    # Navigation tabs
    tabs = ['Data Monitor', 'Parameter Config', 'File Manage', 'Device Manage']
    for i, tab in enumerate(tabs):
        ax.text(3 + i*3, 9.6, tab, ha='center', va='center', 
                fontsize=11, color='white')
    
    # Main content area background
    main_bg = Rectangle((0.3, 3.5), 11.5, 5.5, facecolor=COLORS['bg_light_gray'], 
                         edgecolor=COLORS['bg_dark_gray'], linewidth=1)
    ax.add_patch(main_bg)
    
    # Topology title
    ax.text(0.5, 8.8, 'Topology View', ha='left', va='center', 
            fontsize=14, fontweight='bold', color=COLORS['text_black'])
    
    # Draw topology elements
    # Grid Tower (left)
    draw_grid_tower(ax, 2, 6.5, scale=1.2)
    
    # Grid data labels (left side)
    grid_data = [
        ('Grid Vab', '380.5', 'Vrms'),
        ('Grid Vbc', '381.2', 'Vrms'),
        ('Grid Power', '125.8', 'kW'),
        ('Phase A Current', '186.2', 'Arms'),
        ('Phase B Current', '185.7', 'Arms'),
        ('Phase C Current', '186.0', 'Arms'),
    ]
    for i, (label, value, unit) in enumerate(grid_data):
        y_pos = 8.0 - i*0.45
        ax.text(0.5, y_pos, label, ha='left', va='center', fontsize=9, color=COLORS['text_black'])
        ax.text(2.2, y_pos, value, ha='right', va='center', fontsize=9, color=COLORS['text_blue'], fontweight='bold')
        ax.text(2.3, y_pos, unit, ha='left', va='center', fontsize=8, color=COLORS['text_black'])
    
    # Connection line from grid to PCS (zigzag for AC)
    draw_zigzag_line(ax, 2.7, 6.5, 4.5, 6.5, n_zigs=4)
    
    # PCS Module (center)
    draw_pcs_module(ax, 5.5, 6.5, scale=1.5)
    ax.text(5.5, 5.7, 'PCS', ha='center', va='center', fontsize=12, fontweight='bold')
    
    # DC bus data (above PCS)
    dc_data = [
        ('DC Bus Voltage', '750.2', 'V'),
        ('DC Bus Current', '167.4', 'A'),
        ('DC Side Power', '125.5', 'kW'),
    ]
    for i, (label, value, unit) in enumerate(dc_data):
        ax.text(4.8 + i*1.8, 8.2, label, ha='center', va='center', fontsize=8, color=COLORS['text_black'])
        ax.text(4.8 + i*1.8, 7.9, f'{value} {unit}', ha='center', va='center', fontsize=9, color=COLORS['text_blue'], fontweight='bold')
    
    # Connection line from PCS to Relay
    draw_connection_line(ax, 6.4, 6.5, 7.8, 6.5)
    
    # Relay Module
    draw_relay_module(ax, 8.3, 6.5, scale=1.2, label='R')
    
    # DC P-O and O-N voltages
    ax.text(7.0, 5.3, 'DC P-O Bus', ha='center', va='center', fontsize=8)
    ax.text(7.0, 5.0, '375.1 V', ha='center', va='center', fontsize=9, color=COLORS['text_blue'], fontweight='bold')
    ax.text(8.5, 5.3, 'DC O-N Bus', ha='center', va='center', fontsize=8)
    ax.text(8.5, 5.0, '375.1 V', ha='center', va='center', fontsize=9, color=COLORS['text_blue'], fontweight='bold')
    
    # Connection line from Relay to Battery
    draw_connection_line(ax, 8.8, 6.5, 10.5, 6.5)
    
    # Battery (right)
    draw_battery(ax, 11, 6.5, scale=1.2)
    
    # Battery side data
    ax.text(11.3, 8.0, 'Battery Side', ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(11.3, 7.6, 'Input Voltage', ha='center', va='center', fontsize=9)
    ax.text(11.3, 7.3, '748.5 V', ha='center', va='center', fontsize=10, color=COLORS['text_blue'], fontweight='bold')
    
    # Tab bar at bottom of topology
    tab_bar = Rectangle((0.3, 3.5), 11.5, 0.5, facecolor=COLORS['bg_dark_gray'], 
                         edgecolor=COLORS['bg_dark_gray'], linewidth=1)
    ax.add_patch(tab_bar)
    
    bottom_tabs = ['Topology', 'Real-time Data', 'Waveform', 'Records']
    tab_colors = [COLORS['header_green'], COLORS['bg_dark_gray'], COLORS['bg_dark_gray'], COLORS['bg_dark_gray']]
    for i, (tab, color) in enumerate(zip(bottom_tabs, tab_colors)):
        tab_bg = Rectangle((0.3 + i*2.8, 3.5), 2.7, 0.5, facecolor=color)
        ax.add_patch(tab_bg)
        text_color = 'white' if color == COLORS['header_green'] else COLORS['text_black']
        ax.text(1.65 + i*2.8, 3.75, tab, ha='center', va='center', fontsize=10, color=text_color)
    
    # Fault log area
    log_bg = Rectangle((0.3, 0.5), 11.5, 2.8, facecolor='white', 
                        edgecolor=COLORS['bg_dark_gray'], linewidth=1)
    ax.add_patch(log_bg)
    ax.text(0.5, 3.1, 'Real-time Faults', ha='left', va='center', fontsize=11, fontweight='bold')
    
    # Log header
    headers = ['#', 'Time', 'Code', 'Level', 'Type', 'Device', 'Description']
    header_x = [0.5, 1.5, 3.5, 4.5, 5.5, 6.5, 8.5]
    for h, x in zip(headers, header_x):
        ax.text(x, 2.85, h, ha='left', va='center', fontsize=9, fontweight='bold')
    
    # Sample log entries
    log_entries = [
        ('1', '2025-04-23 15:24:39', '0353', '15', 'Fault', 'CPU2', 'DC Pre-charge Failed'),
        ('2', '2025-04-23 15:20:11', '0268', '5', 'Fault', 'CPU1', 'ARM Communication Error'),
    ]
    for i, entry in enumerate(log_entries):
        y_pos = 2.5 - i*0.4
        for j, (val, x) in enumerate(zip(entry, header_x)):
            color = COLORS['error_red'] if 'Fault' in entry[4] and j > 0 else COLORS['text_black']
            ax.text(x, y_pos, val, ha='left', va='center', fontsize=8, color=color)
    
    # Right side control panel
    panel_bg = Rectangle((12, 0.5), 3.8, 8.5, facecolor=COLORS['bg_light_gray'], 
                          edgecolor=COLORS['bg_dark_gray'], linewidth=1)
    ax.add_patch(panel_bg)
    ax.text(13.9, 8.8, 'Control Panel', ha='center', va='center', fontsize=12, fontweight='bold')
    
    # Status indicators
    ax.text(12.2, 8.4, 'Grid Status:', ha='left', fontsize=9)
    ax.text(14.8, 8.4, 'Standby', ha='left', fontsize=9, color=COLORS['warning_yellow'], fontweight='bold')
    
    # Control modes
    modes = [
        ('Mode Type', ['Startup', 'Grid-On', 'Off-grid']),
        ('Control Mode', ['Local Manual', 'Local Auto', 'Remote']),
        ('Reactive Mode', ['Device Ctrl', 'No Reactive']),
        ('Active Mode', ['AC Power', 'PRI']),
        ('Run Mode', ['Logic Test', 'Normal']),
    ]
    
    y_start = 7.8
    for i, (mode_name, options) in enumerate(modes):
        y_pos = y_start - i*1.1
        ax.text(12.2, y_pos, mode_name, ha='left', fontsize=9, fontweight='bold')
        for j, opt in enumerate(options):
            btn_x = 12.2 + j*1.8
            btn_color = COLORS['accent_green'] if j == 0 else COLORS['bg_dark_gray']
            btn = FancyBboxPatch((btn_x, y_pos-0.5), 1.6, 0.35, boxstyle="round,pad=0.02",
                                  facecolor=btn_color, edgecolor='gray')
            ax.add_patch(btn)
            text_color = 'white' if j == 0 else COLORS['text_black']
            ax.text(btn_x + 0.8, y_pos-0.32, opt, ha='center', va='center', fontsize=7, color=text_color)
    
    # Parameter settings
    ax.text(12.2, 2.3, 'Parameter Settings', ha='left', fontsize=9, fontweight='bold')
    params = [
        ('AC Power Ref [kW]', '0.00'),
        ('DC Current Ref [A]', '0.00'),
        ('DC Power Ref [kW]', '0.00'),
        ('DC Voltage Ref [V]', '900.00'),
    ]
    for i, (param, val) in enumerate(params):
        y_pos = 1.9 - i*0.35
        ax.text(12.2, y_pos, param, ha='left', fontsize=8)
        ax.text(15.5, y_pos, val, ha='right', fontsize=8, color=COLORS['text_blue'])
    
    # Control buttons
    ax.text(12.2, 0.8, 'Manual Ctrl', ha='left', fontsize=9)
    ax.text(14.2, 0.8, 'Auto Ctrl', ha='left', fontsize=9)
    
    # Ready button
    ready_btn = FancyBboxPatch((14, 0.55), 1.5, 0.4, boxstyle="round,pad=0.02",
                                facecolor=COLORS['accent_green'], edgecolor='gray')
    ax.add_patch(ready_btn)
    ax.text(14.75, 0.75, 'Ready', ha='center', va='center', fontsize=9, color='white', fontweight='bold')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 2: Modern Dashboard View
# ============================================================================
def create_dashboard_view():
    """Create modern dashboard style PCS view"""
    fig = plt.figure(figsize=(16, 10))
    fig.patch.set_facecolor('#1a1a2e')
    
    # Create grid of subplots
    gs = fig.add_gridspec(3, 4, hspace=0.3, wspace=0.3, 
                          left=0.05, right=0.95, top=0.92, bottom=0.05)
    
    # Title
    fig.suptitle('PCS Real-Time Dashboard', fontsize=20, fontweight='bold', 
                 color='white', y=0.97)
    
    # Card colors
    card_bg = '#16213e'
    card_border = '#0f3460'
    
    def create_card(ax, title, value, unit, icon_text='', color='#00ff88'):
        ax.set_facecolor(card_bg)
        for spine in ax.spines.values():
            spine.set_color(card_border)
            spine.set_linewidth(2)
        
        ax.text(0.5, 0.85, title, ha='center', va='center', transform=ax.transAxes,
                fontsize=12, color='#888888')
        ax.text(0.5, 0.45, value, ha='center', va='center', transform=ax.transAxes,
                fontsize=28, fontweight='bold', color=color)
        ax.text(0.5, 0.15, unit, ha='center', va='center', transform=ax.transAxes,
                fontsize=14, color='#666666')
        ax.set_xticks([])
        ax.set_yticks([])
    
    # Row 1: Main metrics
    ax1 = fig.add_subplot(gs[0, 0])
    create_card(ax1, 'AC Power', '125.8', 'kW', color='#00ff88')
    
    ax2 = fig.add_subplot(gs[0, 1])
    create_card(ax2, 'DC Power', '124.5', 'kW', color='#00d4ff')
    
    ax3 = fig.add_subplot(gs[0, 2])
    create_card(ax3, 'DC Voltage', '750.2', 'V', color='#ffd700')
    
    ax4 = fig.add_subplot(gs[0, 3])
    create_card(ax4, 'Efficiency', '98.9', '%', color='#ff6b6b')
    
    # Row 2: Phase currents and voltages
    ax5 = fig.add_subplot(gs[1, 0:2])
    ax5.set_facecolor(card_bg)
    for spine in ax5.spines.values():
        spine.set_color(card_border)
        spine.set_linewidth(2)
    
    phases = ['Phase A', 'Phase B', 'Phase C']
    currents = [186.2, 185.7, 186.0]
    voltages = [220.1, 220.3, 219.8]
    
    x = np.arange(len(phases))
    width = 0.35
    
    bars1 = ax5.bar(x - width/2, currents, width, label='Current (A)', color='#00ff88', alpha=0.8)
    ax5_twin = ax5.twinx()
    bars2 = ax5_twin.bar(x + width/2, voltages, width, label='Voltage (V)', color='#00d4ff', alpha=0.8)
    
    ax5.set_ylabel('Current (A)', color='#00ff88')
    ax5_twin.set_ylabel('Voltage (V)', color='#00d4ff')
    ax5.set_xticks(x)
    ax5.set_xticklabels(phases, color='white')
    ax5.tick_params(colors='#888888')
    ax5_twin.tick_params(colors='#888888')
    ax5.set_title('Three-Phase AC Parameters', color='white', fontsize=12, pad=10)
    ax5.set_facecolor(card_bg)
    
    # Row 2 right: Status indicators
    ax6 = fig.add_subplot(gs[1, 2:4])
    ax6.set_facecolor(card_bg)
    for spine in ax6.spines.values():
        spine.set_color(card_border)
        spine.set_linewidth(2)
    
    statuses = [
        ('Grid Connection', 'Connected', '#00ff88'),
        ('PCS Status', 'Running', '#00ff88'),
        ('Battery Status', 'Charging', '#00d4ff'),
        ('System Mode', 'Auto', '#ffd700'),
        ('Communication', 'Normal', '#00ff88'),
    ]
    
    for i, (name, status, color) in enumerate(statuses):
        y_pos = 0.85 - i*0.18
        ax6.text(0.05, y_pos, name, ha='left', va='center', transform=ax6.transAxes,
                fontsize=11, color='#888888')
        ax6.text(0.95, y_pos, status, ha='right', va='center', transform=ax6.transAxes,
                fontsize=11, fontweight='bold', color=color)
        # Status dot
        circle = Circle((0.88, y_pos), 0.02, transform=ax6.transAxes, 
                        facecolor=color, edgecolor='none')
        ax6.add_patch(circle)
    
    ax6.set_xticks([])
    ax6.set_yticks([])
    ax6.set_title('System Status', color='white', fontsize=12, pad=10)
    
    # Row 3: Power trend chart
    ax7 = fig.add_subplot(gs[2, :])
    ax7.set_facecolor(card_bg)
    for spine in ax7.spines.values():
        spine.set_color(card_border)
        spine.set_linewidth(2)
    
    # Generate sample trend data
    t = np.linspace(0, 60, 120)
    ac_power = 125 + 5*np.sin(t/10) + np.random.randn(120)*2
    dc_power = 124 + 5*np.sin(t/10 + 0.5) + np.random.randn(120)*2
    
    ax7.plot(t, ac_power, color='#00ff88', linewidth=2, label='AC Power (kW)')
    ax7.plot(t, dc_power, color='#00d4ff', linewidth=2, label='DC Power (kW)')
    ax7.fill_between(t, ac_power, alpha=0.2, color='#00ff88')
    ax7.fill_between(t, dc_power, alpha=0.2, color='#00d4ff')
    
    ax7.set_xlabel('Time (minutes)', color='#888888')
    ax7.set_ylabel('Power (kW)', color='#888888')
    ax7.set_title('Power Trend (Last 60 Minutes)', color='white', fontsize=12, pad=10)
    ax7.legend(loc='upper right', facecolor=card_bg, edgecolor=card_border, 
               labelcolor='white')
    ax7.tick_params(colors='#888888')
    ax7.grid(True, alpha=0.2, color='#888888')
    
    return fig


# ============================================================================
# DESIGN 3: Energy Flow Visualization
# ============================================================================
def create_energy_flow_view():
    """Create energy flow diagram with animated-style arrows"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('#0a0a1a')
    ax.set_facecolor('#0a0a1a')
    
    # Title
    ax.text(8, 9.5, 'PCS Energy Flow Monitor', ha='center', va='center',
            fontsize=22, fontweight='bold', color='white')
    
    # Grid section (left)
    grid_box = FancyBboxPatch((0.5, 3), 3, 4, boxstyle="round,pad=0.1",
                               facecolor='#1a3a5c', edgecolor='#00d4ff', linewidth=3)
    ax.add_patch(grid_box)
    ax.text(2, 6.5, 'GRID', ha='center', va='center', fontsize=16, 
            fontweight='bold', color='white')
    
    # Grid data
    grid_info = [
        ('Voltage', '380 V'),
        ('Frequency', '50.0 Hz'),
        ('Power Factor', '0.98'),
        ('Active Power', '125.8 kW'),
        ('Reactive Power', '12.5 kVar'),
    ]
    for i, (label, value) in enumerate(grid_info):
        ax.text(2, 5.8 - i*0.6, f'{label}: {value}', ha='center', va='center',
                fontsize=10, color='#00d4ff')
    
    # PCS section (center)
    pcs_box = FancyBboxPatch((6, 3), 4, 4, boxstyle="round,pad=0.1",
                              facecolor='#3a2a1a', edgecolor='#ffd700', linewidth=3)
    ax.add_patch(pcs_box)
    ax.text(8, 6.5, 'PCS', ha='center', va='center', fontsize=16, 
            fontweight='bold', color='white')
    
    # PCS data
    pcs_info = [
        ('AC Side', '125.8 kW'),
        ('DC Side', '124.5 kW'),
        ('Efficiency', '98.9%'),
        ('Temperature', '45.2 C'),
        ('Status', 'Running'),
    ]
    for i, (label, value) in enumerate(pcs_info):
        color = '#00ff88' if 'Running' in value else '#ffd700'
        ax.text(8, 5.8 - i*0.6, f'{label}: {value}', ha='center', va='center',
                fontsize=10, color=color)
    
    # Battery section (right)
    batt_box = FancyBboxPatch((12, 3), 3, 4, boxstyle="round,pad=0.1",
                               facecolor='#1a3a2a', edgecolor='#00ff88', linewidth=3)
    ax.add_patch(batt_box)
    ax.text(13.5, 6.5, 'BATTERY', ha='center', va='center', fontsize=16, 
            fontweight='bold', color='white')
    
    # Battery data
    batt_info = [
        ('Voltage', '750.2 V'),
        ('Current', '166.0 A'),
        ('SOC', '75.5%'),
        ('SOH', '98.2%'),
        ('Temperature', '32.1 C'),
    ]
    for i, (label, value) in enumerate(batt_info):
        ax.text(13.5, 5.8 - i*0.6, f'{label}: {value}', ha='center', va='center',
                fontsize=10, color='#00ff88')
    
    # Energy flow arrows (Grid to PCS)
    for i in range(3):
        arrow = FancyArrowPatch((3.7, 4.5 + i*0.5), (5.8, 4.5 + i*0.5),
                                arrowstyle='->', mutation_scale=20,
                                color='#00d4ff', linewidth=3, alpha=0.8-i*0.2)
        ax.add_patch(arrow)
    
    # Energy flow arrows (PCS to Battery) - bidirectional
    for i in range(3):
        arrow_right = FancyArrowPatch((10.2, 4.8 + i*0.4), (11.8, 4.8 + i*0.4),
                                       arrowstyle='->', mutation_scale=20,
                                       color='#00ff88', linewidth=3, alpha=0.8-i*0.2)
        ax.add_patch(arrow_right)
    
    # Power values on arrows
    ax.text(4.75, 5.8, '125.8 kW', ha='center', va='center', fontsize=12,
            fontweight='bold', color='#00d4ff',
            bbox=dict(boxstyle='round', facecolor='#0a0a1a', edgecolor='#00d4ff'))
    
    ax.text(11, 5.8, '124.5 kW', ha='center', va='center', fontsize=12,
            fontweight='bold', color='#00ff88',
            bbox=dict(boxstyle='round', facecolor='#0a0a1a', edgecolor='#00ff88'))
    
    # Mode indicator
    mode_box = FancyBboxPatch((6.5, 0.5), 3, 1.5, boxstyle="round,pad=0.1",
                               facecolor='#2a2a4a', edgecolor='#888888', linewidth=2)
    ax.add_patch(mode_box)
    ax.text(8, 1.6, 'Current Mode', ha='center', va='center', fontsize=10, color='#888888')
    ax.text(8, 1.1, 'CHARGING', ha='center', va='center', fontsize=14, 
            fontweight='bold', color='#00ff88')
    
    # Bottom stats
    stats = [
        ('Today Energy In', '1,245.6 kWh', 0.5),
        ('Today Energy Out', '1,189.2 kWh', 5),
        ('Total Cycles', '1,847', 10.5),
        ('Running Hours', '12,456 h', 13.5),
    ]
    for label, value, x in stats:
        ax.text(x, 0.3, label, ha='left', va='center', fontsize=9, color='#666666')
        ax.text(x + 1.8, 0.3, value, ha='left', va='center', fontsize=10, 
                fontweight='bold', color='white')
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 4: Control Panel View
# ============================================================================
def create_control_panel_view():
    """Create detailed control panel view"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('#f0f4f8')
    
    # Header
    header = Rectangle((0, 9), 16, 1, facecolor=COLORS['header_green'])
    ax.add_patch(header)
    ax.text(8, 9.5, 'PCS Control & Parameter Center', ha='center', va='center',
            fontsize=18, fontweight='bold', color='white')
    
    # Left panel - System Status
    status_panel = FancyBboxPatch((0.3, 5), 5, 3.7, boxstyle="round,pad=0.05",
                                   facecolor='white', edgecolor='#cccccc', linewidth=2)
    ax.add_patch(status_panel)
    ax.text(2.8, 8.5, 'System Status', ha='center', va='center',
            fontsize=14, fontweight='bold', color=COLORS['text_black'])
    
    status_items = [
        ('PCS State', 'Running', '#00aa00'),
        ('Grid Connection', 'Connected', '#00aa00'),
        ('DC Contactor', 'Closed', '#00aa00'),
        ('AC Contactor', 'Closed', '#00aa00'),
        ('Pre-charge', 'Complete', '#00aa00'),
        ('Fault Status', 'Normal', '#00aa00'),
    ]
    
    for i, (name, state, color) in enumerate(status_items):
        y = 8.0 - i*0.5
        ax.text(0.5, y, name + ':', ha='left', fontsize=10, color=COLORS['text_black'])
        
        # Status indicator
        indicator = Circle((4.2, y), 0.12, facecolor=color, edgecolor='none')
        ax.add_patch(indicator)
        ax.text(4.5, y, state, ha='left', fontsize=10, color=color, fontweight='bold')
    
    # Center panel - Mode Selection
    mode_panel = FancyBboxPatch((5.5, 5), 5, 3.7, boxstyle="round,pad=0.05",
                                 facecolor='white', edgecolor='#cccccc', linewidth=2)
    ax.add_patch(mode_panel)
    ax.text(8, 8.5, 'Operation Mode', ha='center', va='center',
            fontsize=14, fontweight='bold', color=COLORS['text_black'])
    
    modes = [
        ('Startup Mode', ['Manual', 'Auto', 'Remote']),
        ('Power Mode', ['PQ', 'VF', 'Droop']),
        ('Control Mode', ['Local', 'Remote', 'EMS']),
    ]
    
    for i, (mode_name, options) in enumerate(modes):
        y = 7.8 - i*0.9
        ax.text(5.7, y, mode_name, ha='left', fontsize=10, fontweight='bold')
        for j, opt in enumerate(options):
            btn_x = 5.7 + j*1.5
            is_selected = j == 0
            btn_color = COLORS['accent_green'] if is_selected else '#e0e0e0'
            text_color = 'white' if is_selected else COLORS['text_black']
            btn = FancyBboxPatch((btn_x, y-0.55), 1.4, 0.4, boxstyle="round,pad=0.02",
                                  facecolor=btn_color, edgecolor='#888888')
            ax.add_patch(btn)
            ax.text(btn_x + 0.7, y-0.35, opt, ha='center', va='center', 
                    fontsize=9, color=text_color)
    
    # Right panel - Quick Actions
    action_panel = FancyBboxPatch((10.7, 5), 5, 3.7, boxstyle="round,pad=0.05",
                                   facecolor='white', edgecolor='#cccccc', linewidth=2)
    ax.add_patch(action_panel)
    ax.text(13.2, 8.5, 'Quick Actions', ha='center', va='center',
            fontsize=14, fontweight='bold', color=COLORS['text_black'])
    
    actions = [
        ('START', '#00aa00', 8.0),
        ('STOP', '#ff4444', 7.3),
        ('RESET', '#ff8800', 6.6),
        ('EMERGENCY', '#ff0000', 5.9),
    ]
    
    for name, color, y in actions:
        btn = FancyBboxPatch((11, y-0.3), 4.4, 0.5, boxstyle="round,pad=0.02",
                              facecolor=color, edgecolor='#666666', linewidth=2)
        ax.add_patch(btn)
        ax.text(13.2, y-0.05, name, ha='center', va='center',
                fontsize=12, fontweight='bold', color='white')
    
    # Bottom panel - Parameter Settings
    param_panel = FancyBboxPatch((0.3, 0.3), 15.4, 4.5, boxstyle="round,pad=0.05",
                                  facecolor='white', edgecolor='#cccccc', linewidth=2)
    ax.add_patch(param_panel)
    ax.text(8, 4.5, 'Parameter Settings', ha='center', va='center',
            fontsize=14, fontweight='bold', color=COLORS['text_black'])
    
    # Parameter groups
    param_groups = [
        ('Power Control', [
            ('Active Power Setpoint', '100.0', 'kW'),
            ('Reactive Power Setpoint', '0.0', 'kVar'),
            ('Power Factor Setpoint', '1.00', ''),
            ('Power Ramp Rate', '10.0', 'kW/s'),
        ]),
        ('Voltage Control', [
            ('DC Voltage Setpoint', '750.0', 'V'),
            ('DC Voltage Upper Limit', '850.0', 'V'),
            ('DC Voltage Lower Limit', '600.0', 'V'),
            ('AC Voltage Setpoint', '380.0', 'V'),
        ]),
        ('Protection', [
            ('OV Trip Point', '880.0', 'V'),
            ('UV Trip Point', '580.0', 'V'),
            ('OC Trip Point', '250.0', 'A'),
            ('OT Trip Point', '85.0', 'C'),
        ]),
    ]
    
    for i, (group_name, params) in enumerate(param_groups):
        x_base = 0.5 + i*5.2
        ax.text(x_base + 2.3, 4.0, group_name, ha='center', va='center',
                fontsize=11, fontweight='bold', color=COLORS['header_green'])
        
        for j, (param, value, unit) in enumerate(params):
            y = 3.5 - j*0.7
            ax.text(x_base, y, param, ha='left', fontsize=9, color=COLORS['text_black'])
            
            # Value input box
            input_box = FancyBboxPatch((x_base + 3, y-0.2), 1.2, 0.35, 
                                        boxstyle="round,pad=0.02",
                                        facecolor='#f8f8f8', edgecolor='#cccccc')
            ax.add_patch(input_box)
            ax.text(x_base + 3.6, y-0.02, value, ha='center', va='center',
                    fontsize=9, color=COLORS['text_blue'])
            ax.text(x_base + 4.3, y-0.02, unit, ha='left', fontsize=8, 
                    color=COLORS['text_black'])
    
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return fig


# ============================================================================
# DESIGN 5: Simplified Clean Topology
# ============================================================================
def create_clean_topology():
    """Create a clean, simplified topology view"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('#fafafa')
    
    # Subtle header
    header = Rectangle((0, 9.3), 16, 0.7, facecolor='#2c3e50')
    ax.add_patch(header)
    ax.text(0.5, 9.65, 'PCS Topology', ha='left', va='center',
            fontsize=16, fontweight='bold', color='white')
    
    # Main topology area
    topo_area = FancyBboxPatch((0.5, 4), 15, 5, boxstyle="round,pad=0.05",
                                facecolor='white', edgecolor='#e0e0e0', linewidth=2)
    ax.add_patch(topo_area)
    
    # Grid icon (simplified)
    grid_circle = Circle((2.5, 6.5), 0.8, facecolor='#3498db', edgecolor='#2980b9', linewidth=3)
    ax.add_patch(grid_circle)
    ax.text(2.5, 6.5, 'GRID', ha='center', va='center', fontsize=10, 
            fontweight='bold', color='white')
    
    # Grid data card
    grid_card = FancyBboxPatch((1, 4.5), 3, 1.5, boxstyle="round,pad=0.05",
                                facecolor='#ecf0f1', edgecolor='#bdc3c7', linewidth=1)
    ax.add_patch(grid_card)
    ax.text(2.5, 5.7, 'Vab: 380.5 V', ha='center', fontsize=9, color='#2c3e50')
    ax.text(2.5, 5.3, 'P: 125.8 kW', ha='center', fontsize=9, color='#2c3e50')
    ax.text(2.5, 4.9, 'Q: 12.5 kVar', ha='center', fontsize=9, color='#2c3e50')
    
    # Connection line 1
    ax.annotate('', xy=(5.2, 6.5), xytext=(3.5, 6.5),
                arrowprops=dict(arrowstyle='->', color='#3498db', lw=3))
    ax.text(4.35, 6.9, 'AC', ha='center', fontsize=10, color='#3498db', fontweight='bold')
    
    # PCS icon
    pcs_rect = FancyBboxPatch((5.5, 5.7), 2.5, 1.6, boxstyle="round,pad=0.1",
                               facecolor='#e74c3c', edgecolor='#c0392b', linewidth=3)
    ax.add_patch(pcs_rect)
    ax.text(6.75, 6.5, 'PCS', ha='center', va='center', fontsize=12, 
            fontweight='bold', color='white')
    
    # PCS data card
    pcs_card = FancyBboxPatch((5.25, 4.5), 3, 1, boxstyle="round,pad=0.05",
                               facecolor='#ecf0f1', edgecolor='#bdc3c7', linewidth=1)
    ax.add_patch(pcs_card)
    ax.text(6.75, 5.1, 'Eff: 98.9%', ha='center', fontsize=9, color='#2c3e50')
    ax.text(6.75, 4.7, 'Temp: 45 C', ha='center', fontsize=9, color='#2c3e50')
    
    # Connection line 2
    ax.annotate('', xy=(9.5, 6.5), xytext=(8.2, 6.5),
                arrowprops=dict(arrowstyle='<->', color='#27ae60', lw=3))
    ax.text(8.85, 6.9, 'DC', ha='center', fontsize=10, color='#27ae60', fontweight='bold')
    
    # DC Bus indicator
    dc_bus = Rectangle((9.7, 5.5), 0.3, 2, facecolor='#f39c12', edgecolor='#e67e22', linewidth=2)
    ax.add_patch(dc_bus)
    ax.text(9.85, 7.7, 'DC BUS', ha='center', fontsize=8, color='#e67e22', fontweight='bold')
    ax.text(9.85, 5.2, '750V', ha='center', fontsize=9, color='#e67e22', fontweight='bold')
    
    # Connection line 3
    ax.annotate('', xy=(12.2, 6.5), xytext=(10.2, 6.5),
                arrowprops=dict(arrowstyle='<->', color='#27ae60', lw=3))
    
    # Battery icon
    batt_rect = FancyBboxPatch((12.5, 5.5), 2.5, 2, boxstyle="round,pad=0.1",
                                facecolor='#27ae60', edgecolor='#1e8449', linewidth=3)
    ax.add_patch(batt_rect)
    # Battery terminal
    batt_term = Rectangle((13.35, 7.5), 0.8, 0.2, facecolor='#1e8449')
    ax.add_patch(batt_term)
    ax.text(13.75, 6.5, 'BATT', ha='center', va='center', fontsize=12, 
            fontweight='bold', color='white')
    
    # Battery data card
    batt_card = FancyBboxPatch((12, 4.5), 3, 1.5, boxstyle="round,pad=0.05",
                                facecolor='#ecf0f1', edgecolor='#bdc3c7', linewidth=1)
    ax.add_patch(batt_card)
    ax.text(13.5, 5.7, 'V: 748.5 V', ha='center', fontsize=9, color='#2c3e50')
    ax.text(13.5, 5.3, 'I: 166.0 A', ha='center', fontsize=9, color='#2c3e50')
    ax.text(13.5, 4.9, 'SOC: 75.5%', ha='center', fontsize=9, color='#2c3e50')
    
    # Top status bar
    status_bar = FancyBboxPatch((0.5, 8.3), 15, 0.8, boxstyle="round,pad=0.05",
                                 facecolor='#ecf0f1', edgecolor='#bdc3c7', linewidth=1)
    ax.add_patch(status_bar)
    
    statuses = [
        ('System', 'Running', '#27ae60'),
        ('Mode', 'Auto', '#3498db'),
        ('Direction', 'Charging', '#f39c12'),
        ('Grid', 'Connected', '#27ae60'),
    ]
    
    for i, (label, value, color) in enumerate(statuses):
        x = 1.5 + i*3.8
        ax.text(x, 8.7, f'{label}: ', ha='left', fontsize=10, color='#7f8c8d')
        ax.text(x + 1.5, 8.7, value, ha='left', fontsize=10, fontweight='bold', color=color)
    
    # Bottom data panel
    data_panel = FancyBboxPatch((0.5, 0.3), 15, 3.5, boxstyle="round,pad=0.05",
                                 facecolor='white', edgecolor='#e0e0e0', linewidth=2)
    ax.add_patch(data_panel)
    
    # Tab buttons
    tabs = ['Topology', 'Real-time Data', 'Waveform', 'Records', 'Config']
    for i, tab in enumerate(tabs):
        is_selected = i == 0
        btn_color = '#2c3e50' if is_selected else '#ecf0f1'
        text_color = 'white' if is_selected else '#7f8c8d'
        btn = FancyBboxPatch((0.5 + i*3, 3.5), 2.9, 0.5, boxstyle="round,pad=0.02",
                              facecolor=btn_color, edgecolor='#bdc3c7')
        ax.add_patch(btn)
        ax.text(1.95 + i*3, 3.75, tab, ha='center', va='center', fontsize=9, color=text_color)
    
    # Data table header
    headers = ['Parameter', 'Value', 'Unit', 'Parameter', 'Value', 'Unit']
    header_x = [0.7, 2.5, 3.5, 8.2, 10, 11]
    for h, x in zip(headers, header_x):
        ax.text(x, 3.0, h, ha='left', fontsize=9, fontweight='bold', color='#2c3e50')
    
    # Data rows
    left_data = [
        ('Grid Vab', '380.5', 'V'),
        ('Grid Vbc', '381.2', 'V'),
        ('Grid Vca', '380.8', 'V'),
        ('Grid Frequency', '50.02', 'Hz'),
        ('Phase A Current', '186.2', 'A'),
        ('Phase B Current', '185.7', 'A'),
    ]
    
    right_data = [
        ('DC Bus Voltage', '750.2', 'V'),
        ('DC Bus Current', '167.4', 'A'),
        ('DC Power', '125.5', 'kW'),
        ('Battery Voltage', '748.5', 'V'),
        ('Battery Current', '166.0', 'A'),
        ('Battery SOC', '75.5', '%'),
    ]
    
    for i, (param, val, unit) in enumerate(left_data):
        y = 2.6 - i*0.35
        ax.text(0.7, y, param, ha='left', fontsize=8, color='#34495e')
        ax.text(2.5, y, val, ha='left', fontsize=8, color='#3498db', fontweight='bold')
        ax.text(3.5, y, unit, ha='left', fontsize=8, color='#7f8c8d')
    
    for i, (param, val, unit) in enumerate(right_data):
        y = 2.6 - i*0.35
        ax.text(8.2, y, param, ha='left', fontsize=8, color='#34495e')
        ax.text(10, y, val, ha='left', fontsize=8, color='#27ae60', fontweight='bold')
        ax.text(11, y, unit, ha='left', fontsize=8, color='#7f8c8d')
    
    # Right side quick info
    info_panel = FancyBboxPatch((12.5, 0.5), 2.8, 2.7, boxstyle="round,pad=0.05",
                                 facecolor='#ecf0f1', edgecolor='#bdc3c7', linewidth=1)
    ax.add_patch(info_panel)
    ax.text(13.9, 3.0, 'Quick Info', ha='center', fontsize=10, fontweight='bold', color='#2c3e50')
    
    quick_info = [
        ('Today In', '1,245 kWh'),
        ('Today Out', '1,189 kWh'),
        ('Runtime', '12,456 h'),
        ('Cycles', '1,847'),
    ]
    for i, (label, value) in enumerate(quick_info):
        y = 2.5 - i*0.5
        ax.text(12.7, y, label, ha='left', fontsize=8, color='#7f8c8d')
        ax.text(15, y, value, ha='right', fontsize=8, color='#2c3e50', fontweight='bold')
    
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
    output_dir = '/workspace/designs/pcs_v2'
    
    designs = [
        ('pcs_topology_classic', create_topology_view, 'Classic Topology View'),
        ('pcs_dashboard_modern', create_dashboard_view, 'Modern Dashboard'),
        ('pcs_energy_flow', create_energy_flow_view, 'Energy Flow Diagram'),
        ('pcs_control_panel', create_control_panel_view, 'Control Panel'),
        ('pcs_topology_clean', create_clean_topology, 'Clean Topology'),
    ]
    
    for filename, create_func, desc in designs:
        print(f'Creating {desc}...')
        fig = create_func()
        
        # Save as PNG
        png_path = f'{output_dir}/{filename}.png'
        fig.savefig(png_path, dpi=150, bbox_inches='tight', 
                    facecolor=fig.get_facecolor(), edgecolor='none')
        print(f'  Saved: {png_path}')
        
        # Save as SVG
        svg_path = f'{output_dir}/{filename}.svg'
        fig.savefig(svg_path, format='svg', bbox_inches='tight',
                    facecolor=fig.get_facecolor(), edgecolor='none')
        print(f'  Saved: {svg_path}')
        
        plt.close(fig)
    
    print('\nAll designs generated successfully!')
    print(f'Output directory: {output_dir}')


if __name__ == '__main__':
    main()
