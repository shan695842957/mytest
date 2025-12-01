from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1920, 1080
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
OUTPUT_DIR = Path(__file__).resolve().parent / "bms_v3"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

font_54 = ImageFont.truetype(FONT_PATH, 54)
font_36 = ImageFont.truetype(FONT_PATH, 36)
font_28 = ImageFont.truetype(FONT_PATH, 28)
font_24 = ImageFont.truetype(FONT_PATH, 24)
font_20 = ImageFont.truetype(FONT_PATH, 20)
font_18 = ImageFont.truetype(FONT_PATH, 18)

COLORS = {
    "bg": "#F4F6FB",
    "tab": "#E0E5F2",
    "tab_active": "#2F80FF",
    "text": "#1F2A44",
    "muted": "#66738C",
    "line": "#C9D3E7",
    "chip_bg": "#E9EDFA",
    "chip_alert": "#FF8B6A",
    "chip_warn": "#FFC75A",
    "chip_ok": "#47D7A5",
    "accent": "#00A3FF",
    "accent_2": "#6A5BFF",
}


def canvas():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=COLORS["bg"])
    return img, ImageDraw.Draw(img)


def draw_tabs(draw: ImageDraw.ImageDraw, active="BCU"):
    tabs = ["SYS", "BAU", "BCU", "BMU", "EVT"]
    x = 80
    for tab in tabs:
        label_width = draw.textlength(tab, font=font_24)
        w = label_width + 80
        fill = COLORS["tab_active"] if tab == active else COLORS["tab"]
        text_color = "#FFFFFF" if tab == active else COLORS["text"]
        draw.rounded_rectangle((x, 40, x + w, 108), radius=34, fill=fill)
        draw.text((x + (w - label_width) / 2, 60 - font_24.size / 2 + 12), tab, font=font_24, fill=text_color)
        x += w + 24


def title(draw, main, sub):
    draw.text((80, 130), main, font=font_54, fill=COLORS["text"])
    draw.text((80, 200), sub, font=font_24, fill=COLORS["muted"])
    draw.line((80, 232, WIDTH - 80, 232), fill=COLORS["line"], width=3)


def chip(draw, xy, text, color):
    x, y = xy
    w = draw.textlength(text, font=font_20) + 40
    draw.rounded_rectangle((x, y, x + w, y + 40), radius=20, fill=color)
    draw.text((x + 20, y + 8), text, font=font_20, fill="#FFFFFF")


def metric_pair(draw, pos, label_en, label_cn, value):
    x, y = pos
    draw.text((x, y), f"{label_en} / {label_cn}", font=font_20, fill=COLORS["muted"])
    draw.text((x, y + 34), value, font=font_36, fill=COLORS["text"])


def divider(draw, y):
    draw.line((80, y, WIDTH - 80, y), fill=COLORS["line"], width=2)


def timeline(draw, start_y, events):
    x = 200
    draw.line((x, start_y, x, start_y + 380), fill=COLORS["accent"], width=6)
    dot_y = start_y
    for event in events:
        draw.ellipse((x - 12, dot_y - 12, x + 12, dot_y + 12), fill=COLORS["accent"])
        draw.text((x + 40, dot_y - 12), f"{event[0]}  {event[1]}", font=font_24, fill=COLORS["text"])
        draw.text((x + 40, dot_y + 20), event[2], font=font_20, fill=COLORS["muted"])
        dot_y += 110


def ring(draw, center, radius, value, label):
    cx, cy = center
    draw.arc((cx - radius, cy - radius, cx + radius, cy + radius), start=0, end=int(360 * value), fill=COLORS["accent_2"], width=18)
    draw.text((cx - 60, cy - 20), f"{int(value * 100)}%", font=font_28, fill=COLORS["text"])
    draw.text((cx - 80, cy + 20), label, font=font_20, fill=COLORS["muted"])


def draw_cluster_stream(draw, origin_x, origin_y, title_text, packs):
    draw.text((origin_x, origin_y), title_text, font=font_28, fill=COLORS["text"])
    draw.text((origin_x, origin_y + 32), "Parallel Branch", font=font_18, fill=COLORS["muted"])
    y = origin_y + 80
    for pack in packs:
        draw.line((origin_x + 40, y - 10, origin_x + 360, y - 10), fill=COLORS["line"], width=4)
        chip(draw, (origin_x + 380, y - 30), pack[1], COLORS["chip_ok"] if "OK" in pack[1] else COLORS["chip_warn"])
        draw.text((origin_x + 40, y - 30), pack[0], font=font_20, fill=COLORS["text"])
        draw.text((origin_x + 40, y), pack[2], font=font_18, fill=COLORS["muted"])
        y += 70


