from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1920, 1080
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
OUTPUT_DIR = Path(__file__).resolve().parent / "v2"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

font_48 = ImageFont.truetype(FONT_PATH, 48)
font_36 = ImageFont.truetype(FONT_PATH, 36)
font_30 = ImageFont.truetype(FONT_PATH, 30)
font_26 = ImageFont.truetype(FONT_PATH, 26)
font_24 = ImageFont.truetype(FONT_PATH, 24)
font_22 = ImageFont.truetype(FONT_PATH, 22)
font_20 = ImageFont.truetype(FONT_PATH, 20)
font_18 = ImageFont.truetype(FONT_PATH, 18)

COLORS = {
    "bg": "#EEF1F6",
    "tab_bg": "#DFE5F0",
    "card": "#FFFFFF",
    "border": "#CBD3E1",
    "text": "#1E2A3B",
    "muted": "#6F7C94",
    "accent": "#3C7BFF",
    "accent_soft": "#8FB5FF",
    "alert": "#FF7B67",
    "success": "#52C41A",
    "warning": "#FADB14",
}


def new_canvas():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=COLORS["bg"])
    return img, ImageDraw.Draw(img)


def draw_top_menu(draw, active="BEU", subtitle="PCS 控制台"):
    draw.rectangle((0, 0, WIDTH, 120), fill=COLORS["tab_bg"])
    menu_items = ["语言(L)", "设置(S)", "通讯(C)", "登录(L)"]
    for idx, item in enumerate(menu_items):
        draw.text((32 + idx * 110, 18), item, font=font_20, fill=COLORS["muted"])
    tabs = ["SYS", "BAU", "BEU", "BCU", "BMU", "EVT", "INF", "SN"]
    x = 40
    for tab in tabs:
        box = (x, 50, x + 120, 100)
        fill = COLORS["accent"] if tab == active else COLORS["card"]
        text_color = "#FFFFFF" if tab == active else COLORS["text"]
        draw.rectangle(box, fill=fill, outline=COLORS["border"], width=2)
        w, h = draw.textlength(tab, font=font_22), font_22.size
        draw.text((x + 60 - w / 2, 70 - h / 2), tab, font=font_22, fill=text_color)
        x += 132
    draw.text((WIDTH - 420, 18), subtitle, font=font_22, fill=COLORS["text"])


def draw_bottom_bar(draw, message="2025/12/01 09:55:52 | 一般模式 | SD Card Normal"):
    draw.rectangle((0, HEIGHT - 60, WIDTH, HEIGHT), fill=COLORS["tab_bg"])
    draw.text((32, HEIGHT - 44), message, font=font_20, fill=COLORS["muted"])


def draw_box(draw, box, title=None, title_font=font_22):
    draw.rectangle(box, fill=COLORS["card"], outline=COLORS["border"], width=2)
    if title:
        draw.text((box[0] + 16, box[1] + 12), title, font=title_font, fill=COLORS["text"])


def draw_label_value(draw, pos, label, value, width=200):
    x, y = pos
    draw.rectangle((x, y, x + width, y + 40), outline=COLORS["border"], fill="#F9FBFF")
    draw.text((x + 10, y + 10), label, font=font_18, fill=COLORS["muted"])
    w = draw.textlength(value, font=font_22)
    draw.text((x + width - w - 10, y + 8), value, font=font_22, fill=COLORS["text"])


def draw_status_led(draw, pos, text, color):
    x, y = pos
    draw.rectangle((x, y, x + 140, y + 34), outline=COLORS["border"], fill=COLORS["card"])
    draw.rectangle((x + 10, y + 12, x + 30, y + 22), fill=color)
    draw.text((x + 40, y + 8), text, font=font_18, fill=COLORS["text"])


def draw_table(draw, box, headers, rows, col_widths):
    x0, y0, x1, y1 = box
    draw_box(draw, box)
    x = x0
    for idx, header in enumerate(headers):
        width = col_widths[idx]
        draw.rectangle((x, y0, x + width, y0 + 44), fill="#F2F5FC", outline=COLORS["border"])
        draw.text((x + 12, y0 + 10), header, font=font_20, fill=COLORS["text"])
        x += width
    row_height = 42
    for r_idx, row in enumerate(rows):
        y = y0 + 44 + r_idx * row_height
        x = x0
        for c_idx, cell in enumerate(row):
            width = col_widths[c_idx]
            draw.rectangle((x, y, x + width, y + row_height), outline=COLORS["border"], fill=COLORS["card"])
            draw.text((x + 12, y + 10), cell, font=font_18, fill=COLORS["text"])
            x += width


