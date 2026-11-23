"""Sum views on posts published during the last 7 days and write social-stats.xml.

Environment variables:
YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
YOUTUBE_AW3RY_CHANNEL_ID
TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_ID

Optional fallback:
YOUTUBE_CLIPS_WEEK_VIEWS, YOUTUBE_AW3RY_LIFETIME_VIEWS
INSTAGRAM_CLIPS_URL, INSTAGRAM_ART_URL
YOUTUBE_CLIPS_URL, YOUTUBE_AW3RY_URL

TikTok and Instagram view counts are fixed from the supplied screenshots.

Run:
python scripts/social_stats.py
"""

import json
import os
import re
import ssl
import sys
from datetime import datetime, timedelta, timezone
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "social-stats.xml"
WEEKLY_VIEWS_FIELD = "last_7_days_views"
LAST_SEVEN_POSTS_FIELD = "last_7_posts_views"
INSTAGRAM_CLIPS_POST_VIEWS = (0, 2707, 666, 171, 171, 114, 187, 234)
INSTAGRAM_ART_TOTAL_VIEWS = 16072
TIKTOK_POST_VIEWS = (21900, 18300, 684900, 13700, 1288, 9134, 27300, 1611, 955, 2351, 5636)
YOUTUBE_CLIPS_WEEK_VIEWS = 32901
ATOM_NAMESPACE = "{http://www.w3.org/2005/Atom}"
YOUTUBE_NAMESPACE = "{http://www.youtube.com/xml/schemas/2015}"


def _week_cutoff(now=None):
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    return current_time.astimezone(timezone.utc) - timedelta(days=7)