def tier3_monitor():
    img, draw = canvas()
    draw_tabs(draw, active="BCU")
    title(draw, "Stack Monitor", "三级BMS / Stack-Cluster-Module")
    metric_pair(draw, (80, 260), "Stack Voltage", "电池堆电压", "1250.5 V")
    metric_pair(draw, (440, 260), "Stack Current", "电池堆电流", "1320 A")
    metric_pair(draw, (800, 260), "Power", "功率", "1650 kW")
    metric_pair(draw, (1160, 260), "SOC", "荷电状态", "93 %")
    chip(draw, (1520, 268), "Auto Balance", COLORS["chip_ok"])
    divider(draw, 340)
    draw.text((80, 370), "Cluster Health", font=font_28, fill=COLORS["text"])
    cluster_info = [
        ("C1", "ΔV 3.2mV", "Max 13.1℃"),
        ("C2", "ΔV 4.1mV", "Max 12.9℃"),
        ("C3", "ΔV 2.5mV", "Max 13.0℃"),
    ]
    x = 80
    for idx, info in enumerate(cluster_info):
        draw.line((x, 420, x + 420, 420), fill=COLORS["line"], width=16)
        draw.text((x, 390), f"Cluster {info[0]}", font=font_24, fill=COLORS["text"])
        chip(draw, (x + 280, 380), info[1], COLORS["chip_warn"] if idx == 1 else COLORS["chip_ok"])
        draw.text((x, 440), info[2], font=font_20, fill=COLORS["muted"])
        x += 520
    divider(draw, 500)
    draw_cluster_stream(draw, 80, 520, "Pack Stream", [
        ("Pack P1", "SOC 94% OK", "52.4V / ΔT 1.8℃"),
        ("Pack P2", "SOC 92% OK", "52.3V / ΔT 1.6℃"),
        ("Pack P3", "SOC 90% Check", "52.1V / ΔT 2.5℃"),
        ("Pack P4", "SOC 95% OK", "52.5V / ΔT 1.4℃"),
    ])
    draw_cluster_stream(draw, 1000, 520, "Pack Stream", [
        ("Pack P5", "SOC 91% OK", "52.1V / ΔT 1.9℃"),
        ("Pack P6", "SOC 88% Tune", "51.8V / ΔT 2.9℃"),
        ("Pack P7", "SOC 93% OK", "52.4V / ΔT 1.5℃"),
        ("Pack P8", "SOC 90% OK", "52.0V / ΔT 1.6℃"),
    ])
    divider(draw, 820)
    draw.text((80, 860), "Protection Chains", font=font_28, fill=COLORS["text"])
    chips = [
        ("HV Breaker Closed", COLORS["chip_ok"]),
        ("Insulation 980kΩ", COLORS["chip_ok"]),
        ("Cooling Nominal", COLORS["chip_ok"]),
        ("Fire Loop Ready", COLORS["chip_warn"]),
    ]
    x = 80
    for text_value, color in chips:
        chip(draw, (x, 900), text_value, color)
        x += 320
    img.save(OUTPUT_DIR / "bms_tier3_monitor.png")


