from moviepy import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips

slides = [
    {"img": "assets/dashboard.png", "text": "COMPLIANCE ON AUTOPILOT"},
    {"img": "assets/walkaround.png", "text": "DVSA-ALIGNED CHECKS"},
    {"img": "assets/defects.png", "text": "REAL-TIME DEFECT REPORTING"},
    {"img": "assets/pricing.png", "text": "NO SETUP FEES - \u00a359/MO"}
]

clips = []
fps = 24
W, H = 1920, 1080

for slide in slides:
    img_clip = ImageClip(slide["img"]).with_duration(5).with_fps(fps)

    img_clip = img_clip.resized(lambda t: 1 + 0.04 * t)

    txt_clip = TextClip(
        text=slide["text"],
        font_size=70,
        color='yellow',
        font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        stroke_color='black',
        stroke_width=3
    ).with_position(lambda t, txt_h=None: ('center', H - 120)).with_duration(5)

    video = CompositeVideoClip(
        [img_clip.with_position("center"), txt_clip],
        size=(W, H)
    )
    clips.append(video)

final_video = concatenate_videoclips(clips, method="compose")
final_video.write_videofile("titan_fleet_ad.mp4", fps=fps)

print("Video generated: titan_fleet_ad.mp4")
