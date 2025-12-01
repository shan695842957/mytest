#!/usr/bin/env python3
"""
Tier 2 BMS Design Generator
Generate Tier 2 (Cluster-Pack-Cell) BMS visualization designs
Outputs both SVG and PNG formats
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os

# Canvas dimensions
WIDTH, HEIGHT = 1920, 1080

# Color scheme
COLORS = {
    "bg": "#F5F5F5",
    "tab": "#E0E0E0",
    "tab_active": "#2E7D32",
    "text": "#212121",
    "muted": "#757575",
    "line": "#BDBDBD",
    "card_bg": "#FFFFFF",
    "chip_ok": "#4CAF50",
    "chip_warn": "#FF9800",
    "chip_error": "#F44336",
    "chip_info": "#2196F3",
    "accent": "#1976D2",
    "breaker_closed": "#4CAF50",
    "breaker_open": "#F44336",
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
    draw.rounded_rectangle((x, y, x + width, y + height), radius=8, fill=COLORS["card_bg"])
    draw.text((x + 10, y + 10), label, font=fonts["small"], fill=COLORS["muted"])
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


# ========== Tier 2 Designs ==========

def tier2_sys():
    """Tier 2: SYS Page - Cluster Overview with Pack Series Connection"""
    img, draw = canvas()
    
    tabs = ["SYS", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=0)
    
    draw_title(draw, "Cluster Overview", "Tier 2: Cluster Basic Information and Pack Status")
    
    y = 200
    
    # Cluster basic information
    draw.text((40, y), "Cluster Basic Information", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Left column: Status indicators
    draw.text((40, y), "Alarm Status", font=fonts["small"], fill=COLORS["muted"])
    draw.rounded_rectangle((40, y + 25, 200, y + 65), radius=4, fill=COLORS["chip_error"])
    draw.text((120, y + 40), "Fault", font=fonts["body"], fill="#FFFFFF")
    
    draw.text((40, y + 80), "Operation Status", font=fonts["small"], fill=COLORS["muted"])
    draw.rounded_rectangle((40, y + 105, 200, y + 145), radius=4, fill=COLORS["chip_warn"])
    draw.text((120, y + 120), "Local", font=fonts["body"], fill="#FFFFFF")
    
    # Middle: Main electrical parameters
    draw_metric_card(draw, 240, y, "Cluster Voltage", "1250.5", "V", width=200, height=100)
    draw_metric_card(draw, 460, y, "Cluster Current", "1320.0", "A", width=200, height=100)
    draw_metric_card(draw, 680, y, "Power", "1650.6", "kW", width=200, height=100)
    
    # Right: Breaker status
    draw.text((900, y), "Breaker Status", font=fonts["small"], fill=COLORS["muted"])
    draw.rounded_rectangle((900, y + 25, 1100, y + 65), radius=4, fill=COLORS["breaker_closed"])
    draw.text((1000, y + 40), "Closed", font=fonts["body"], fill="#FFFFFF")
    
    # Additional indicators
    y += 120
    draw.text((40, y), "SOC", font=fonts["small"], fill=COLORS["muted"])
    draw.text((40, y + 30), "12.7%", font=fonts["heading"], fill=COLORS["text"])
    
    draw.text((200, y), "SOE", font=fonts["small"], fill=COLORS["muted"])
    draw.text((200, y + 30), "0.0%", font=fonts["heading"], fill=COLORS["text"])
    
    draw.text((360, y), "SOH", font=fonts["small"], fill=COLORS["muted"])
    draw.text((360, y + 30), "93%", font=fonts["heading"], fill=COLORS["text"])
    
    draw.text((520, y), "SOS", font=fonts["small"], fill=COLORS["muted"])
    draw.text((520, y + 30), "50.0%", font=fonts["heading"], fill=COLORS["text"])
    
    draw.text((680, y), "Consistency", font=fonts["small"], fill=COLORS["muted"])
    draw.text((680, y + 30), "91%", font=fonts["heading"], fill=COLORS["text"])
    
    draw.text((900, y), "Insulation", font=fonts["small"], fill=COLORS["muted"])
    draw.text((900, y + 30), "980kΩ", font=fonts["heading"], fill=COLORS["text"])
    
    y += 80
    draw_divider(draw, y)
    y += 30
    
    # Breaker control buttons
    draw.text((40, y), "Breaker Control", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Close button
    draw.rounded_rectangle((40, y, 300, y + 60), radius=8, fill=COLORS["breaker_closed"])
    draw.text((170, y + 20), "Close Breaker", font=fonts["body"], fill="#FFFFFF")
    
    # Open button
    draw.rounded_rectangle((340, y, 600, y + 60), radius=8, fill=COLORS["breaker_open"])
    draw.text((470, y + 20), "Open Breaker", font=fonts["body"], fill="#FFFFFF")
    
    y += 90
    draw_divider(draw, y)
    y += 30
    
    # Pack status - Series connection topology
    draw.text((40, y), "Pack Status (Series Connection)", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Display packs in series (vertical list with series indicators)
    pack_count = 8
    pack_height = 70
    pack_y = y
    
    for idx in range(pack_count):
        x = 40
        
        # Series connection indicator (except first pack)
        if idx > 0:
            # Draw series connection line
            draw.line((x + 100, pack_y - 10, x + 100, pack_y), fill=COLORS["accent"], width=3)
            draw.text((x + 110, pack_y - 25), "Series", font=fonts["tiny"], fill=COLORS["accent"])
        
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
        draw.text((x + 500, pack_y + 15), f"Current: 110.0A", font=fonts["small"], fill=COLORS["text"])
        
        # SOC progress bar
        bar_x = x + 700
        bar_y = pack_y + 20
        bar_width = 400
        bar_height = 20
        draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_width, bar_y + bar_height), radius=4, fill=COLORS["line"])
        fill_width = bar_width * (soc / 100)
        draw.rounded_rectangle((bar_x, bar_y, bar_x + fill_width, bar_y + bar_height), radius=4, fill=COLORS["chip_ok"])
        
        # Temperature difference
        temp_status = "warn" if temp_diff > 2.0 else "ok"
        draw_status_chip(draw, x + 1150, pack_y + 10, f"ΔT: {temp_diff:.1f}°C", temp_status)
        
        # Status indicator
        status = "ok" if idx % 4 != 0 else "warn"
        draw_status_chip(draw, x + 1350, pack_y + 10, "Normal" if status == "ok" else "Warning", status)
        
        pack_y += pack_height + 15
        if pack_y + pack_height > HEIGHT - 100:
            break
    
    # Save PNG
    img.save(OUTPUT_DIR / "tier2_sys.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_sys.png'}")
    
    # Generate SVG
    generate_svg_tier2_sys()


def generate_svg_tier2_sys():
    """Generate SVG version of tier2_sys"""
    svg_content = f'''<svg width="{WIDTH}" height="{HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="{COLORS['bg']}"/>
  
  <!-- Tabs -->
  <g id="tabs">
    <rect x="40" y="20" width="100" height="50" rx="8" fill="{COLORS['tab_active']}"/>
    <text x="90" y="50" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">SYS</text>
    <rect x="150" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="200" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">BCU</text>
    <rect x="260" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="310" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">BMU</text>
    <rect x="370" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="420" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">EVT</text>
  </g>
  
  <!-- Title -->
  <text x="40" y="140" fill="{COLORS['text']}" font-size="48" font-family="Arial" font-weight="bold">Cluster Overview</text>
  <text x="40" y="180" fill="{COLORS['muted']}" font-size="24" font-family="Arial">Tier 2: Cluster Basic Information and Pack Status</text>
  <line x1="40" y1="200" x2="1880" y2="200" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Cluster Basic Information -->
  <text x="40" y="250" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Cluster Basic Information</text>
  
  <!-- Status indicators -->
  <text x="40" y="300" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Alarm Status</text>
  <rect x="40" y="325" width="160" height="40" rx="4" fill="{COLORS['chip_error']}"/>
  <text x="120" y="350" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Fault</text>
  
  <text x="40" y="380" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Operation Status</text>
  <rect x="40" y="405" width="160" height="40" rx="4" fill="{COLORS['chip_warn']}"/>
  <text x="120" y="430" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Local</text>
  
  <!-- Metrics -->
  <rect x="240" y="300" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="250" y="320" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Cluster Voltage</text>
  <text x="340" y="360" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">1250.5 V</text>
  
  <rect x="460" y="300" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="470" y="320" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Cluster Current</text>
  <text x="560" y="360" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">1320.0 A</text>
  
  <rect x="680" y="300" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="690" y="320" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Power</text>
  <text x="780" y="360" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">1650.6 kW</text>
  
  <text x="900" y="300" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Breaker Status</text>
  <rect x="900" y="325" width="200" height="40" rx="4" fill="{COLORS['breaker_closed']}"/>
  <text x="1000" y="350" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Closed</text>
  
  <!-- Additional indicators -->
  <text x="40" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOC</text>
  <text x="40" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">12.7%</text>
  
  <text x="200" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOE</text>
  <text x="200" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">0.0%</text>
  
  <text x="360" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOH</text>
  <text x="360" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">93%</text>
  
  <text x="520" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOS</text>
  <text x="520" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">50.0%</text>
  
  <text x="680" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Consistency</text>
  <text x="680" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">91%</text>
  
  <text x="900" y="420" fill="{COLORS['muted']}" font-size="18" font-family="Arial">Insulation</text>
  <text x="900" y="450" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">980kΩ</text>
  
  <line x1="40" y1="500" x2="1880" y2="500" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Breaker Control -->
  <text x="40" y="530" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Breaker Control</text>
  <rect x="40" y="560" width="260" height="60" rx="8" fill="{COLORS['breaker_closed']}"/>
  <text x="170" y="595" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Close Breaker</text>
  <rect x="340" y="560" width="260" height="60" rx="8" fill="{COLORS['breaker_open']}"/>
  <text x="470" y="595" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Open Breaker</text>
  
  <line x1="40" y1="650" x2="1880" y2="650" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Pack Status -->
  <text x="40" y="680" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Pack Status (Series Connection)</text>
  
  <!-- Pack list (simplified for SVG) -->
  <g id="packs">
    <rect x="40" y="720" width="1800" height="70" rx="6" fill="{COLORS['card_bg']}"/>
    <text x="60" y="750" fill="{COLORS['text']}" font-size="20" font-family="Arial">Pack 01</text>
    <text x="220" y="750" fill="{COLORS['text']}" font-size="18" font-family="Arial">SOC: 93.0%</text>
    <text x="370" y="750" fill="{COLORS['text']}" font-size="18" font-family="Arial">Voltage: 125.0V</text>
    <text x="520" y="750" fill="{COLORS['text']}" font-size="18" font-family="Arial">Current: 110.0A</text>
    <rect x="720" y="735" width="400" height="20" rx="4" fill="{COLORS['line']}"/>
    <rect x="720" y="735" width="372" height="20" rx="4" fill="{COLORS['chip_ok']}"/>
    
    <line x1="140" y1="790" x2="140" y2="805" stroke="{COLORS['accent']}" stroke-width="3"/>
    <text x="150" y="800" fill="{COLORS['accent']}" font-size="14" font-family="Arial">Series</text>
    
    <rect x="40" y="805" width="1800" height="70" rx="6" fill="{COLORS['card_bg']}"/>
    <text x="60" y="835" fill="{COLORS['text']}" font-size="20" font-family="Arial">Pack 02</text>
    <text x="220" y="835" fill="{COLORS['text']}" font-size="18" font-family="Arial">SOC: 92.3%</text>
    <text x="370" y="835" fill="{COLORS['text']}" font-size="18" font-family="Arial">Voltage: 124.9V</text>
    <text x="520" y="835" fill="{COLORS['text']}" font-size="18" font-family="Arial">Current: 110.0A</text>
    <rect x="720" y="820" width="400" height="20" rx="4" fill="{COLORS['line']}"/>
    <rect x="720" y="820" width="369" height="20" rx="4" fill="{COLORS['chip_ok']}"/>
  </g>
</svg>'''
    
    with open(OUTPUT_DIR / "tier2_sys.svg", "w") as f:
        f.write(svg_content)
    print(f"Generated: {OUTPUT_DIR / 'tier2_sys.svg'}")


def tier2_bcu():
    """Tier 2: BCU Page - Cluster Data (Telemetry and Telecontrol)"""
    img, draw = canvas()
    
    tabs = ["SYS", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=1)
    
    draw_title(draw, "Cluster Data", "Tier 2: Telemetry and Telecontrol Information")
    
    y = 200
    
    # Telemetry section
    draw.text((40, y), "Telemetry Data", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Key metrics
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
    
    # Telecontrol section (Alarm Status)
    draw.text((40, y), "Telecontrol Data (Alarm Status)", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    alarms = [
        ("Total Overvoltage", "ok"),
        ("Total Undervoltage", "ok"),
        ("Insulation Failure", "error"),
        ("SOC High", "ok"),
        ("SOC Low", "warn"),
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
    draw.text((140, y + 25), "Fault Reset", font=fonts["body"], fill="#FFFFFF")
    
    img.save(OUTPUT_DIR / "tier2_bcu.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_bcu.png'}")
    
    # Generate SVG
    generate_svg_tier2_bcu()


def generate_svg_tier2_bcu():
    """Generate SVG version of tier2_bcu"""
    svg_content = f'''<svg width="{WIDTH}" height="{HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="{COLORS['bg']}"/>
  
  <!-- Tabs -->
  <g id="tabs">
    <rect x="40" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="90" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">SYS</text>
    <rect x="150" y="20" width="100" height="50" rx="8" fill="{COLORS['tab_active']}"/>
    <text x="200" y="50" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">BCU</text>
    <rect x="260" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="310" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">BMU</text>
    <rect x="370" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="420" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">EVT</text>
  </g>
  
  <!-- Title -->
  <text x="40" y="140" fill="{COLORS['text']}" font-size="48" font-family="Arial" font-weight="bold">Cluster Data</text>
  <text x="40" y="180" fill="{COLORS['muted']}" font-size="24" font-family="Arial">Tier 2: Telemetry and Telecontrol Information</text>
  <line x1="40" y1="200" x2="1880" y2="200" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Telemetry Data -->
  <text x="40" y="250" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Telemetry Data</text>
  
  <!-- Key metrics (simplified) -->
  <rect x="40" y="270" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="50" y="290" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOC</text>
  <text x="140" y="330" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">12.7 %</text>
  
  <rect x="320" y="270" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="330" y="290" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOE</text>
  <text x="420" y="330" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">0.0 %</text>
  
  <rect x="600" y="270" width="200" height="100" rx="8" fill="{COLORS['card_bg']}"/>
  <text x="610" y="290" fill="{COLORS['muted']}" font-size="18" font-family="Arial">SOH</text>
  <text x="700" y="330" text-anchor="middle" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">93 %</text>
  
  <line x1="40" y1="400" x2="1880" y2="400" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Telecontrol Data -->
  <text x="40" y="430" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Telecontrol Data (Alarm Status)</text>
  
  <!-- Alarm chips (simplified) -->
  <rect x="40" y="460" width="200" height="32" rx="16" fill="{COLORS['chip_ok']}"/>
  <text x="140" y="480" text-anchor="middle" fill="#FFFFFF" font-size="18" font-family="Arial">Total Overvoltage</text>
  
  <rect x="260" y="460" width="200" height="32" rx="16" fill="{COLORS['chip_error']}"/>
  <text x="360" y="480" text-anchor="middle" fill="#FFFFFF" font-size="18" font-family="Arial">Insulation Failure</text>
  
  <line x1="40" y1="520" x2="1880" y2="520" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Control Commands -->
  <text x="40" y="550" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Control Commands</text>
  <rect x="40" y="580" width="200" height="50" rx="8" fill="{COLORS['chip_error']}"/>
  <text x="140" y="610" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">Fault Reset</text>
</svg>'''
    
    with open(OUTPUT_DIR / "tier2_bcu.svg", "w") as f:
        f.write(svg_content)
    print(f"Generated: {OUTPUT_DIR / 'tier2_bcu.svg'}")


def tier2_bmu_cell_info():
    """Tier 2: BMU Page - Cell Information"""
    img, draw = canvas()
    
    tabs = ["SYS", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=2)
    
    draw_title(draw, "Cell Information", "Tier 2: Individual Cell Data (Voltage, SOC, SOH, Temperature)")
    
    y = 200
    
    # Pack selector and configuration
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((170, y + 15), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 50
    
    # Cell configuration
    draw.text((40, y), "Cell Configuration: 15S 2P (30 cells total)", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    draw_divider(draw, y)
    y += 30
    
    # Cell data grid
    draw.text((40, y), "Cell Data", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Display cells in grid (30 cells, 15 columns x 2 rows for 15S2P)
    cell_count = 30
    cols = 10
    rows = (cell_count + cols - 1) // cols
    start_x = 40
    start_y = y
    
    for idx in range(cell_count):
        col = idx % cols
        row = idx // cols
        x = start_x + col * 180
        cell_y = start_y + row * 120
        
        # Cell card
        draw.rounded_rectangle((x, cell_y, x + 160, cell_y + 100), radius=4, fill=COLORS["card_bg"])
        
        # Cell ID
        draw.text((x + 5, cell_y + 5), f"Cell {idx+1:02d}", font=fonts["small"], fill=COLORS["text"])
        
        # Voltage
        voltage = 3.54 + (idx % 5) * 0.02
        draw.text((x + 5, cell_y + 30), f"Voltage: {voltage:.2f}V", font=fonts["tiny"], fill=COLORS["text"])
        
        # SOC (if available)
        soc = 85.0 + (idx % 3) * 2.0
        draw.text((x + 5, cell_y + 50), f"SOC: {soc:.1f}%", font=fonts["tiny"], fill=COLORS["text"])
        
        # SOH (if available)
        soh = 93.0 - (idx % 2) * 1.0
        draw.text((x + 5, cell_y + 70), f"SOH: {soh:.1f}%", font=fonts["tiny"], fill=COLORS["text"])
        
        # Status indicator
        status_color = COLORS["chip_ok"]
        if voltage > 3.60:
            status_color = COLORS["chip_warn"]
        elif voltage < 3.50:
            status_color = COLORS["chip_error"]
        
        draw.ellipse((x + 130, cell_y + 10, x + 150, cell_y + 30), fill=status_color)
    
    img.save(OUTPUT_DIR / "tier2_bmu_cell_info.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_bmu_cell_info.png'}")
    
    # Generate SVG
    generate_svg_tier2_bmu_cell_info()


def generate_svg_tier2_bmu_cell_info():
    """Generate SVG version of tier2_bmu_cell_info"""
    svg_content = f'''<svg width="{WIDTH}" height="{HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="{COLORS['bg']}"/>
  
  <!-- Tabs -->
  <g id="tabs">
    <rect x="40" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="90" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">SYS</text>
    <rect x="150" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="200" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">BCU</text>
    <rect x="260" y="20" width="100" height="50" rx="8" fill="{COLORS['tab_active']}"/>
    <text x="310" y="50" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">BMU</text>
    <rect x="370" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="420" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">EVT</text>
  </g>
  
  <!-- Title -->
  <text x="40" y="140" fill="{COLORS['text']}" font-size="48" font-family="Arial" font-weight="bold">Cell Information</text>
  <text x="40" y="180" fill="{COLORS['muted']}" font-size="24" font-family="Arial">Tier 2: Individual Cell Data (Voltage, SOC, SOH, Temperature)</text>
  <line x1="40" y1="200" x2="1880" y2="200" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Pack selector -->
  <text x="40" y="250" fill="{COLORS['text']}" font-size="20" font-family="Arial">Pack:</text>
  <rect x="120" y="235" width="100" height="30" rx="4" fill="{COLORS['card_bg']}"/>
  <text x="170" y="255" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">P1</text>
  
  <!-- Cell configuration -->
  <text x="40" y="300" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Cell Configuration: 15S 2P (30 cells total)</text>
  <line x1="40" y1="320" x2="1880" y2="320" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Cell grid (simplified) -->
  <g id="cells">
    <rect x="40" y="350" width="160" height="100" rx="4" fill="{COLORS['card_bg']}"/>
    <text x="50" y="370" fill="{COLORS['text']}" font-size="14" font-family="Arial">Cell 01</text>
    <text x="50" y="390" fill="{COLORS['text']}" font-size="12" font-family="Arial">Voltage: 3.54V</text>
    <text x="50" y="410" fill="{COLORS['text']}" font-size="12" font-family="Arial">SOC: 85.0%</text>
    <text x="50" y="430" fill="{COLORS['text']}" font-size="12" font-family="Arial">SOH: 93.0%</text>
    <circle cx="145" cy="365" r="10" fill="{COLORS['chip_ok']}"/>
  </g>
</svg>'''
    
    with open(OUTPUT_DIR / "tier2_bmu_cell_info.svg", "w") as f:
        f.write(svg_content)
    print(f"Generated: {OUTPUT_DIR / 'tier2_bmu_cell_info.svg'}")


def tier2_bmu_temperature():
    """Tier 2: BMU Page - Temperature Points"""
    img, draw = canvas()
    
    tabs = ["SYS", "BCU", "BMU", "EVT"]
    draw_tabs(draw, tabs, active_idx=2)
    
    draw_title(draw, "Temperature Points", "Tier 2: Temperature Monitoring Points (Not per cell)")
    
    y = 200
    
    # Pack selector
    draw.text((40, y), "Pack:", font=fonts["body"], fill=COLORS["text"])
    draw.rounded_rectangle((120, y - 5, 220, y + 35), radius=4, fill=COLORS["card_bg"])
    draw.text((170, y + 15), "P1", font=fonts["body"], fill=COLORS["text"])
    draw.text((280, y), "Previous", font=fonts["small"], fill=COLORS["accent"])
    draw.text((380, y), "Next", font=fonts["small"], fill=COLORS["accent"])
    
    y += 50
    draw_divider(draw, y)
    y += 30
    
    # Temperature points
    draw.text((40, y), "Temperature Points", font=fonts["heading"], fill=COLORS["text"])
    y += 50
    
    # Display temperature points (8 points as example)
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
        
        draw.rounded_rectangle((x, start_y, x + 200, start_y + 60), radius=6, fill=COLORS["card_bg"])
        draw.text((x + 10, start_y + 15), f"Temp Point {idx+1}", font=fonts["body"], fill=COLORS["text"])
        draw.text((x + 10, start_y + 40), f"{temp:.1f} °C", font=fonts["heading"], fill=COLORS["text"])
        
        # Status indicator
        status_color = COLORS["chip_ok"] if temp_status == "ok" else COLORS["chip_warn"]
        draw.ellipse((x + 160, start_y + 15, x + 180, start_y + 35), fill=status_color)
    
    img.save(OUTPUT_DIR / "tier2_bmu_temperature.png")
    print(f"Generated: {OUTPUT_DIR / 'tier2_bmu_temperature.png'}")
    
    # Generate SVG
    generate_svg_tier2_bmu_temperature()


def generate_svg_tier2_bmu_temperature():
    """Generate SVG version of tier2_bmu_temperature"""
    svg_content = f'''<svg width="{WIDTH}" height="{HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="{COLORS['bg']}"/>
  
  <!-- Tabs -->
  <g id="tabs">
    <rect x="40" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="90" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">SYS</text>
    <rect x="150" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="200" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">BCU</text>
    <rect x="260" y="20" width="100" height="50" rx="8" fill="{COLORS['tab_active']}"/>
    <text x="310" y="50" text-anchor="middle" fill="#FFFFFF" font-size="20" font-family="Arial">BMU</text>
    <rect x="370" y="20" width="100" height="50" rx="8" fill="{COLORS['tab']}"/>
    <text x="420" y="50" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">EVT</text>
  </g>
  
  <!-- Title -->
  <text x="40" y="140" fill="{COLORS['text']}" font-size="48" font-family="Arial" font-weight="bold">Temperature Points</text>
  <text x="40" y="180" fill="{COLORS['muted']}" font-size="24" font-family="Arial">Tier 2: Temperature Monitoring Points (Not per cell)</text>
  <line x1="40" y1="200" x2="1880" y2="200" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Pack selector -->
  <text x="40" y="250" fill="{COLORS['text']}" font-size="20" font-family="Arial">Pack:</text>
  <rect x="120" y="235" width="100" height="30" rx="4" fill="{COLORS['card_bg']}"/>
  <text x="170" y="255" text-anchor="middle" fill="{COLORS['text']}" font-size="20" font-family="Arial">P1</text>
  
  <line x1="40" y1="280" x2="1880" y2="280" stroke="{COLORS['line']}" stroke-width="2"/>
  
  <!-- Temperature points -->
  <text x="40" y="310" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">Temperature Points</text>
  
  <g id="temp_points">
    <rect x="40" y="330" width="200" height="60" rx="6" fill="{COLORS['card_bg']}"/>
    <text x="50" y="350" fill="{COLORS['text']}" font-size="20" font-family="Arial">Temp Point 1</text>
    <text x="50" y="375" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">27.0 °C</text>
    <circle cx="220" cy="345" r="10" fill="{COLORS['chip_ok']}"/>
    
    <rect x="260" y="330" width="200" height="60" rx="6" fill="{COLORS['card_bg']}"/>
    <text x="270" y="350" fill="{COLORS['text']}" font-size="20" font-family="Arial">Temp Point 2</text>
    <text x="270" y="375" fill="{COLORS['text']}" font-size="32" font-family="Arial" font-weight="bold">27.6 °C</text>
    <circle cx="440" cy="345" r="10" fill="{COLORS['chip_ok']}"/>
  </g>
</svg>'''
    
    with open(OUTPUT_DIR / "tier2_bmu_temperature.svg", "w") as f:
        f.write(svg_content)
    print(f"Generated: {OUTPUT_DIR / 'tier2_bmu_temperature.svg'}")


def main():
    """Generate all Tier 2 design images"""
    print("Generating Tier 2 BMS design images...")
    print("=" * 50)
    
    tier2_sys()
    tier2_bcu()
    tier2_bmu_cell_info()
    tier2_bmu_temperature()
    
    print("\n" + "=" * 50)
    print(f"All designs generated in: {OUTPUT_DIR}")
    print("Total: 8 files (4 PNG + 4 SVG)")


if __name__ == "__main__":
    main()