# PCS pages

def pcs_flat_overview():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="PCS 集控-快速视图")
    draw_bottom_bar(draw)
    # status grid left
    left_box = (32, 140, 620, 700)
    draw_box(draw, left_box, title="PCS 运行状态", title_font=font_30)
    labels = [
        ("功率", "1650 kW"),
        ("母线电压", "1250.5 V"),
        ("母线电流", "1320 A"),
        ("并网模式", "自动"),
        ("冷却", "液冷 76%"),
        ("房体温度", "28.6 ℃"),
        ("空开状态", "合闸"),
        ("冗余机组", "3 台在线"),
    ]
    y = 190
    for label, value in labels:
        draw_label_value(draw, (left_box[0] + 24, y), label, value, width=520)
        y += 56
    # LED rows
    led_items = [
        ("总故障", COLORS["alert"]),
        ("PCS联锁", COLORS["warning"]),
        ("温度异常", COLORS["warning"]),
        ("通讯正常", COLORS["success"]),
        ("绝缘正常", COLORS["success"]),
    ]
    y = 580
    for text, color in led_items:
        draw_status_led(draw, (left_box[0] + 24, y), text, color)
        y += 44
    # middle bus schematic
    center_box = (660, 140, 1880 - 32, 520)
    draw_box(draw, center_box, title="功率流向", title_font=font_30)
    cx = (center_box[0] + center_box[2]) // 2
    cy = (center_box[1] + center_box[3]) // 2
    draw.rectangle((cx - 160, cy - 40, cx + 160, cy + 40), fill="#F7FAFF", outline=COLORS["border"], width=3)
    draw.text((cx - 110, cy - 12), "汇流母线 1650kW", font=font_22, fill=COLORS["text"])
    nodes = [
        (center_box[0] + 140, cy - 120, "并网"),
        (center_box[0] + 140, cy + 120, "BMS"),
        (center_box[2] - 140, cy - 120, "负载"),
        (center_box[2] - 140, cy + 120, "EMS"),
    ]
    for x, y, label in nodes:
        draw.rectangle((x - 110, y - 40, x + 110, y + 40), fill=COLORS["card"], outline=COLORS["border"], width=2)
        draw.text((x - 60, y - 14), label, font=font_22, fill=COLORS["text"])
        draw.line((x, y, cx - 160 if x < cx else cx + 160, cy), fill=COLORS["accent"], width=6)
        draw.text((x - 70, y + 14), "功率 820kW", font=font_18, fill=COLORS["muted"])
    # right bottom converters table
    right_box = (660, 540, 1880 - 32, 980)
    draw_box(draw, right_box, title="PCS 机组一览", title_font=font_30)
    headers = ["机组", "状态", "功率", "冷却", "告警"]
    rows = []
    for i in range(1, 9):
        rows.append([f"PCS-{i:02d}", "运行" if i % 3 else "待机", f"{180 - i*10} kW", "液冷 68%", "-" if i % 4 else "温度偏高"])
    draw_table(draw, (right_box[0] + 20, right_box[1] + 60, right_box[2] - 20, right_box[1] + 60 + 42 * (len(rows) + 1)), headers, rows, [150, 160, 170, 180, 260])
    img.save(OUTPUT_DIR / "pcs_flat_overview.png")