def tier3_balance():
    img, draw = canvas()
    draw_tabs(draw, active="BCU")
    title(draw, "Balance Control", "Stack Equalization View")
    draw.text((80, 260), "Target ΔSOC", font=font_24, fill=COLORS["muted"])
    draw.text((80, 300), "2.5 %", font=font_54, fill=COLORS["text"])
    chip(draw, (320, 310), "Dynamic", COLORS["chip_ok"])
    draw.text((600, 270), "Temperature Band", font=font_24, fill=COLORS["muted"])
    draw.text((600, 310), "12.4℃ - 33.0℃", font=font_36, fill=COLORS["text"])
    divider(draw, 370)
    draw.text((80, 400), "Pack Heat Map", font=font_28, fill=COLORS["text"])
    start_x = 80
    start_y = 450
    for idx in range(12):
        col = idx % 6
        row = idx // 6
        left = start_x + col * 300
        top = start_y + row * 220
        draw.text((left, top), f"Pack P{idx+1}", font=font_24, fill=COLORS["text"])
        draw.text((left, top + 34), f"SOC {92 - idx*1.2:.1f}%", font=font_20, fill=COLORS["muted"])
        draw.line((left, top + 80, left + 220, top + 80), fill=COLORS["line"], width=6)
        fill_ratio = 0.5 + (idx % 4) * 0.1
        draw.line((left, top + 80, left + 220 * fill_ratio, top + 80), fill=COLORS["accent"], width=6)
        for t in range(4):
            temp = 24 + (idx + t) % 7
            chip(draw, (left + t * 70, top + 110), f"{temp}℃", COLORS["chip_warn"] if temp > 31 else COLORS["chip_bg"])
    divider(draw, 880)
    draw.text((80, 920), "Control Actions", font=font_28, fill=COLORS["text"])
    actions = [
        "• Enable forced balance on C2",
        "• Reduce load 8% for Pack P6",
        "• Schedule cooling flush at 14:00",
        "• Verify insulation probe",
    ]
    y = 960
    for action in actions:
        draw.text((100, y), action, font=font_20, fill=COLORS["muted"])
        y += 32
    img.save(OUTPUT_DIR / "bms_tier3_balance.png")


def tier3_events():
    img, draw = canvas()
    draw_tabs(draw, active="EVT")
    title(draw, "Event Stream", "Live Alarms + Commands")
    timeline(draw, 300, [
        ("08:13", "System Fault", "BCMU7 link lost"),
        ("08:05", "Warning", "Pack P6 ΔT 3.4℃"),
        ("07:58", "Info", "Forced discharge"),
        ("07:35", "Recovery", "Cluster C2 nominal"),
    ])
    divider(draw, 720)
    draw.text((640, 300), "Alarm Indicators", font=font_28, fill=COLORS["text"])
    indicators = [
        ("HV Breaker", COLORS["chip_ok"], "Closed"),
        ("Charge OC", COLORS["chip_warn"], "Watch"),
        ("Discharge OC", COLORS["chip_ok"], "Normal"),
        ("SOC High", COLORS["chip_ok"], "92%"),
        ("Insulation", COLORS["chip_alert"], "450kΩ"),
    ]
    x = 640
    y = 360
    for label, color, state in indicators:
        chip(draw, (x, y), label, color)
        draw.text((x, y + 48), state, font=font_20, fill=COLORS["muted"])
        y += 90
    draw.text((1100, 300), "Command Log", font=font_28, fill=COLORS["text"])
    commands = [
        ("EMS", "Start balance C2"),
        ("On-site", "Reset BCMU7"),
        ("EMS", "Switch to auto"),
        ("Field", "Manual discharge")
    ]
    y = 360
    for source, cmd in commands:
        draw.text((1100, y), source, font=font_24, fill=COLORS["text"])
        draw.text((1100, y + 32), cmd, font=font_20, fill=COLORS["muted"])
        y += 90
    divider(draw, 860)
    draw.text((640, 900), "Maintenance", font=font_28, fill=COLORS["text"])
    draw.text((640, 940), "• Export daily log   • Upload firmware   • Start self-test", font=font_20, fill=COLORS["muted"])
    img.save(OUTPUT_DIR / "bms_tier3_events.png")


def tier2_cluster():
    img, draw = canvas()
    draw_tabs(draw, active="BAU")
    title(draw, "Cluster Overview", "二级架构 / Cluster-Pack")
    metric_pair(draw, (80, 260), "Cluster Voltage", "簇电压", "1250 V")
    metric_pair(draw, (440, 260), "Cluster Current", "簇电流", "820 A")
    metric_pair(draw, (800, 260), "Breaker", "断路器", "Closed")
    metric_pair(draw, (1160, 260), "Cooling", "冷却", "Liquid 63%")
    divider(draw, 340)
    draw.text((80, 380), "Pack Status Row", font=font_28, fill=COLORS["text"])
    start_y = 430
    for idx in range(10):
        y = start_y + idx * 60
        draw.text((80, y), f"Pack {idx+1:02d}", font=font_24, fill=COLORS["text"])
        draw.text((230, y), f"SOC {93 - idx * 0.7:.1f}%", font=font_20, fill=COLORS["muted"])
        draw.line((420, y + 24, 840, y + 24), fill=COLORS["line"], width=4)
        fill_ratio = 0.6 + (idx % 3) * 0.1
        draw.line((420, y + 24, 420 + 400 * fill_ratio, y + 24), fill=COLORS["accent"], width=4)
        chip(draw, (880, y - 6), f"ΔT {1.4 + idx * 0.2:.1f}℃", COLORS["chip_warn"] if idx in (5, 8) else COLORS["chip_bg"])
        chip(draw, (1080, y - 6), "Balance", COLORS["chip_ok"] if idx % 4 else COLORS["chip_warn"])
    divider(draw, 1020)
    draw.text((80, 1040), "Next check: 14:30 EMS", font=font_20, fill=COLORS["muted"])
    img.save(OUTPUT_DIR / "bms_tier2_cluster.png")