def _parse_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def http_json(url, method="GET", headers=None, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers=headers or {},
    )
    if data is not None:
        request.add_header("Content-Type", "application/json")

    context = ssl.create_default_context()
    with urllib.request.urlopen(request, context=context, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def get_youtube_stats(cutoff=None):
    api_key = os.getenv("YOUTUBE_API_KEY")
    channel_id = os.getenv("YOUTUBE_CHANNEL_ID")
    if not api_key or not channel_id:
        return {}

    return get_youtube_channel_stats(api_key, channel_id, cutoff)


def get_youtube_channel_stats(api_key, channel_id, cutoff=None):
    cutoff = cutoff or _week_cutoff()
    published_after = cutoff.isoformat(timespec="seconds").replace("+00:00", "Z")
    video_ids = []
    page_token = None

    while True:
        query = {
            "key": api_key,
            "channelId": channel_id,
            "part": "snippet",
            "order": "date",
            "type": "video",
            "publishedAfter": published_after,
            "maxResults": 50,
        }
        if page_token:
            query["pageToken"] = page_token
        result = http_json(
            f"https://www.googleapis.com/youtube/v3/search?{urllib.parse.urlencode(query)}"
        )
        for item in result.get("items", []):
            published_at = _parse_datetime(item.get("snippet", {}).get("publishedAt"))
            video_id = item.get("id", {}).get("videoId")
            if published_at and published_at >= cutoff and video_id:
                video_ids.append(video_id)
        page_token = result.get("nextPageToken")
        if not page_token:
            break

    if not video_ids:
        return {WEEKLY_VIEWS_FIELD: 0}

    total_views = 0
    for offset in range(0, len(video_ids), 50):
        video_params = urllib.parse.urlencode({
            "key": api_key,
            "id": ",".join(video_ids[offset:offset + 50]),
            "part": "statistics",
        })
        details = http_json(f"https://www.googleapis.com/youtube/v3/videos?{video_params}")
        total_views += sum(
            int(item.get("statistics", {}).get("viewCount", 0))
            for item in details.get("items", [])
        )
    return {WEEKLY_VIEWS_FIELD: total_views}


def get_youtube_lifetime_stats(api_key, channel_id):
    params = urllib.parse.urlencode({
        "key": api_key,
        "id": channel_id,
        "part": "statistics",
    })
    result = http_json(f"https://www.googleapis.com/youtube/v3/channels?{params}")
    channels = result.get("items", [])
    if not channels:
        return {}
    return {
        "lifetime_views": int(
            channels[0].get("statistics", {}).get("viewCount", 0)
        )
    }


def fetch_public_html(url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(request, context=ssl.create_default_context(), timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_view_count(value):
    if value is None:
        return None
    digits = re.sub(r"[^\d]", "", str(value))
    return int(digits) if digits else None


def _get_public_youtube_week_views(url, cutoff):
    html = fetch_public_html(url)
    channel_id_match = re.search(r'"(?:channelId|browseId)":"(UC[^"]+)"', html)
    if not channel_id_match:
        raise ValueError("Nie udało się odczytać identyfikatora kanału.")

    rss_url = (
        "https://www.youtube.com/feeds/videos.xml?channel_id="
        + urllib.parse.quote(channel_id_match.group(1))
    )
    feed = ET.fromstring(fetch_public_html(rss_url))
    video_ids = []
    for entry in feed.findall(f"{ATOM_NAMESPACE}entry"):
        published_at = _parse_datetime(entry.findtext(f"{ATOM_NAMESPACE}published"))
        video_id = entry.findtext(f"{YOUTUBE_NAMESPACE}videoId")
        if published_at and published_at >= cutoff and video_id:
            video_ids.append(video_id)

    total_views = 0
    for video_id in video_ids:
        video_html = fetch_public_html(f"https://www.youtube.com/watch?v={video_id}")
        view_match = re.search(
            r'"viewCount"\s*:\s*\{"simpleText"\s*:\s*"([^"]+)',
            video_html,
        )
        if not view_match:
            view_match = re.search(r'"viewCount"\s*:\s*"?(\d+)', video_html)
        if not view_match:
            raise ValueError(f"Nie udało się odczytać wyświetleń filmu {video_id}.")
        total_views += parse_view_count(view_match.group(1)) or 0
    return total_views


def get_public_youtube_lifetime_stats(url):
    html = fetch_public_html(f"{url.rstrip('/')}/about")
    match = re.search(
        r'"subscriberCountText":"[^"]*","viewCountText":"([^"]+)"',
        html,
    )
    if not match:
        raise ValueError("Nie udało się odczytać łącznych wyświetleń kanału.")
    views = parse_view_count(match.group(1))
    if views is None:
        raise ValueError("Łączna liczba wyświetleń kanału jest nieprawidłowa.")
    return {"lifetime_views": views}


def get_twitch_stats():
    client_id = os.getenv("TWITCH_CLIENT_ID")
    client_secret = os.getenv("TWITCH_CLIENT_SECRET")
    broadcaster_id = os.getenv("TWITCH_BROADCASTER_ID")
    if not client_id or not client_secret or not broadcaster_id:
        return {}

    token_params = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    })
    token = http_json(
        f"https://id.twitch.tv/oauth2/token?{token_params}",
        method="POST",
    )
    access_token = token["access_token"]
    params = urllib.parse.urlencode({"user_id": broadcaster_id, "first": 1, "sort": "time", "type": "all"})
    result = http_json(
        f"https://api.twitch.tv/helix/videos?{params}",
        headers={
            "Client-ID": client_id,
            "Authorization": f"Bearer {access_token}",
        },
    )
    videos = result.get("data", [])
    latest = videos[0] if videos else None
    return {"latest_views": int(latest.get("view_count", 0))} if latest else {}


def _optional_int(value):
    if value is None or not value.strip():
        return None
    result = int(value)
    if result < 0:
        raise ValueError("Liczba wyświetleń nie może być ujemna.")
    return result


def _load_stats(label, fetch):
    try:
        return fetch()
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as error:
        print(f"Nie udało się pobrać statystyk {label}: {error}", file=sys.stderr)
        return {}


def main():
    cutoff = _week_cutoff()
    clips_url = os.getenv("YOUTUBE_CLIPS_URL", "https://www.youtube.com/@AW3RY_CLIPS")
    aw3ry_url = os.getenv("YOUTUBE_AW3RY_URL", "https://www.youtube.com/@AW3RY")
    instagram_clips_url = os.getenv(
        "INSTAGRAM_CLIPS_URL",
        "https://www.instagram.com/aw3ry.clips/",
    )
    instagram_art_url = os.getenv(
        "INSTAGRAM_ART_URL",
        "https://www.instagram.com/aw3ry.art/",
    )
    tiktok_url = os.getenv("TIKTOK_CLIPS_URL", "https://www.tiktok.com/@aw3ry.clips")
    manual_youtube = _optional_int(os.getenv("YOUTUBE_CLIPS_WEEK_VIEWS"))
    manual_youtube_aw3ry = _optional_int(os.getenv("YOUTUBE_AW3RY_LIFETIME_VIEWS"))

    instagram_clips = {
        LAST_SEVEN_POSTS_FIELD: sum(INSTAGRAM_CLIPS_POST_VIEWS)
    }
    tiktok = {"lifetime_views": sum(TIKTOK_POST_VIEWS)}
    youtube_clips = (
        {WEEKLY_VIEWS_FIELD: manual_youtube}
        if manual_youtube is not None
        else (
            _load_stats(
                "YouTube @AW3RY_CLIPS",
                lambda: get_youtube_stats(cutoff),
            )
            or {WEEKLY_VIEWS_FIELD: YOUTUBE_CLIPS_WEEK_VIEWS}
        )
    )
    api_key = os.getenv("YOUTUBE_API_KEY")
    aw3ry_channel_id = os.getenv("YOUTUBE_AW3RY_CHANNEL_ID")
    if manual_youtube_aw3ry is not None:
        youtube_aw3ry = {"lifetime_views": manual_youtube_aw3ry}
    elif api_key and aw3ry_channel_id:
        youtube_aw3ry = _load_stats(
            "YouTube @AW3RY",
            lambda: get_youtube_lifetime_stats(api_key, aw3ry_channel_id),
        )
    else:
        youtube_aw3ry = {}
    if manual_youtube_aw3ry is None and youtube_aw3ry.get("lifetime_views") is None:
        youtube_aw3ry = _load_stats(
            "YouTube @AW3RY",
            lambda: get_public_youtube_lifetime_stats(aw3ry_url),
        )

    if youtube_clips.get(WEEKLY_VIEWS_FIELD) is None:
        public_week_views = _load_stats(
            "YouTube @AW3RY_CLIPS",
            lambda: {
                WEEKLY_VIEWS_FIELD: _get_public_youtube_week_views(clips_url, cutoff)
            },
        )
        youtube_clips.update(public_week_views)

    stats = {
        "instagram": instagram_clips,
        "tiktok": tiktok,
        "youtube": youtube_clips,
        "twitch": _load_stats("Twitch", get_twitch_stats),
    }
    stats["instagram"]["account_url"] = instagram_clips_url
    stats["tiktok"]["account_url"] = tiktok_url
    stats["youtube"]["account_url"] = clips_url
    stats["instagram_art"] = {
        "account_url": instagram_art_url,
        "total_views": INSTAGRAM_ART_TOTAL_VIEWS,
    }
    stats["youtube_aw3ry"] = youtube_aw3ry
    stats["youtube_aw3ry"]["account_url"] = aw3ry_url

    stats["instagram"].setdefault(LAST_SEVEN_POSTS_FIELD, None)
    stats["youtube"].setdefault(WEEKLY_VIEWS_FIELD, None)
    stats["tiktok"].setdefault("lifetime_views", None)
    stats["youtube_aw3ry"].setdefault("lifetime_views", None)

    missing = [
        label
        for label, values in (
            ("YouTube @AW3RY_CLIPS", stats["youtube"]),
        )
        if values.get(WEEKLY_VIEWS_FIELD) is None
    ]
    if stats["tiktok"]["lifetime_views"] is None:
        missing.append("TikTok aw3ry.clips")
    if stats["youtube_aw3ry"]["lifetime_views"] is None:
        missing.append("YouTube @AW3RY")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    root = ET.Element("socialStats")
    for platform, values in stats.items():
        platform_node = ET.SubElement(root, platform)
        for key, value in values.items():
            field = ET.SubElement(platform_node, key)
            field.text = "" if value is None else str(value)
    ET.indent(root, space="  ")
    tree = ET.ElementTree(root)
    tree.write(OUTPUT, encoding="utf-8", xml_declaration=True)
    print(f"Zapisano statystyki: {OUTPUT}")
    if missing:
        print(
            "Brak liczby wyświetleń dla: "
            + ", ".join(missing)
            + ". Skonfiguruj dostęp do API albo odpowiednią zmienną "
            "*_WEEK_VIEWS lub "
            "YOUTUBE_AW3RY_LIFETIME_VIEWS.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Nie udało się pobrać statystyk: {error}", file=sys.stderr)
        raise