def pcs_flat_plan():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="PCS 运行曲线")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1888, 320), title="当日功率计划", title_font=font_30)
    for i in range(12):
        x = 60 + i * 150
        draw.rectangle((x, 200, x + 120, 280), fill="#F7FAFF", outline=COLORS["border"])
        draw.text((x + 12, 212), f"{i*2:02d}:00", font=font_20, fill=COLORS["text"])
        draw.text((x + 12, 244), f"{110 + (i%4)*15} kW", font=font_18, fill=COLORS["muted"])
    # middle area timeline panel
    draw_box(draw, (32, 340, 1250, 980), title="场景切换轨迹", title_font=font_30)
    headers = ["时间", "模式", "指令", "执行人", "说明"]
    rows = [
        ("07:20", "并网", "提升功率", "EMS", "升至 1.2MW"),
        ("08:05", "并网", "降载", "调度", "风速降低"),
        ("09:40", "离网", "孤岛切换", "值班", "演练"),
        ("10:10", "离网", "充电", "EMS", "SOC 86%"),
        ("11:30", "并网", "峰谷套利", "EMS", "指令 600kW"),
    ]
    draw_table(draw, (60, 400, 1220, 400 + (len(rows) + 1) * 44), headers, rows, [160, 140, 200, 160, 420])
    # right control pad
    draw_box(draw, (1300, 340, 1888, 980), title="控制命令", title_font=font_30)
    block_titles = ["并网控制", "功率调度", "维护操作"]
    y = 400
    for title in block_titles:
        draw.rectangle((1320, y, 1868, y + 120), fill="#F7FAFF", outline=COLORS["border"])
        draw.text((1340, y + 16), title, font=font_24, fill=COLORS["text"])
        draw.text((1340, y + 60), "参数设置...", font=font_20, fill=COLORS["muted"])
        btn_color = COLORS["accent"] if title != "维护操作" else COLORS["warning"]
        draw.rectangle((1720, y + 30, 1850, y + 80), fill=btn_color)
        draw.text((1740, y + 36), "执行", font=font_20, fill="#FFFFFF")
        y += 150
    img.save(OUTPUT_DIR / "pcs_flat_plan.png")


def pcs_flat_diagnostics():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="PCS 诊断")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1250, 520), title="告警状态", title_font=font_30)
    headers = ["时间", "机组", "级别", "描述", "处理"]
    rows = [
        ("07:53", "PCS-03", "重大", "风冷风扇失效", "派发工单"),
        ("08:16", "PCS-05", "一般", "模块温差大", "降载 10%"),
        ("09:11", "PCS-07", "提示", "通讯波动", "自动恢复"),
        ("09:30", "PCS-02", "一般", "并网电压抖动", "观察"),
        ("09:52", "PCS-09", "提示", "维护计划到期", "排程"),
    ]
    draw_table(draw, (60, 200, 1220, 200 + (len(rows) + 1) * 44), headers, rows, [160, 140, 140, 400, 260])
    draw_box(draw, (32, 560, 1250, 980), title="诊断参数快照", title_font=font_30)
    params = [
        ("功率指令", "1550 kW"),
        ("功率反馈", "1532 kW"),
        ("DC 电压", "1252 V"),
        ("DC 电流", "1210 A"),
        ("IGBT 温度", "69 ℃"),
        ("变压器温度", "58 ℃"),
        ("辅助电源", "正常"),
        ("阀组状态", "合闸"),
        ("系统模式", "半自动"),
        ("风冷速度", "72%"),
    ]
    x = 60
    y = 620
    for idx, (label, value) in enumerate(params):
        draw_label_value(draw, (x, y), label, value, width=260)
        x += 280
        if (idx + 1) % 4 == 0:
            x = 60
            y += 60
    draw_box(draw, (1280, 140, 1888, 980), title="维护手册", title_font=font_30)
    sections = [
        "• 日检流程", "• 并网许可记录", "• 热管理联动", "• 冷却校准", "• 安全联锁" 
    ]
    y = 200
    for text in sections:
        draw.text((1304, y), text, font=font_24, fill=COLORS["text"])
        y += 60
    draw.rectangle((1310, y + 40, 1850, y + 100), fill=COLORS["accent"])
    draw.text((1400, y + 56), "导出诊断报告", font=font_24, fill="#FFFFFF")
    img.save(OUTPUT_DIR / "pcs_flat_diagnostics.png")


# BMS tier-3 pages

def draw_stack_summary(draw, box, stacks):
    draw_box(draw, box, title="电池堆汇总", title_font=font_30)
    y = box[1] + 70
    for stack in stacks:
        draw.rectangle((box[0] + 20, y, box[2] - 20, y + 70), fill="#F9FBFF", outline=COLORS["border"])
        draw.text((box[0] + 40, y + 16), stack[0], font=font_24, fill=COLORS["text"])
        draw.text((box[0] + 280, y + 16), stack[1], font=font_20, fill=COLORS["muted"])
        draw.text((box[0] + 520, y + 16), stack[2], font=font_20, fill=COLORS["muted"])
        draw_status_led(draw, (box[0] + 800, y + 18), stack[3], COLORS["success"] if "正常" in stack[3] else COLORS["warning"])
        y += 90