def tier2_pack_detail():
    img, draw = canvas()
    draw_tabs(draw, active="BMU")
    title(draw, "Pack Diagnostics", "二级架构 / Pack + Cells")
    metric_pair(draw, (80, 260), "Pack ID", "包编号", "P-07")
    metric_pair(draw, (440, 260), "Format", "串并", "2S 15P")
    metric_pair(draw, (800, 260), "Voltage", "电压", "105.6 V")
    metric_pair(draw, (1160, 260), "Current", "电流", "220 A")
    chip(draw, (1520, 268), "Balancing", COLORS["chip_warn"])
    divider(draw, 340)
    draw.text((80, 380), "Cell Matrix", font=font_28, fill=COLORS["text"])
    cells = 30
    start_x = 80
    start_y = 430
    for idx in range(cells):
        col = idx % 10
        row = idx // 10
        x = start_x + col * 170
        y = start_y + row * 170
        draw.text((x, y), f"Cell {idx+1:02d}", font=font_20, fill=COLORS["text"])
        draw.text((x, y + 30), f"{3.54 + (idx % 5) * 0.02:.2f} V", font=font_20, fill=COLORS["muted"])
        draw.line((x, y + 70, x + 120, y + 70), fill=COLORS["line"], width=4)
        draw.line((x, y + 70, x + 120 * (0.5 + (idx % 4) * 0.1), y + 70), fill=COLORS["accent_2"], width=4)
    divider(draw, 930)
    draw.text((80, 960), "Temperature Probes", font=font_28, fill=COLORS["text"])
    for i in range(8):
        chip(draw, (80 + i * 220, 1000), f"T{i+1}  {27 + i*0.6:.1f}℃", COLORS["chip_warn"] if 27 + i*0.6 > 31 else COLORS["chip_bg"])
    draw.text((80, 1060), "Logs: 11/30 inspection completed", font=font_20, fill=COLORS["muted"])
    img.save(OUTPUT_DIR / "bms_tier2_pack.png")


