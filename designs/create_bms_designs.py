#!/usr/bin/env python3
"""
BMS Design Generator
Generate BMS visualization designs based on reference screenshots
Supports both Level 2 (Cluster-Pack-Cell) and Level 3 (Stack-Cluster-Pack-Cell) architectures
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os

# Canvas dimensions
WIDTH, HEIGHT = 1920, 1080

# Color scheme (based on reference screenshots)
COLORS = {
    "bg": "#F5F5F5",           # Light gray background
    "tab": "#E0E0E0",          # Inactive tab
    "tab_active": "#2E7D32",   # Active tab (green)
    "text": "#212121",         # Main text
    "muted": "#757575",        # Secondary text
    "line": "#BDBDBD",         # Divider lines
    "card_bg": "#FFFFFF",      # Card background
    "chip_ok": "#4CAF50",      # OK status (green)
    "chip_warn": "#FF9800",    # Warning (orange)
    "chip_error": "#F44336",   # Error (red)
    "chip_info": "#2196F3",    # Info (blue)
    "accent": "#1976D2",       # Accent blue
    "accent_2": "#7B1FA2",     # Accent purple
    "breaker_closed": "#4CAF50",  # Breaker closed (green)
    "breaker_open": "#F44336",    # Breaker open (red)
}

# Font sizes
FONT_SIZES = {
    "title": 48,
    "subtitle": 24,
    "heading": 32,
    "body": 20,
    "small": 18,
    "tiny": 14,
}

OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Try to find a suitable font
def get_font(size):
    """Get font with fallback options"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "arial.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    return ImageFont.load_default()

fonts = {k: get_font(v) for k, v in FONT_SIZES.items()}


def canvas():
    """Create a new canvas"""
    img = Image.new("RGB", (WIDTH, HEIGHT), color=COLORS["bg"])
    return img, ImageDraw.Draw(img)


def draw_tabs(draw, tabs, active_idx=0):
    """Draw tab navigation bar"""
    x = 40
    y = 20
    tab_height = 50
    
    for idx, tab in enumerate(tabs):
        is_active = idx == active_idx
        label_width = draw.textlength(tab, font=fonts["body"])
        w = label_width + 40
        
        fill = COLORS["tab_active"] if is_active else COLORS["tab"]
        text_color = "#FFFFFF" if is_active else COLORS["text"]
        
        # Draw tab
        draw.rounded_rectangle((x, y, x + w, y + tab_height), radius=8, fill=fill)
        draw.text((x + 20, y + 15), tab, font=fonts["body"], fill=text_color)
        
        x += w + 10


def draw_title(draw, main_title, subtitle=""):
    """Draw page title"""
    y = 90
    draw.text((40, y), main_title, font=fonts["title"], fill=COLORS["text"])
    if subtitle:
        draw.text((40, y + 60), subtitle, font=fonts["subtitle"], fill=COLORS["muted"])
        draw.line((40, y + 100, WIDTH - 40, y + 100), fill=COLORS["line"], width=2)


def draw_metric_card(draw, x, y, label, value, unit="", width=200, height=100):
    """Draw a metric card"""
    # Card background
    draw.rounded_rectangle((x, y, x + width, y + height), radius=8, fill=COLORS["card_bg"])
    
    # Label
    draw.text((x + 10, y + 10), label, font=fonts["small"], fill=COLORS["muted"])
    
    # Value
    value_text = f"{value} {unit}".strip()
    text_width = draw.textlength(value_text, font=fonts["heading"])
    draw.text((x + (width - text_width) / 2, y + 40), value_text, font=fonts["heading"], fill=COLORS["text"])


def draw_status_chip(draw, x, y, text, status="ok"):
    """Draw a status chip"""
    label_width = draw.textlength(text, font=fonts["small"])
    w = label_width + 20
    h = 32
    
    color_map = {
        "ok": COLORS["chip_ok"],
        "warn": COLORS["chip_warn"],
        "error": COLORS["chip_error"],
        "info": COLORS["chip_info"],
    }
    fill = color_map.get(status, COLORS["chip_info"])
    
    draw.rounded_rectangle((x, y, x + w, y + h), radius=16, fill=fill)
    draw.text((x + 10, y + 6), text, font=fonts["small"], fill="#FFFFFF")


def draw_divider(draw, y):
    """Draw a horizontal divider"""
    draw.line((40, y, WIDTH - 40, y), fill=COLORS["line"], width=2)


# ========== Level 3 (Stack-Cluster-Pack-Cell) Designs ==========