def bms_tier3_structure():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="BMS 三级结构" )
    draw_bottom_bar(draw)
    draw_stack_summary(draw, (32, 140, 1888, 380), [
        ("堆 STK-A", "电压 1250V", "电流 1320A", "均衡正常"),
        ("堆 STK-B", "电压 1246V", "电流 1180A", "温差关注"),
    ])
    draw_box(draw, (32, 400, 1888, 980), title="堆-簇-包层级", title_font=font_30)
    clusters = [
        ("簇 C1", ["P1", "P2", "P3", "P4"]),
        ("簇 C2", ["P5", "P6", "P7", "P8"]),
        ("簇 C3", ["P9", "P10", "P11", "P12"]),
    ]
    x = 60
    for name, packs in clusters:
        draw.rectangle((x, 460, x + 560, 940), outline=COLORS["border"], fill="#FDFEFF")
        draw.text((x + 20, 480), name, font=font_26, fill=COLORS["text"])
        draw.text((x + 20, 520), "簇 SOC 93%", font=font_20, fill=COLORS["muted"])
        py = 560
        for pack in packs:
            draw.rectangle((x + 20, py, x + 520, py + 70), outline=COLORS["border"], fill=COLORS["card"])
            draw.text((x + 40, py + 20), f"包 {pack}", font=font_22, fill=COLORS["text"])
            draw.text((x + 200, py + 20), "电压 52.3V", font=font_20, fill=COLORS["muted"])
            draw.text((x + 360, py + 20), "温差 2.1℃", font=font_20, fill=COLORS["muted"])
            py += 86
        x += 600
    img.save(OUTPUT_DIR / "bms_tier3_structure.png")


def bms_tier3_balance():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="三级均衡")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1888, 340), title="均衡策略", title_font=font_30)
    items = [
        ("簇", ["C1", "C2", "C3", "C4"]),
    ]
    x = 60
    for cluster in ["C1", "C2", "C3", "C4"]:
        draw.rectangle((x, 200, x + 300, 280), outline=COLORS["border"], fill="#F9FBFF")
        draw.text((x + 12, 214), f"簇 {cluster}", font=font_24, fill=COLORS["text"])
        draw.text((x + 12, 250), "均衡差 2.2%", font=font_20, fill=COLORS["muted"])
        draw.rectangle((x + 180, 244, x + 280, 264), fill=COLORS["accent"])
        draw.text((x + 188, 246), "动态", font=font_18, fill="#FFFFFF")
        x += 320
    draw_box(draw, (32, 360, 1888, 980), title="包温度 / 单体电压", title_font=font_30)
    packs = 12
    start_x = 60
    start_y = 420
    for i in range(packs):
        col = i % 4
        row = i // 4
        left = start_x + col * 440
        top = start_y + row * 180
        draw.rectangle((left, top, left + 400, top + 160), fill=COLORS["card"], outline=COLORS["border"])
        draw.text((left + 16, top + 10), f"包 P{i+1}", font=font_22, fill=COLORS["text"])
        draw.text((left + 16, top + 44), "SOC 93% | 温差 1.6℃", font=font_20, fill=COLORS["muted"])
        draw.rectangle((left + 16, top + 86, left + 360, top + 106), fill="#EDF2FD", outline=COLORS["border"])
        draw.rectangle((left + 16, top + 86, left + 16 + 300 * (0.7 - (i % 3) * 0.1), top + 106), fill=COLORS["accent"])
        for t in range(4):
            dot_x = left + 16 + t * 90
            dot_y = top + 120
            temp_text = f"{27 + (i+t)%5}℃"
            draw.rectangle((dot_x, dot_y, dot_x + 70, dot_y + 26), fill="#F7FAFF", outline=COLORS["border"])
            draw.text((dot_x + 8, dot_y + 4), temp_text, font=font_18, fill=COLORS["text"])
    img.save(OUTPUT_DIR / "bms_tier3_balance.png")


