from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1920, 1080
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
OUTPUT_DIR = Path(__file__).resolve().parent

font_48 = ImageFont.truetype(FONT_PATH, 48)
font_36 = ImageFont.truetype(FONT_PATH, 36)
font_28 = ImageFont.truetype(FONT_PATH, 28)
font_24 = ImageFont.truetype(FONT_PATH, 24)
font_20 = ImageFont.truetype(FONT_PATH, 20)
font_18 = ImageFont.truetype(FONT_PATH, 18)


def rounded(draw: ImageDraw.ImageDraw, box, radius=24, fill=None, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def write(draw, xy, text, font=font_24, fill="#E0E6EF"):
    draw.text(xy, text, font=font, fill=fill)


def draw_header(draw, title, subtitle, accent, y=36):
    write(draw, (64, y), title, font=font_48, fill="#FFFFFF")
    write(draw, (64, y + 64), subtitle, font=font_28, fill="#A5B4CE")
    draw.rectangle((64, y + 120, 300, y + 125), fill=accent)


def top_stat_cards(draw, cards, area, accent):
    x0, y0, x1, y1 = area
    width = (x1 - x0 - (len(cards) - 1) * 24) / len(cards)
    for idx, card in enumerate(cards):
        left = x0 + idx * (width + 24)
        right = left + width
        rounded(draw, (left, y0, right, y1), fill="#182235", outline=accent)
        write(draw, (left + 24, y0 + 20), card[0], font=font_24, fill="#A5B4CE")
        write(draw, (left + 24, y0 + 70), card[1], font=font_36, fill="#FFFFFF")
        write(draw, (left + 24, y0 + 130), card[2], font=font_20, fill=accent)


def converter_stack(draw, origin, count, name_prefix, accent):
    x, y = origin
    width, height = 200, 260
    for i in range(count):
        top = y
        left = x + i * (width + 32)
        rounded(draw, (left, top, left + width, top + height), fill="#101726", outline="#2B3A55")
        write(draw, (left + 16, top + 16), f"{name_prefix}-{i+1}", font=font_24, fill="#FFFFFF")
        write(draw, (left + 16, top + 70), "状态: 正常" if i % 2 == 0 else "状态: 待机", font=font_20)
        write(draw, (left + 16, top + 110), f"功率 {92 - i*5}kW", font=font_20)
        bar_y = top + 160
        draw.rectangle((left + 16, bar_y, left + width - 16, bar_y + 18), outline="#2F415E", width=2)
        fill_width = (width - 32) * (0.7 - i * 0.08)
        draw.rectangle((left + 16, bar_y, left + 16 + fill_width, bar_y + 18), fill=accent)
        write(draw, (left + 16, bar_y + 28), "载荷", font=font_18)


def draw_energy_flow(draw, center, accent):
    cx, cy = center
    rounded(draw, (cx - 160, cy - 100, cx + 160, cy + 80), radius=48, fill="#0F1A2B", outline=accent)
    write(draw, (cx - 100, cy - 30), "PCS 集流", font=font_28)
    write(draw, (cx - 120, cy + 20), "1650 kW / 1320 A", font=font_24, fill=accent)
    nodes = [
        (cx - 480, cy - 140, "并网"),
        (cx - 480, cy + 120, "BMS"),
        (cx + 480, cy - 140, "负载"),
        (cx + 480, cy + 120, "EMS"),
    ]
    for nx, ny, label in nodes:
        rounded(draw, (nx - 110, ny - 40, nx + 110, ny + 40), radius=30, fill="#182235", outline="#2B3A55")
        write(draw, (nx - 60, ny - 15), label, font=font_24)
        draw.line((nx, ny, cx - 160 if nx < cx else cx + 160, cy - 10 if ny < cy else cy + 10), fill=accent, width=6)


def draw_alarm_panel(draw, box, title):
    rounded(draw, box, fill="#1C2335", outline="#EA5C5C")
    x0, y0, x1, _ = box
    write(draw, (x0 + 24, y0 + 16), title, font=font_28, fill="#FF8282")
    y = y0 + 70
    alerts = ["PCS-3 低压锁定", "PCS-5 风扇异常", "并网功率上限接近", "通信链路冗余切换"]
    for alert in alerts:
        write(draw, (x0 + 24, y), f"• {alert}", font=font_20, fill="#FFD2D2")
        y += 40


def pcs_overview():
    img = Image.new("RGB", (WIDTH, HEIGHT), color="#050812")
    draw = ImageDraw.Draw(img)
    accent = "#3AD1FF"
    draw_header(draw, "PCS 集装箱控制台", "实时监控 + 调度 + 预警", accent)
    top_stat_cards(draw,
                   [("功率", "1650 kW", "出处: 并网"),
                    ("电流", "1320 A", "母线: 1250.5 V"),
                    ("效率", "97.2%", "升至 4%"),
                    ("温度", "46.5 ℃", "冷却站在 65%")],
                   (64, 180, WIDTH - 64, 320), accent)
    draw_energy_flow(draw, (WIDTH // 2, 500), accent)
    converter_stack(draw, (220, 640), 6, "PCS", accent)
    draw_alarm_panel(draw, (WIDTH - 420, 360, WIDTH - 64, 620), "实时告警")
    img.save(OUTPUT_DIR / "pcs_overview_primary.png")


def pcs_matrix():
    img = Image.new("RGB", (WIDTH, HEIGHT), color="#0B1320")
    draw = ImageDraw.Draw(img)
    accent = "#FFB547"
    draw_header(draw, "PCS 机组矩阵", "多机活动热力图", accent, y=32)
    rounded(draw, (64, 160, WIDTH - 64, 340), fill="#141C2B", outline="#2C3A56")
    write(draw, (84, 190), "运行计划 / 24h", font=font_28)
    for i in range(6):
        x = 84 + i * 280
        draw.rectangle((x, 250, x + 220, 300), fill="#1F2B3F")
        write(draw, (x + 12, 255), f"{6 + i}:00", font=font_20, fill="#FFB547")
    # grid of converters
    cols, rows = 4, 3
    grid_x0, grid_y0 = 64, 380
    cell_w = (WIDTH - 128 - (cols - 1) * 24) / cols
    cell_h = 160
    for r in range(rows):
        for c in range(cols):
            left = grid_x0 + c * (cell_w + 24)
            top = grid_y0 + r * (cell_h + 24)
            rounded(draw, (left, top, left + cell_w, top + cell_h), fill="#121A2A", outline="#283650")
            idx = r * cols + c + 1
            write(draw, (left + 20, top + 16), f"PCS #{idx}", font=font_24)
            write(draw, (left + 20, top + 70), f"功率 {120 - idx * 3}kW", font=font_20)
            draw.rectangle((left + 20, top + 110, left + cell_w - 20, top + 130), outline="#394867", width=2)
            fill_ratio = 0.3 + 0.05 * ((idx + r) % 6)
            draw.rectangle((left + 20, top + 110, left + 20 + (cell_w - 40) * fill_ratio, top + 130), fill=accent)
    draw_alarm_panel(draw, (WIDTH - 360, 160, WIDTH - 64, 340), "站级策略")
    img.save(OUTPUT_DIR / "pcs_overview_matrix.png")


def pcs_cards():
    img = Image.new("RGB", (WIDTH, HEIGHT), color="#040814")
    draw = ImageDraw.Draw(img)
    accent = "#7CF5C6"
    draw_header(draw, "PCS 舱室总览", "集装箱拓扑 + 舱内环境", accent, y=30)
    # layout map
    rounded(draw, (64, 160, 940, 760), fill="#0E1725", outline="#25564C")
    write(draw, (84, 190), "集装箱布局", font=font_28)
    for i in range(4):
        left = 100 + i * 200
        top = 260
        rounded(draw, (left, top, left + 150, top + 300), radius=40, fill="#12212C", outline=accent)
        write(draw, (left + 20, top + 20), f"变流器 {i+1}", font=font_24)
        write(draw, (left + 20, top + 90), f"功率 {180 - i*20}kW", font=font_20)
        write(draw, (left + 20, top + 140), f"温度 {34 + i}℃", font=font_20)
    # environment strip
    rounded(draw, (64, 780, 940, 980), fill="#101B2A", outline="#2E3E57")
    env = ["舱温 32℃", "湿度 58%", "消防 正常", "空调 67%", "烟感 正常"]
    for idx, label in enumerate(env):
        write(draw, (84 + idx * 170, 830), label, font=font_24, fill="#A0B8C9")
    # right column cards
    right_x = 1020
    for idx, title in enumerate(["能量曲线", "并离网状态", "维护日志"]):
        top = 200 + idx * 210
        rounded(draw, (right_x, top, WIDTH - 64, top + 180), fill="#0F1C26", outline="#1F3B3D")
        write(draw, (right_x + 24, top + 16), title, font=font_24, fill="#FFFFFF")
        if idx == 0:
            for i in range(7):
                x = right_x + 24 + i * 120
                draw.line((x, top + 140, x + 60, top + 80), fill=accent, width=4)
        elif idx == 1:
            write(draw, (right_x + 24, top + 86), "状态: 并网", font=font_28, fill=accent)
            write(draw, (right_x + 24, top + 126), "待机备用: 1", font=font_20)
        else:
            write(draw, (right_x + 24, top + 70), "07:35 远程例检完成", font=font_20)
            write(draw, (right_x + 24, top + 110), "05:12 PCS#2 例行消缺", font=font_20)
    img.save(OUTPUT_DIR / "pcs_overview_cards.png")


# BMS tiered layouts

def bms_tree_background(title, subtitle, accent, gradient=False):
    bg = Image.new("RGB", (WIDTH, HEIGHT), color="#050B14")
    draw = ImageDraw.Draw(bg)
    draw_header(draw, title, subtitle, accent, y=28)
    if gradient:
        for i in range(HEIGHT):
            alpha = int(80 * (1 - i / HEIGHT))
            draw.line((0, i, WIDTH, i), fill=(12, 24, 44,))
    return bg, draw


def bms_tier3_overview():
    accent = "#5AD7FF"
    img, draw = bms_tree_background("BMS 三级架构", "电池堆-簇-包-单体", accent)
    # left stack summary
    rounded(draw, (64, 180, 420, 880), fill="#0E1725", outline="#23405B")
    sections = [
        ("电池堆 STK-A", "电压 1250.5V / 1320A"),
        ("高压箱", "正极合 / 负极合"),
        ("告警", "0 级联锁 / 3 一般"),
        ("均衡", "SOC 平衡差 2.1%"),
    ]
    y = 210
    for title, desc in sections:
        write(draw, (84, y), title, font=font_28)
        write(draw, (84, y + 40), desc, font=font_20, fill="#8FB7D8")
        y += 120
    # tree connectors
    root = (720, 260)
    write(draw, (root[0] - 60, root[1] - 60), "电池堆", font=font_28)
    rounded(draw, (root[0] - 140, root[1] - 30, root[0] + 140, root[1] + 30), fill="#101B2C", outline=accent)
    clusters = []
    for i in range(3):
        cx = 520 + i * 260
        cy = 480
        clusters.append((cx, cy))
        rounded(draw, (cx - 120, cy - 30, cx + 120, cy + 30), fill="#0D1628", outline="#2E415F")
        write(draw, (cx - 90, cy - 10), f"簇 C{i+1} | 1250V", font=font_20)
        draw.line((root[0], root[1] + 30, cx, cy - 30), fill=accent, width=4)
    for idx, (cx, cy) in enumerate(clusters):
        pack_y = 640
        for j in range(2):
            px = cx - 120 + j * 120
            rounded(draw, (px - 80, pack_y - 30, px + 80, pack_y + 30), fill="#0B1422", outline="#345B63")
            write(draw, (px - 68, pack_y - 10), f"包 P{idx+1}-{j+1}", font=font_20)
            draw.line((cx, cy + 30, px, pack_y - 30), fill="#4AE0C8", width=3)
            # cells row
            cells_y = 780
            for k in range(6):
                cell_x = px - 70 + k * 24
                draw.rectangle((cell_x, cells_y, cell_x + 18, cells_y + 60), fill="#132439", outline="#1F405A", width=1)
                if k % 2:
                    draw.rectangle((cell_x, cells_y + 30, cell_x + 18, cells_y + 60), fill="#18C29C")
    img.save(OUTPUT_DIR / "bms_tier3_overview.png")


def bms_tier3_balancing():
    accent = "#FFC857"
    img, draw = bms_tree_background("BMS 三级均衡视图", "热力图 + 温度点", accent)
    rounded(draw, (64, 180, WIDTH - 64, 360), fill="#111B2A", outline="#2D3E57")
    write(draw, (84, 210), "堆 STK-A 状态", font=font_28)
    write(draw, (84, 260), "功率 1650kW / SOC 93% / SOH 91%", font=font_24, fill="#BFD7FF")
    draw.rectangle((WIDTH - 360, 200, WIDTH - 120, 320), outline=accent, width=3)
    write(draw, (WIDTH - 340, 220), "均衡策略: 动态", font=font_24)
    write(draw, (WIDTH - 340, 260), "差值阈 2.5%", font=font_20)
    # heatmap for packs
    packs = 12
    start_x = 120
    start_y = 420
    for i in range(packs):
        left = start_x + (i % 6) * 280
        top = start_y + (i // 6) * 220
        rounded(draw, (left, top, left + 240, top + 180), fill="#0B131F", outline="#37445E")
        write(draw, (left + 20, top + 16), f"簇 C{(i//3)+1} 包 P{i+1}", font=font_20)
        # temperature dots
        for t in range(5):
            dot_x = left + 30 + t * 40
            dot_y = top + 100
            temp = 24 + (i + t) % 7
            color = "#58FFB0" if temp < 32 else "#FF6B6B"
            draw.ellipse((dot_x, dot_y, dot_x + 26, dot_y + 26), fill=color)
            write(draw, (dot_x - 4, dot_y + 34), f"{temp}℃", font=font_18)
        draw.rectangle((left + 20, top + 150, left + 220, top + 165), outline="#2E3F55", width=2)
        fill_ratio = 0.4 + (i % 5) * 0.1
        draw.rectangle((left + 20, top + 150, left + 20 + 200 * fill_ratio, top + 165), fill=accent)
    img.save(OUTPUT_DIR / "bms_tier3_balancing.png")


def bms_tier3_health():
    accent = "#9B7BFF"
    img, draw = bms_tree_background("BMS 三级健康分析", "生命周期 / 保护逻辑", accent)
    rounded(draw, (64, 190, WIDTH - 420, 380), fill="#111728", outline="#482D5C")
    write(draw, (84, 220), "保护链路", font=font_28)
    protections = ["高压箱: 双断路器", "簇级: 绝缘检测", "包级: 温感矩阵", "单体: 过压/欠压"]
    for idx, text in enumerate(protections):
        write(draw, (84 + idx * 320, 280), text, font=font_20, fill="#C9B9FF")
    # right column timeline
    rounded(draw, (WIDTH - 360, 190, WIDTH - 64, 880), fill="#151028", outline="#4A3677")
    write(draw, (WIDTH - 340, 220), "寿命预测", font=font_24, fill="#FFFFFF")
    checkpoints = [
        ("2025-12", "循环 3200 / SOH 92%"),
        ("2027-06", "循环 5200 / SOH 88%"),
        ("2030-01", "更换建议"),
    ]
    y = 280
    for date, desc in checkpoints:
        write(draw, (WIDTH - 340, y), date, font=font_20, fill=accent)
        write(draw, (WIDTH - 340, y + 36), desc, font=font_20)
        y += 140
    # radial charts for stacks
    center_y = 520
    for i in range(3):
        cx = 220 + i * 360
        cy = 600
        rounded(draw, (cx - 140, cy - 140, cx + 140, cy + 140), radius=100, fill="#180F2A", outline="#3F2A63")
        write(draw, (cx - 80, cy - 110), f"簇 C{i+1}", font=font_24)
        draw.arc((cx - 100, cy - 100, cx + 100, cy + 100), start=0, end=280 - i * 30, fill=accent, width=16)
        write(draw, (cx - 40, cy - 10), f"SOH {94 - i*3}%", font=font_24)
        write(draw, (cx - 70, cy + 50), f"均衡差 {1.2 + i*0.3}%", font=font_20)
    img.save(OUTPUT_DIR / "bms_tier3_health.png")


def bms_tier2_clusterfocus():
    accent = "#5CE0B5"
    img, draw = bms_tree_background("BMS 二级簇视图", "簇-包-单体", accent)
    rounded(draw, (64, 180, WIDTH - 64, 340), fill="#0E1724", outline="#2C3C4E")
    write(draw, (84, 210), "簇 CLU-01 高压箱", font=font_28)
    write(draw, (84, 260), "断路器: 合闸 / 电压 1250V / 电流 820A", font=font_24, fill="#A6BED3")
    # packs row
    start_y = 380
    for i in range(5):
        left = 84 + i * 360
        rounded(draw, (left, start_y, left + 300, start_y + 260), fill="#101C2B", outline="#314855")
        write(draw, (left + 20, start_y + 16), f"包 #{i+1}", font=font_24)
        write(draw, (left + 20, start_y + 60), f"SOC {92 - i*3}%", font=font_20)
        write(draw, (left + 20, start_y + 94), f"温差 {4 - i*0.5}℃", font=font_20)
        draw.rectangle((left + 20, start_y + 140, left + 280, start_y + 160), outline="#3E5364", width=2)
        draw.rectangle((left + 20, start_y + 140, left + 20 + 260 * (0.7 - i*0.08), start_y + 160), fill=accent)
        # cells grid
        for c in range(10):
            cell_x = left + 24 + (c % 5) * 52
            cell_y = start_y + 190 + (c // 5) * 28
            draw.rectangle((cell_x, cell_y, cell_x + 44, cell_y + 20), fill="#16263A", outline="#274055")
    img.save(OUTPUT_DIR / "bms_tier2_clusterfocus.png")


def bms_tier2_packdrill():
    accent = "#F26D85"
    img, draw = bms_tree_background("BMS 二级包诊断", "单体 + 温度曲线", accent)
    rounded(draw, (64, 190, WIDTH - 420, 420), fill="#131B2C", outline="#41324E")
    write(draw, (84, 220), "选择包: P-07", font=font_28)
    write(draw, (84, 270), "串联: 2 串 15 并", font=font_24, fill="#C4BBDD")
    # line chart placeholder
    for i in range(12):
        x = 84 + i * 120
        draw.line((x, 360, x + 80, 260), fill=accent, width=4)
    # right side list
    rounded(draw, (WIDTH - 360, 190, WIDTH - 64, 540), fill="#1A1324", outline="#5E314B")
    write(draw, (WIDTH - 340, 220), "温度探针", font=font_24)
    for i in range(5):
        t = 28 + i * 2
        color = "#F26D85" if t > 32 else "#7CF3D0"
        write(draw, (WIDTH - 340, 260 + i * 48), f"T{i+1}  {t}℃", font=font_20, fill=color)
    # cell matrix
    start_x = 84
    start_y = 460
    for row in range(3):
        for col in range(10):
            left = start_x + col * 100
            top = start_y + row * 120
            rounded(draw, (left, top, left + 80, top + 100), fill="#111728", outline="#3C2544")
            write(draw, (left + 12, top + 16), f"单体 {row*10+col+1}", font=font_18)
            state = 3.6 + ((row * 10 + col) % 4) * 0.05
            write(draw, (left + 12, top + 50), f"{state:.2f}V", font=font_18)
    img.save(OUTPUT_DIR / "bms_tier2_packdrill.png")


def bms_tier2_alerts():
    accent = "#45A0FF"
    img, draw = bms_tree_background("BMS 二级告警面板", "簇态势 + 告警轨迹", accent)
    # dual column layout
    rounded(draw, (64, 190, 980, 880), fill="#0F1624", outline="#233A5C")
    write(draw, (84, 220), "簇健康热力图", font=font_28)
    for r in range(5):
        for c in range(4):
            left = 84 + c * 210
            top = 280 + r * 110
            rounded(draw, (left, top, left + 180, top + 90), fill="#101B2B", outline="#335177")
            write(draw, (left + 12, top + 12), f"包 {r*4 + c + 1}", font=font_20)
            write(draw, (left + 12, top + 44), f"SOC {96 - (r+c)*2}%", font=font_18)
            draw.rectangle((left + 12, top + 70, left + 168, top + 82), fill="#1E2F45")
            draw.rectangle((left + 12, top + 70, left + 12 + 156 * (0.8 - (r+c)*0.05), top + 82), fill=accent)
    rounded(draw, (1040, 190, WIDTH - 64, 520), fill="#111F2E", outline="#2E4C76")
    write(draw, (1060, 220), "实时告警", font=font_28)
    alerts = [
        ("07:32", "包#11 单体欠压"),
        ("06:58", "簇绝缘电阻偏低"),
        ("06:12", "温度剖面异常"),
        ("05:20", "通信链路切换"),
    ]
    y = 270
    for ts, text in alerts:
        write(draw, (1060, y), ts, font=font_24, fill=accent)
        write(draw, (1160, y), text, font=font_24)
        y += 70
    rounded(draw, (1040, 560, WIDTH - 64, 880), fill="#0F1926", outline="#2D364F")
    write(draw, (1060, 590), "策略建议", font=font_24)
    tips = ["将簇#3 负荷降至 80%", "触发风冷冗余", "准备手自动切换"]
    for idx, tip in enumerate(tips):
        write(draw, (1060, 640 + idx * 60), f"• {tip}", font=font_24, fill="#B6C9E0")
    img.save(OUTPUT_DIR / "bms_tier2_alerts.png")


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pcs_overview()
    pcs_matrix()
    pcs_cards()
    bms_tier3_overview()
    bms_tier3_balancing()
    bms_tier3_health()
    bms_tier2_clusterfocus()
    bms_tier2_packdrill()
    bms_tier2_alerts()