def tier3_monitor():
    """Level 3: Stack Monitor Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=1)  # BAU active (Main Monitor)
    
    draw_title(draw, "Stack Monitor", "Level 3 Architecture: Stack → Cluster → Pack → Cell")
    
    y = 200
    
    # Stack overview metrics
    metrics = [
        ("Stack Voltage", "1250.5", "V", 40),
        ("Stack Current", "1320.0", "A", 320),
        ("Power", "1650.6", "kW", 600),
        ("SOC", "12.7", "%", 880),
        ("SOE", "0.0", "%", 1160),
        ("SOH", "93", "%", 1440),
    ]
    
    for label, value, unit, x in metrics:
        draw_metric_card(draw, x, y, label, value, unit, width=240, height=100)
    
    # Breaker status
    draw_status_chip(draw, 1680, y + 30, "Breaker: Open", "error")
    
    y += 130
    draw_divider(draw, y)
    y += 30
    
    # Stack status
    draw.text((40, y), "Stack Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Clusters (parallel branches)
    cluster_info = [
        ("C1", "1250.5V", "110.0A", "OK"),
        ("C2", "1250.3V", "110.0A", "OK"),
        ("C3", "1250.4V", "110.0A", "Warn"),
    ]
    
    cluster_y = y
    for idx, (cid, voltage, current, status) in enumerate(cluster_info):
        x = 40 + idx * 600
        if x + 560 > WIDTH - 40:
            break
        
        # Cluster card
        draw.rounded_rectangle((x, cluster_y, x + 560, cluster_y + 200), radius=8, fill=COLORS["card_bg"])
        draw.text((x + 20, cluster_y + 20), f"Cluster {cid}", font=fonts["heading"], fill=COLORS["text"])
        
        # Cluster metrics
        draw.text((x + 20, cluster_y + 60), f"Voltage: {voltage}", font=fonts["body"], fill=COLORS["text"])
        draw.text((x + 20, cluster_y + 90), f"Current: {current}", font=fonts["body"], fill=COLORS["text"])
        
        # Status
        status_color = COLORS["chip_warn"] if status == "Warn" else COLORS["chip_ok"]
        draw_status_chip(draw, x + 400, cluster_y + 20, status, "warn" if status == "Warn" else "ok")
        
        # Packs in cluster (series connection indicator)
        pack_count = 4
        pack_y = cluster_y + 130
        for i in range(min(4, pack_count)):
            pack_x = x + 20 + i * 120
            if pack_x + 100 > x + 560:
                break
            draw.rounded_rectangle((pack_x, pack_y, pack_x + 100, pack_y + 50), radius=4, fill=COLORS["accent"])
            draw.text((pack_x + 10, pack_y + 15), f"P{i+1}", font=fonts["small"], fill="#FFFFFF")
            if i < pack_count - 1:
                draw.line((pack_x + 100, pack_y + 25, pack_x + 120, pack_y + 25), fill=COLORS["line"], width=2)
    
    y = cluster_y + 250
    draw_divider(draw, y)
    y += 30
    
    # Protection status
    draw.text((40, y), "Protection Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    protections = [
        ("HV Breaker", "Open", "error"),
        ("Insulation", "980kΩ", "ok"),
        ("Overvoltage", "Normal", "ok"),
        ("Undervoltage", "Normal", "ok"),
        ("Overcurrent", "Normal", "ok"),
        ("Temperature", "Normal", "ok"),
    ]
    
    x = 40
    for label, state, status in protections:
        draw_status_chip(draw, x, y, f"{label}: {state}", status)
        x += 280
        if x + 280 > WIDTH - 40:
            x = 40
            y += 50
    
    img.save(OUTPUT_DIR / "tier3_monitor.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_monitor.png'}")


def tier3_key_info():
    """Level 3: Key Information Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=2)  # BCU active
    
    draw_title(draw, "Key Information", "Level 3: Stack Key Parameters")
    
    y = 200
    
    # Key metrics grid
    key_metrics = [
        ("SOC", "12.7", "%", 40),
        ("SOE", "0.0", "%", 320),
        ("SOH", "93", "%", 600),
        ("SOS", "50.0", "%", 880),
        ("Consistency", "91", "%", 1160),
        ("Stack Voltage", "1250.5", "V", 1440),
        ("Stack Current", "1320.0", "A", 40),
        ("Power", "1650.6", "kW", 320),
        ("Max Cell Voltage", "3209", "mV", 600),
        ("Min Cell Voltage", "3200", "mV", 880),
        ("Max Cell Temp", "13.0", "°C", 1160),
        ("Min Cell Temp", "12.8", "°C", 1440),
    ]
    
    row_y = y
    for idx, (label, value, unit, x) in enumerate(key_metrics):
        if idx > 0 and idx % 6 == 0:
            row_y += 120
        draw_metric_card(draw, x, row_y + (idx // 6) * 120, label, value, unit, width=200, height=100)
    
    y = row_y + 240
    draw_divider(draw, y)
    y += 30
    
    # Status words
    draw.text((40, y), "Status Words", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    status_words = [
        ("Status Word 1", "0x0C26", 40),
        ("Status Word 2", "0x029E", 320),
        ("Alarm Word 1", "0x0000", 600),
        ("Alarm Word 2", "0x0001", 880),
        ("Fault Word 1", "0x0400", 1160),
        ("Fault Word 2", "0x0001", 1440),
    ]
    
    for label, value, x in status_words:
        draw.text((x, y), f"{label}:", font=fonts["body"], fill=COLORS["muted"])
        draw.text((x, y + 30), value, font=fonts["heading"], fill=COLORS["text"])
    
    y += 100
    draw_divider(draw, y)
    y += 30
    
    # Alarm status grid
    draw.text((40, y), "Alarm Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    alarms = [
        ("Total Overvoltage", "error"),
        ("Total Undervoltage", "error"),
        ("Insulation Failure", "error"),
        ("SOC High", "ok"),
        ("SOC Low", "ok"),
        ("Cell Overvoltage", "ok"),
        ("Cell Undervoltage", "ok"),
        ("Cell Overtemp", "ok"),
        ("Cell Undertemp", "ok"),
        ("Voltage Diff", "ok"),
        ("Temp Diff", "ok"),
        ("Temp Sensor", "error"),
        ("Voltage Sensor", "error"),
        ("Current Sensor", "error"),
        ("DC Contactor", "error"),
        ("Fuse", "error"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, status) in enumerate(alarms):
        if idx > 0 and idx % 4 == 0:
            x = 40
            row_y += 50
        draw_status_chip(draw, x, row_y, label, status)
        x += 460
    
    y = row_y + 80
    draw_divider(draw, y)
    y += 30
    
    # Control commands
    draw.text((40, y), "Control Commands", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Fault reset button
    draw.rounded_rectangle((40, y, 240, y + 50), radius=8, fill=COLORS["chip_error"])
    draw.text((120, y + 15), "Fault Reset", font=fonts["body"], fill="#FFFFFF")
    
    img.save(OUTPUT_DIR / "tier3_key_info.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_key_info.png'}")


def tier3_cell_voltage():
    """Level 3: Cell Voltage Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=3)  # BMU active
    
    draw_title(draw, "Cell Voltage", "Level 3: Individual Cell Voltage Monitoring")
    
    y = 200
    
    # Pack selector
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((140, y + 5), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 60
    draw_divider(draw, y)
    y += 30
    
    # Cell voltage grid (28 cells as in reference)
    draw.text((40, y), "Cell Voltage Matrix", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    cell_count = 28
    start_x = 40
    start_y = y
    cols = 7
    rows = (cell_count + cols - 1) // cols
    
    for idx in range(cell_count):
        col = idx % cols
        row = idx // cols
        x = start_x + col * 260
        cell_y = start_y + row * 120
        
        # Cell card
        draw.rounded_rectangle((x, cell_y, x + 240, cell_y + 100), radius=6, fill=COLORS["card_bg"])
        
        # Cell label
        draw.text((x + 10, cell_y + 10), f"Cell {idx+1:02d}", font=fonts["body"], fill=COLORS["text"])
        
        # Voltage value
        voltage = 3.20 + (idx % 5) * 0.01
        draw.text((x + 10, cell_y + 40), f"{voltage:.2f} V", font=fonts["heading"], fill=COLORS["text"])
        
        # Status indicator
        status_color = COLORS["chip_ok"]
        if voltage > 3.25:
            status_color = COLORS["chip_warn"]
        elif voltage < 3.15:
            status_color = COLORS["chip_error"]
        
        draw.ellipse((x + 200, cell_y + 20, x + 220, cell_y + 40), fill=status_color)
    
    img.save(OUTPUT_DIR / "tier3_cell_voltage.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_cell_voltage.png'}")


def tier3_cell_temperature():
    """Level 3: Cell Temperature Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=3)  # BMU active
    
    draw_title(draw, "Cell Temperature", "Level 3: Individual Cell Temperature Monitoring")
    
    y = 200
    
    # Pack selector
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((140, y + 5), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 60
    draw_divider(draw, y)
    y += 30
    
    # Temperature points grid (28 points as in reference)
    draw.text((40, y), "Temperature Points", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    temp_count = 28
    start_x = 40
    start_y = y
    cols = 7
    rows = (temp_count + cols - 1) // cols
    
    for idx in range(temp_count):
        col = idx % cols
        row = idx // cols
        x = start_x + col * 260
        temp_y = start_y + row * 120
        
        # Temperature card
        draw.rounded_rectangle((x, temp_y, x + 240, temp_y + 100), radius=6, fill=COLORS["card_bg"])
        
        # Label
        draw.text((x + 10, temp_y + 10), f"Temp {idx+1:02d}", font=fonts["body"], fill=COLORS["text"])
        
        # Temperature value
        temp = 12.8 + (idx % 3) * 0.1
        draw.text((x + 10, temp_y + 40), f"{temp:.1f} °C", font=fonts["heading"], fill=COLORS["text"])
        
        # Status indicator
        status_color = COLORS["chip_ok"]
        if temp > 35.0:
            status_color = COLORS["chip_error"]
        elif temp > 30.0:
            status_color = COLORS["chip_warn"]
        
        draw.ellipse((x + 200, temp_y + 20, x + 220, temp_y + 40), fill=status_color)
    
    img.save(OUTPUT_DIR / "tier3_cell_temperature.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_cell_temperature.png'}")


def tier3_sys():
    """Level 3: System Information Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=0)  # SYS active
    
    draw_title(draw, "System Information", "Level 3: System Status and Configuration")
    
    y = 200
    
    # System status
    draw.text((40, y), "System Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    sys_status = [
        ("System Mode", "Normal", "ok"),
        ("Operation Status", "Local", "warn"),
        ("Alarm Status", "Fault", "error"),
        ("Communication", "Online", "ok"),
        ("Network", "Connected", "ok"),
        ("SD Card", "Normal", "ok"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, state, status) in enumerate(sys_status):
        if idx > 0 and idx % 3 == 0:
            x = 40
            row_y += 60
        draw_metric_card(draw, x, row_y, label, state, "", width=280, height=80)
        draw_status_chip(draw, x + 200, row_y + 50, state, status)
        x += 600
    
    y = row_y + 120
    draw_divider(draw, y)
    y += 30
    
    # System configuration
    draw.text((40, y), "System Configuration", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    config_items = [
        ("Architecture", "Level 3 (Stack-Cluster-Pack-Cell)", 40),
        ("Stack Count", "1", 400),
        ("Cluster Count", "3", 760),
        ("Pack Count per Cluster", "4", 1120),
        ("Cell Count per Pack", "30", 1480),
        ("Temperature Points per Pack", "28", 40),
        ("Cell Configuration", "2S 15P", 400),
        ("Software Version", "QRenBms100.3.1.13", 760),
        ("Hardware Version", "BCMU-2 BEMU-V11", 1120),
    ]
    
    row_y = y
    for idx, (label, value, x) in enumerate(config_items):
        if idx > 0 and idx % 3 == 0:
            row_y += 60
        draw.text((x, row_y), f"{label}:", font=fonts["body"], fill=COLORS["muted"])
        draw.text((x, row_y + 30), value, font=fonts["body"], fill=COLORS["text"])
    
    y = row_y + 100
    draw_divider(draw, y)
    y += 30
    
    # Communication status
    draw.text((40, y), "Communication Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    comm_status = [
        ("CAN1", "Online", "ok"),
        ("CAN2", "Online", "ok"),
        ("RS485", "Online", "ok"),
        ("SPI1", "Online", "ok"),
        ("SPI2", "Online", "ok"),
        ("LAN1", "Online", "ok"),
        ("LAN2", "Online", "ok"),
        ("LAN3", "Timeout", "error"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, state, status) in enumerate(comm_status):
        if idx > 0 and idx % 4 == 0:
            x = 40
            row_y += 50
        draw_status_chip(draw, x, row_y, f"{label}: {state}", status)
        x += 460
    
    y = row_y + 80
    draw_divider(draw, y)
    y += 30
    
    # System time
    draw.text((40, y), "System Time", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    draw.text((40, y), "2025/12/1 09:55:52", font=fonts["heading"], fill=COLORS["text"])
    
    img.save(OUTPUT_DIR / "tier3_sys.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_sys.png'}")


def tier3_events():
    """Level 3: Event Log Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=4)  # EVT active
    
    draw_title(draw, "Event Log", "Level 3: System Events and Alarms")
    
    y = 200
    
    # Event list
    events = [
        ("2025/11/22 08:13:29", "System Fault", "BEMU Communication Timeout"),
        ("2025/11/22 08:09:29", "System Alarm", "BEMU Communication Timeout"),
        ("2025/11/22 08:08:34", "System Status", "System Alarm - Open All Contactors"),
        ("2025/11/22 08:08:31", "BCMU7 Fault", "Insulation Failure, 0kohm"),
        ("2025/11/22 08:08:31", "BCMU7 Status", "Insulation Detection Enabled"),
        ("2025/11/22 08:08:31", "BCMU7 Status", "Fault Occurred 400"),
        ("2025/11/22 08:08:31", "BCMU6 Fault", "Insulation Failure, 0kohm"),
        ("2025/11/22 08:08:31", "BCMU6 Status", "Insulation Detection Enabled"),
        ("2025/11/22 08:08:31", "BCMU6 Status", "Fault Occurred 400"),
        ("2025/11/22 08:08:30", "BCMU5 Fault", "Insulation Failure, 0kohm"),
        ("2025/11/22 08:08:30", "BCMU5 Status", "Insulation Detection Enabled"),
        ("2025/11/22 08:08:30", "BCMU5 Status", "Fault Occurred 400"),
    ]
    
    # Table header
    draw.text((40, y), "Time", font=fonts["body"], fill=COLORS["muted"])
    draw.text((300, y), "Event Type", font=fonts["body"], fill=COLORS["muted"])
    draw.text((600, y), "Event Details", font=fonts["body"], fill=COLORS["muted"])
    y += 30
    draw_divider(draw, y)
    y += 20
    
    # Event rows
    for time_str, event_type, details in events[:10]:  # Show first 10
        # Time
        draw.text((40, y), time_str, font=fonts["small"], fill=COLORS["text"])
        
        # Event type with color coding
        if "Fault" in event_type:
            color = COLORS["chip_error"]
        elif "Alarm" in event_type:
            color = COLORS["chip_warn"]
        else:
            color = COLORS["chip_info"]
        
        draw_status_chip(draw, 300, y - 5, event_type, "error" if "Fault" in event_type else "warn" if "Alarm" in event_type else "info")
        
        # Details
        draw.text((600, y), details, font=fonts["small"], fill=COLORS["text"])
        
        y += 50
        if y > HEIGHT - 100:
            break
    
    img.save(OUTPUT_DIR / "tier3_events.png")
    print(f"Generated: {OUTPUT_DIR / 'tier3_events.png'}")


# ========== Level 2 (Cluster-Pack-Cell) Designs ==========

def tier2_monitor():
    """Level 2: Cluster Monitor Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=1)  # BAU active
    
    draw_title(draw, "Cluster Monitor", "Level 2 Architecture: Cluster → Pack → Cell")
    
    y = 200
    
    # Cluster overview metrics
    metrics = [
        ("Cluster Voltage", "1250.5", "V", 40),
        ("Cluster Current", "1320.0", "A", 320),
        ("Power", "1650.6", "kW", 600),
        ("SOC", "12.7", "%", 880),
        ("SOE", "0.0", "%", 1160),
        ("SOH", "93", "%", 1440),
    ]
    
    for label, value, unit, x in metrics:
        draw_metric_card(draw, x, y, label, value, unit, width=240, height=100)
    
    # Breaker status
    draw_status_chip(draw, 1680, y + 30, "Breaker: Closed", "ok")
    
    y += 130
    draw_divider(draw, y)
    y += 30
    
    # Pack status (series connection)
    draw.text((40, y), "Pack Status (Series Connection)", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    pack_count = 10
    pack_y = y
    pack_height = 60
    for idx in range(pack_count):
        x = 40
        
        # Pack card
        draw.rounded_rectangle((x, pack_y, x + 1800, pack_y + pack_height), radius=6, fill=COLORS["card_bg"])
        
        # Pack ID
        draw.text((x + 20, pack_y + 15), f"Pack {idx+1:02d}", font=fonts["body"], fill=COLORS["text"])
        
        # Pack metrics
        soc = 93.0 - idx * 0.7
        voltage = 125.0 - idx * 0.1
        temp_diff = 1.4 + idx * 0.2
        
        draw.text((x + 200, pack_y + 15), f"SOC: {soc:.1f}%", font=fonts["small"], fill=COLORS["text"])
        draw.text((x + 350, pack_y + 15), f"Voltage: {voltage:.1f}V", font=fonts["small"], fill=COLORS["text"])
        
        # SOC progress bar
        bar_x = x + 550
        bar_y = pack_y + 20
        bar_width = 400
        bar_height = 20
        draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_width, bar_y + bar_height), radius=4, fill=COLORS["line"])
        fill_width = bar_width * (soc / 100)
        draw.rounded_rectangle((bar_x, bar_y, bar_x + fill_width, bar_y + bar_height), radius=4, fill=COLORS["chip_ok"])
        
        # Temperature difference
        temp_status = "warn" if temp_diff > 2.0 else "ok"
        draw_status_chip(draw, x + 1000, pack_y + 10, f"ΔT: {temp_diff:.1f}°C", temp_status)
        
        # Balance status
        balance_status = "ok" if idx % 4 != 0 else "warn"
        draw_status_chip(draw, x + 1200, pack_y + 10, "Balance", balance_status)
        
        pack_y += pack_height + 10
        if pack_y + pack_height > HEIGHT - 100:
            break
    
    y = pack_y + 20
    draw_divider(draw, y)
    y += 30
    
    # Protection status
    draw.text((40, y), "Protection Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    protections = [
        ("HV Breaker", "Closed", "ok"),
        ("Insulation", "980kΩ", "ok"),
        ("Overvoltage", "Normal", "ok"),
        ("Undervoltage", "Normal", "ok"),
        ("Overcurrent", "Normal", "ok"),
        ("Temperature", "Normal", "ok"),
    ]
    
    x = 40
    for label, state, status in protections:
        draw_status_chip(draw, x, y, f"{label}: {state}", status)
        x += 300
    
    img.save(OUTPUT_DIR / "tier2_monitor.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_monitor.png'}")


def tier2_key_info():
    """Level 2: Key Information Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=2)  # BCU active (Key Information)
    
    draw_title(draw, "Key Information", "Level 2: Cluster Key Parameters")
    
    y = 200
    
    # Key metrics grid (same as tier3 but for cluster)
    key_metrics = [
        ("SOC", "12.7", "%", 40),
        ("SOE", "0.0", "%", 320),
        ("SOH", "93", "%", 600),
        ("SOS", "50.0", "%", 880),
        ("Consistency", "91", "%", 1160),
        ("Cluster Voltage", "1250.5", "V", 1440),
        ("Cluster Current", "1320.0", "A", 40),
        ("Power", "1650.6", "kW", 320),
        ("Max Cell Voltage", "3209", "mV", 600),
        ("Min Cell Voltage", "3200", "mV", 880),
        ("Max Cell Temp", "13.0", "°C", 1160),
        ("Min Cell Temp", "12.8", "°C", 1440),
    ]
    
    row_y = y
    for idx, (label, value, unit, x) in enumerate(key_metrics):
        if idx > 0 and idx % 6 == 0:
            row_y += 120
        draw_metric_card(draw, x, row_y + (idx // 6) * 120, label, value, unit, width=200, height=100)
    
    y = row_y + 240
    draw_divider(draw, y)
    y += 30
    
    # Status words
    draw.text((40, y), "Status Words", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    status_words = [
        ("Status Word 1", "0x0C26", 40),
        ("Status Word 2", "0x029E", 320),
        ("Alarm Word 1", "0x0000", 600),
        ("Alarm Word 2", "0x0001", 880),
        ("Fault Word 1", "0x0400", 1160),
        ("Fault Word 2", "0x0001", 1440),
    ]
    
    for label, value, x in status_words:
        draw.text((x, y), f"{label}:", font=fonts["body"], fill=COLORS["muted"])
        draw.text((x, y + 30), value, font=fonts["heading"], fill=COLORS["text"])
    
    y += 100
    draw_divider(draw, y)
    y += 30
    
    # Alarm status grid
    draw.text((40, y), "Alarm Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    alarms = [
        ("Total Overvoltage", "error"),
        ("Total Undervoltage", "error"),
        ("Insulation Failure", "error"),
        ("SOC High", "ok"),
        ("SOC Low", "ok"),
        ("Cell Overvoltage", "ok"),
        ("Cell Undervoltage", "ok"),
        ("Cell Overtemp", "ok"),
        ("Cell Undertemp", "ok"),
        ("Voltage Diff", "ok"),
        ("Temp Diff", "ok"),
        ("Temp Sensor", "error"),
        ("Voltage Sensor", "error"),
        ("Current Sensor", "error"),
        ("DC Contactor", "error"),
        ("Fuse", "error"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, status) in enumerate(alarms):
        if idx > 0 and idx % 4 == 0:
            x = 40
            row_y += 50
        draw_status_chip(draw, x, row_y, label, status)
        x += 460
    
    y = row_y + 80
    draw_divider(draw, y)
    y += 30
    
    # Control commands
    draw.text((40, y), "Control Commands", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Fault reset button
    draw.rounded_rectangle((40, y, 240, y + 50), radius=8, fill=COLORS["chip_error"])
    draw.text((120, y + 15), "Fault Reset", font=fonts["body"], fill="#FFFFFF")
    
    img.save(OUTPUT_DIR / "tier2_key_info.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_key_info.png'}")


def tier2_cell_voltage():
    """Level 2: Cell Voltage Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=3)  # BMU active
    
    draw_title(draw, "Cell Voltage", "Level 2: Individual Cell Voltage Monitoring")
    
    y = 200
    
    # Pack selector
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((140, y + 5), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 60
    draw_divider(draw, y)
    y += 30
    
    # Cell voltage grid (30 cells, 2S15P configuration)
    draw.text((40, y), "Cell Voltage Matrix (2S 15P)", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    cell_count = 30
    start_x = 40
    start_y = y
    cols = 10
    rows = (cell_count + cols - 1) // cols
    
    for idx in range(cell_count):
        col = idx % cols
        row = idx // cols
        x = start_x + col * 180
        cell_y = start_y + row * 100
        
        # Cell card
        draw.rounded_rectangle((x, cell_y, x + 160, cell_y + 80), radius=4, fill=COLORS["card_bg"])
        
        # Cell label
        draw.text((x + 5, cell_y + 5), f"C{idx+1:02d}", font=fonts["small"], fill=COLORS["text"])
        
        # Voltage value
        voltage = 3.54 + (idx % 5) * 0.02
        draw.text((x + 5, cell_y + 30), f"{voltage:.2f}V", font=fonts["body"], fill=COLORS["text"])
        
        # Status indicator
        status_color = COLORS["chip_ok"]
        if voltage > 3.60:
            status_color = COLORS["chip_warn"]
        elif voltage < 3.50:
            status_color = COLORS["chip_error"]
        
        draw.ellipse((x + 130, cell_y + 10, x + 150, cell_y + 30), fill=status_color)
    
    img.save(OUTPUT_DIR / "tier2_cell_voltage.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_cell_voltage.png'}")


def tier2_cell_temperature():
    """Level 2: Cell Temperature Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=3)  # BMU active
    
    draw_title(draw, "Cell Temperature", "Level 2: Temperature Points Monitoring")
    
    y = 200
    
    # Pack selector
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((140, y + 5), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 60
    draw_divider(draw, y)
    y += 30
    
    # Temperature points (8 points as example)
    draw.text((40, y), "Temperature Probes", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    temp_count = 8
    start_x = 40
    start_y = y
    
    for idx in range(temp_count):
        x = start_x + idx * 220
        if x + 200 > WIDTH - 40:
            break
        
        # Temperature chip
        temp = 27.0 + idx * 0.6
        temp_status = "warn" if temp > 31.0 else "ok"
        draw_status_chip(draw, x, start_y, f"T{idx+1}: {temp:.1f}°C", temp_status)
    
    img.save(OUTPUT_DIR / "tier2_cell_temperature.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_cell_temperature.png'}")


def tier2_sys():
    """Level 2: System Information Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=0)  # SYS active
    
    draw_title(draw, "System Information", "Level 2: System Status and Configuration")
    
    y = 200
    
    # System status
    draw.text((40, y), "System Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    sys_status = [
        ("System Mode", "Normal", "ok"),
        ("Operation Status", "Local", "warn"),
        ("Alarm Status", "Fault", "error"),
        ("Communication", "Online", "ok"),
        ("Network", "Connected", "ok"),
        ("SD Card", "Normal", "ok"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, state, status) in enumerate(sys_status):
        if idx > 0 and idx % 3 == 0:
            x = 40
            row_y += 60
        draw_metric_card(draw, x, row_y, label, state, "", width=280, height=80)
        draw_status_chip(draw, x + 200, row_y + 50, state, status)
        x += 600
    
    y = row_y + 120
    draw_divider(draw, y)
    y += 30
    
    # System configuration
    draw.text((40, y), "System Configuration", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    config_items = [
        ("Architecture", "Level 2 (Cluster-Pack-Cell)", 40),
        ("Cluster Count", "1", 400),
        ("Pack Count", "10", 760),
        ("Cell Count per Pack", "30", 1120),
        ("Temperature Points per Pack", "8", 1480),
        ("Cell Configuration", "2S 15P", 400),
        ("Software Version", "QRenBms100.3.1.13", 760),
        ("Hardware Version", "BCMU-2 BEMU-V11", 1120),
    ]
    
    row_y = y
    for idx, (label, value, x) in enumerate(config_items):
        if idx > 0 and idx % 3 == 0:
            row_y += 60
        draw.text((x, row_y), f"{label}:", font=fonts["body"], fill=COLORS["muted"])
        draw.text((x, row_y + 30), value, font=fonts["body"], fill=COLORS["text"])
    
    y = row_y + 100
    draw_divider(draw, y)
    y += 30
    
    # Communication status
    draw.text((40, y), "Communication Status", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    comm_status = [
        ("CAN1", "Online", "ok"),
        ("CAN2", "Online", "ok"),
        ("RS485", "Online", "ok"),
        ("SPI1", "Online", "ok"),
        ("SPI2", "Online", "ok"),
        ("LAN1", "Online", "ok"),
        ("LAN2", "Online", "ok"),
        ("LAN3", "Timeout", "error"),
    ]
    
    x = 40
    row_y = y
    for idx, (label, state, status) in enumerate(comm_status):
        if idx > 0 and idx % 4 == 0:
            x = 40
            row_y += 50
        draw_status_chip(draw, x, row_y, f"{label}: {state}", status)
        x += 460
    
    y = row_y + 80
    draw_divider(draw, y)
    y += 30
    
    # System time
    draw.text((40, y), "System Time", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    draw.text((40, y), "2025/12/1 09:55:52", font=fonts["heading"], fill=COLORS["text"])
    
    img.save(OUTPUT_DIR / "tier2_sys.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_sys.png'}")


def tier2_events():
    """Level 2: Event Log Page"""
    img, draw = canvas()
    
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=4)  # EVT active
    
    draw_title(draw, "Event Log", "Level 2: System Events and Alarms")
    
    y = 200
    
    # Event list (same format as tier3)
    events = [
        ("2025/11/22 08:13:29", "System Fault", "BEMU Communication Timeout"),
        ("2025/11/22 08:09:29", "System Alarm", "BEMU Communication Timeout"),
        ("2025/11/22 08:08:34", "System Status", "System Alarm - Open All Contactors"),
        ("2025/11/22 08:08:31", "BCMU7 Fault", "Insulation Failure, 0kohm"),
        ("2025/11/22 08:08:31", "BCMU7 Status", "Insulation Detection Enabled"),
        ("2025/11/22 08:08:31", "BCMU7 Status", "Fault Occurred 400"),
        ("2025/11/22 08:08:31", "BCMU6 Fault", "Insulation Failure, 0kohm"),
        ("2025/11/22 08:08:31", "BCMU6 Status", "Insulation Detection Enabled"),
        ("2025/11/22 08:08:31", "BCMU6 Status", "Fault Occurred 400"),
        ("2025/11/22 08:08:30", "BCMU5 Fault", "Insulation Failure, 0kohm"),
    ]
    
    # Table header
    draw.text((40, y), "Time", font=fonts["body"], fill=COLORS["muted"])
    draw.text((300, y), "Event Type", font=fonts["body"], fill=COLORS["muted"])
    draw.text((600, y), "Event Details", font=fonts["body"], fill=COLORS["muted"])
    y += 30
    draw_divider(draw, y)
    y += 20
    
    # Event rows
    for time_str, event_type, details in events[:10]:  # Show first 10
        # Time
        draw.text((40, y), time_str, font=fonts["small"], fill=COLORS["text"])
        
        # Event type with color coding
        draw_status_chip(draw, 300, y - 5, event_type, "error" if "Fault" in event_type else "warn" if "Alarm" in event_type else "info")
        
        # Details
        draw.text((600, y), details, font=fonts["small"], fill=COLORS["text"])
        
        y += 50
        if y > HEIGHT - 100:
            break
    
    img.save(OUTPUT_DIR / "tier2_events.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_events.png'}")


def main():
    """Generate all design images"""
    print("Generating BMS design images...")
    print("=" * 50)
    
    print("\nLevel 3 (Stack-Cluster-Pack-Cell) Designs:")
    tier3_sys()
    tier3_monitor()
    tier3_key_info()
    tier3_cell_voltage()
    tier3_cell_temperature()
    tier3_events()
    
    print("\nLevel 2 (Cluster-Pack-Cell) Designs:")
    tier2_sys()
    tier2_monitor()
    tier2_key_info()
    tier2_cell_voltage()
    tier2_cell_temperature()
    tier2_events()
    
    print("\n" + "=" * 50)
    print(f"All designs generated in: {OUTPUT_DIR}")
    print("Total: 12 design images")


if __name__ == "__main__":
    main()