def bms_tier3_logistics():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="三级告警/日志")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1240, 980), title="事件列表", title_font=font_30)
    headers = ["时间", "对象", "类型", "描述", "处理"]
    rows = [
        ("08:13:29", "BCMU7", "故障", "绝缘失效联锁", "跳闸"),
        ("08:08:31", "BCMU5", "状态", "绝缘检测开启", "-"),
        ("08:03:12", "BCMU3", "警告", "单体温差 4℃", "均衡"),
        ("07:58:44", "堆 STK-A", "提示", "SOC 阈值 90%", "通知"),
        ("07:50:11", "通信", "提示", "CAN2 抖动", "切换"),
        ("07:43:02", "BCMU2", "故障", "单体过压", "降载"),
        ("07:40:52", "BCMU2", "状态", "单体恢复", "-"),
    ]
    draw_table(draw, (60, 200, 1210, 200 + (len(rows) + 1) * 44), headers, rows, [160, 160, 120, 420, 200])
    draw_box(draw, (1280, 140, 1888, 520), title="告警指示", title_font=font_30)
    indicator = [
        ("总故障", COLORS["alert"]),
        ("充电过流", COLORS["alert"]),
        ("放电过流", COLORS["warning"]),
        ("SOC 低", COLORS["warning"]),
        ("通信异常", COLORS["warning"]),
        ("电压传感", COLORS["warning"]),
        ("冷却", COLORS["success"]),
        ("消防", COLORS["success"]),
    ]
    x = 1300
    y = 200
    for text, color in indicator:
        draw_status_led(draw, (x, y), text, color)
        y += 44
        if y > 440:
            x += 200
            y = 200
    draw_box(draw, (1280, 560, 1888, 980), title="指令记录", title_font=font_30)
    cmd_rows = [
        ("07:35", "EMS", "手动均衡开启"),
        ("08:10", "维护", "复位 BCMU7"),
        ("08:32", "EMS", "恢复自动"),
        ("09:02", "现场", "切换离网"),
    ]
    draw_table(draw, (1308, 620, 1860, 620 + (len(cmd_rows) + 1) * 44), ["时间", "来源", "指令"], cmd_rows, [120, 140, 280])
    img.save(OUTPUT_DIR / "bms_tier3_logistics.png")


# BMS tier-2 pages

def bms_tier2_cluster():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="二级簇视图")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1888, 360), title="簇 CLU-01 状态", title_font=font_30)
    top_params = [
        ("簇电压", "1250 V"),
        ("簇电流", "820 A"),
        ("高压箱", "合闸"),
        ("冷却", "液冷 63%"),
        ("SOC", "92%"),
        ("SOH", "91%"),
        ("绝缘", "正常"),
        ("通信", "稳定"),
    ]
    x = 60
    y = 200
    for label, value in top_params:
        draw_label_value(draw, (x, y), label, value, width=220)
        x += 240
        if x > 1680:
            x = 60
            y += 60
    draw_box(draw, (32, 380, 1888, 980), title="电池包状态", title_font=font_30)
    pack_data = []
    for i in range(1, 13):
        pack_data.append([
            f"包 {i:02d}",
            f"SOC {93 - i * 0.5:.1f}%",
            f"温差 {1.5 + (i % 3) * 0.4:.1f}℃",
            f"电压 52.{i%7} V",
            "均衡" if i % 4 == 0 else "-"
        ])
    draw_table(draw, (60, 440, 1860, 440 + (len(pack_data) + 1) * 44), ["编号", "SOC", "温差", "电压", "策略"], pack_data, [140, 200, 200, 200, 200])
    img.save(OUTPUT_DIR / "bms_tier2_cluster.png")