def tier3_sys():
    img, draw = canvas()
    draw_tabs(draw, active="SYS")
    title(draw, "System Overview", "Tier-3 / Stack + Cluster + Strings")
    metrics = [
        ("System Status", "系统状态", "RUNNING"),
        ("Operation Mode", "运行模式", "Auto Dispatch"),
        ("Stack Voltage", "总电压", "1250.5 V"),
        ("Stack Current", "总电流", "1320 A"),
        ("Power", "功率", "1650 kW"),
        ("SOC", "SOC", "93 %"),
        ("SOH", "SOH", "91 %"),
        ("Insulation", "绝缘", "980 kΩ"),
    ]
    x, y = 80, 260
    for idx, data in enumerate(metrics):
        metric_pair(draw, (x, y), data[0], data[1], data[2])
        x += 360
        if (idx + 1) % 4 == 0:
            x = 80
            y += 90
    divider(draw, 420)
    # breaker info
    draw.text((80, 460), "Breaker Control / 正负极断路器", font=font_28, fill=COLORS["text"])
    chip(draw, (80, 500), "+ Pole Closed", COLORS["chip_ok"])
    chip(draw, (300, 500), "- Pole Closed", COLORS["chip_ok"])
    chip(draw, (520, 500), "Ground Relay Ready", COLORS["chip_ok"])
    chip(draw, (780, 500), "Trip Command", COLORS["chip_warn"])
    divider(draw, 560)
    draw.text((80, 600), "Stack Topology", font=font_28, fill=COLORS["text"])
    draw.line((120, 640, WIDTH - 120, 640), fill="#FF5B5B", width=6)
    # junctions for clusters
    cluster_x = [360, 960, 1560]
    for cx in cluster_x:
        draw.line((cx, 640, cx, 700), fill="#FF5B5B", width=6)
        draw.text((cx - 60, 710), f"Cluster {cluster_x.index(cx)+1}", font=font_24, fill=COLORS["text"])
    # strings
    base_y = 860
    start_x = 200
    spacing = 140
    for idx in range(12):
        x = start_x + idx * spacing
        draw.line((x, 700, x, 730), fill="#FF5B5B", width=4)
        # cell body
        draw.rounded_rectangle((x - 26, 730, x + 26, base_y - 20), radius=24, fill="#CFEED0")
        soc = 12.5 + (idx % 4) * 0.4
        bar_top = 760
        bar_bottom = base_y - 40
        bar_height = bar_bottom - bar_top
        filled = bar_height * (soc / 15)
        fill_top = bar_bottom - filled
        draw.rectangle((x - 18, fill_top, x + 18, bar_bottom), fill="#6AD675")
        draw.text((x - 35, bar_bottom + 10), f"{soc:.1f}%", font=font_18, fill=COLORS["text"])
        draw.text((x - 50, base_y - 40), f"String S{idx+1}", font=font_20, fill=COLORS["text"])
        draw.text((x - 50, base_y - 10), "1250.5V | 110A", font=font_18, fill=COLORS["muted"])
    divider(draw, 900)
    draw.text((80, 940), "Commands: Close All / Open All / Sync PCS", font=font_24, fill=COLORS["muted"])
    draw.text((80, 980), "Timestamp 2025-12-01 09:55 | Mode NORMAL", font=font_20, fill=COLORS["muted"])
    img.save(OUTPUT_DIR / "bms_tier3_sys.png")


def tier2_sys():
    img, draw = canvas()
    draw_tabs(draw, active="SYS")
    title(draw, "System Overview", "Tier-2 / Cluster + Pack")
    metrics = [
        ("Cluster Status", "簇状态", "READY"),
        ("Operation Mode", "运行模式", "Auto"),
        ("Cluster Voltage", "簇电压", "1250 V"),
        ("Cluster Current", "簇电流", "820 A"),
        ("SOC", "SOC", "92 %"),
        ("SOH", "SOH", "90 %"),
        ("Cooling", "冷却", "Liquid 63%"),
        ("Insulation", "绝缘", "910 kΩ"),
    ]
    x, y = 80, 260
    for idx, data in enumerate(metrics):
        metric_pair(draw, (x, y), data[0], data[1], data[2])
        x += 360
        if (idx + 1) % 4 == 0:
            x = 80
            y += 90
    divider(draw, 420)
    draw.text((80, 460), "Cluster CLU-01 Bus", font=font_28, fill=COLORS["text"])
    draw.line((120, 520, WIDTH - 120, 520), fill="#FF5B5B", width=5)
    draw.text((140, 540), "Breaker: Closed", font=font_24, fill=COLORS["muted"])
    # pack branches
    base_y = 900
    start_x = 160
    spacing = 180
    for idx in range(10):
        x = start_x + idx * spacing
        draw.line((x, 520, x, 560), fill="#FF5B5B", width=4)
        draw.ellipse((x - 14, 560, x + 14, 588), fill="#FF5B5B")
        draw.rounded_rectangle((x - 35, 600, x + 35, 840), radius=30, fill="#D6E8FF")
        soc = 90 - idx * 0.8
        height = 180
        fill_height = height * (soc / 100)
        draw.rectangle((x - 20, 800 - fill_height, x + 20, 800), fill="#2F80FF")
        draw.text((x - 50, 620), f"Pack {idx+1:02d}", font=font_20, fill=COLORS["text"])
        draw.text((x - 60, 850), f"{soc:.1f}% | 52.{idx%5}V", font=font_18, fill=COLORS["muted"])
    draw.text((80, 940), "Note: Packs do not own HV breakers; commands issued at cluster level", font=font_20, fill=COLORS["muted"])
    img.save(OUTPUT_DIR / "bms_tier2_sys.png")


def main():
    tier3_sys()
    tier3_monitor()
    tier3_balance()
    tier3_events()
    tier2_sys()
    tier2_cluster()
    tier2_pack_detail()


if __name__ == "__main__":
    main()
