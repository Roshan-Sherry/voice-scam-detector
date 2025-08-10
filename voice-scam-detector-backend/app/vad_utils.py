# app/vad_utils.py
import wave
import webrtcvad
import collections
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class Frame:
    bytes: bytes
    timestamp: float
    duration: float

def read_wave(path: str):
    """Read a WAV file and return (pcm_bytes, sample_rate). Expects 16-bit PCM WAV."""
    with wave.open(path, "rb") as wf:
        num_channels = wf.getnchannels()
        assert num_channels == 1, "WAV must be mono"
        sample_width = wf.getsampwidth()
        assert sample_width == 2, "WAV must be 16-bit"
        sample_rate = wf.getframerate()
        pcm_data = wf.readframes(wf.getnframes())
    return pcm_data, sample_rate

def frame_generator(frame_duration_ms: int, audio: bytes, sample_rate: int):
    """Yield frames of `frame_duration_ms` (10,20,30)."""
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)  # 2 bytes/sample
    offset = 0
    timestamp = 0.0
    duration = (float(n) / (2 * sample_rate))
    while offset + n <= len(audio):
        yield Frame(audio[offset:offset + n], timestamp, duration)
        timestamp += duration
        offset += n

def vad_collector(sample_rate: int, frame_duration_ms: int, padding_ms: int, vad, frames):
    """
    Collect voiced segments from frames. Returns list of (start_s, end_s).
    This is adapted from webrtcvad example (simple heuristic with padding).
    """
    num_padding_frames = int(padding_ms / frame_duration_ms)
    ring_buffer = collections.deque(maxlen=num_padding_frames)
    triggered = False
    voiced_frames = []
    segments = []
    for frame in frames:
        is_speech = vad.is_speech(frame.bytes, sample_rate)
        if not triggered:
            ring_buffer.append((frame, is_speech))
            num_voiced = len([f for f, speech in ring_buffer if speech])
            if num_voiced > 0.9 * ring_buffer.maxlen:
                triggered = True
                start_time = ring_buffer[0][0].timestamp
                voiced_frames = [f for f, s in ring_buffer]
                ring_buffer.clear()
        else:
            voiced_frames.append(frame)
            ring_buffer.append((frame, is_speech))
            num_unvoiced = len([f for f, speech in ring_buffer if not speech])
            if num_unvoiced > 0.9 * ring_buffer.maxlen:
                # end segment
                end_time = voiced_frames[-1].timestamp + voiced_frames[-1].duration
                segments.append((start_time, end_time))
                triggered = False
                ring_buffer.clear()
                voiced_frames = []
    # final tail
    if triggered and voiced_frames:
        end_time = voiced_frames[-1].timestamp + voiced_frames[-1].duration
        segments.append((start_time, end_time))
    return segments

def get_vad_segments(wav_path: str, aggressiveness: int = 1) -> List[Tuple[float, float]]:
    """Return list of (start_s, end_s) speech segments for a WAV file."""
    audio, sr = read_wave(wav_path)
    if sr not in (8000, 16000, 32000, 48000):
        raise ValueError("webrtcvad supports sample rates: 8000,16000,32000,48000")
    vad = webrtcvad.Vad(aggressiveness)
    frames = list(frame_generator(30, audio, sr))  # 30ms frames
    segments = vad_collector(sr, 30, 300, vad, frames)  # 300ms padding
    return segments
