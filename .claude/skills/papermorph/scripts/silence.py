"""Where speech stops and pauses in a narration clip, from ffmpeg's silencedetect; shared by join.py and mouths.py."""
import re, subprocess


def _detect(f, d):
    err = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(f), '-af', f'silencedetect=n=-40dB:d={d}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]


def speech_end(f):
    """Where the clip's sound stops: the start of its trailing silence, in seconds (the clip's length without one).
    Only a silence that never ends, or ends at the file's end (just inside the mp3's priming padding), is trailing;
    an internal silence means speech resumes after it. A silence in the first 0.2 s is the lead-in, not an end."""
    starts, ends = _detect(f, .15)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)],
                               capture_output=True, text=True).stdout or 0)
    return starts[-1] if starts and (len(ends) < len(starts) or ends[-1] > dur - .2) and starts[-1] > .2 else dur


def pauses(f):
    """The start of every pause of 0.45 s or more inside a clip."""
    return _detect(f, .45)[0]