def bms_tier2_pack_detail():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="二级包诊断")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1240, 520), title="包 P-07 详情", title_font=font_30)
    detail_params = [
        ("串并形式", "2 串 15 并"),
        ("包电压", "105.6 V"),
        ("包电流", "220 A"),
        ("温差", "2.4 ℃"),
        ("单体最高", "3.62 V"),
        ("单体最低", "3.55 V"),
        ("均衡状态", "进行中"),
        ("热管理", "正常"),
    ]
    x = 60
    y = 200
    for label, value in detail_params:
        draw_label_value(draw, (x, y), label, value, width=260)
        x += 280
        if x > 1000:
            x = 60
            y += 60
    draw_box(draw, (32, 540, 1240, 980), title="单体矩阵", title_font=font_30)
    cell_num = 30
    start_x = 60
    start_y = 600
    for idx in range(cell_num):
        col = idx % 10
        row = idx // 10
        left = start_x + col * 110
        top = start_y + row * 120
        draw.rectangle((left, top, left + 100, top + 100), outline=COLORS["border"], fill=COLORS["card"])
        draw.text((left + 12, top + 12), f"单体 {idx+1}", font=font_18, fill=COLORS["text"])
        draw.text((left + 12, top + 50), f"{3.55 + (idx%4)*0.02:.2f} V", font=font_18, fill=COLORS["muted"])
        draw.rectangle((left + 12, top + 74, left + 88, top + 86), fill="#E3EAF8")
        draw.rectangle((left + 12, top + 74, left + 12 + 60 * (0.7 - (idx % 5) * 0.08), top + 86), fill=COLORS["accent"])
    draw_box(draw, (1280, 140, 1888, 520), title="温度探针", title_font=font_30)
    for i in range(12):
        draw_label_value(draw, (1300 + (i // 6) * 280, 200 + (i % 6) * 48), f"温度{i+1}", f"{28 + i*0.4:.1f}℃", width=240)
    draw_box(draw, (1280, 540, 1888, 980), title="维护记录", title_font=font_30)
    records = [
        ("2025-11-30", "例检完成"),
        ("2025-11-18", "包更换温度探针"),
        ("2025-11-10", "均衡策略优化"),
        ("2025-10-28", "绝缘检查"),
    ]
    draw_table(draw, (1308, 600, 1860, 600 + (len(records) + 1) * 44), ["日期", "说明"], records, [200, 340])
    img.save(OUTPUT_DIR / "bms_tier2_pack_detail.png")


def bms_tier2_alert_board():
    img, draw = new_canvas()
    draw_top_menu(draw, subtitle="二级告警")
    draw_bottom_bar(draw)
    draw_box(draw, (32, 140, 1888, 520), title="实时告警", title_font=font_30)
    headers = ["时间", "包", "级别", "描述", "处理"]
    rows = [
        ("09:52", "包 11", "欠压", "单体 3.42V", "强制均衡"),
        ("09:12", "包 06", "温差", "ΔT 6.2℃", "检查液冷"),
        ("08:44", "包 02", "通讯", "BMU 断链", "重连"),
        ("08:20", "簇", "绝缘", "绝缘 450kΩ", "待确认"),
    ]
    draw_table(draw, (60, 200, 1860, 200 + (len(rows) + 1) * 44), headers, rows, [160, 140, 140, 420, 360])
    draw_box(draw, (32, 560, 1200, 980), title="策略建议", title_font=font_30)
    suggestions = [
        "• 包11 设置高优先均衡",
        "• 触发冷却冗余泵",
        "• 安排夜间深度充电",
        "• 检查簇绝缘探头",
        "• 核对最新固件",
    ]
    y = 620
    for text in suggestions:
        draw.text((60, y), text, font=font_24, fill=COLORS["text"])
        y += 60
    draw_box(draw, (1240, 560, 1888, 980), title="操作面板", title_font=font_30)
    ops = ["均衡启动", "簇分闸", "温控自检", "导出日志"]
    y = 620
    for op in ops:
        draw.rectangle((1260, y, 1868, y + 80), fill="#F9FBFF", outline=COLORS["border"])
        draw.text((1280, y + 22), op, font=font_24, fill=COLORS["text"])
        draw.rectangle((1700, y + 20, 1850, y + 60), fill=COLORS["accent"])
        draw.text((1718, y + 26), "执行", font=font_22, fill="#FFFFFF")
        y += 100
    img.save(OUTPUT_DIR / "bms_tier2_alert_board.png")


def main():
    pcs_flat_overview()
    pcs_flat_plan()
    pcs_flat_diagnostics()
    bms_tier3_structure()
    bms_tier3_balance()
    bms_tier3_logistics()
    bms_tier2_cluster()
    bms_tier2_pack_detail()
    bms_tier2_alert_board()


if __name__ == "__main__":
    main()
