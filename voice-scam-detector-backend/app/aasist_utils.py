import sys
from pathlib import Path
import torch
import torchaudio

# Add aasist repo to Python path
AASIST_REPO_PATH = Path(__file__).resolve().parent.parent / "aasist"
sys.path.append(str(AASIST_REPO_PATH))

from aasist.models.AASIST import Model  # from aasist repo

MODEL_PATH = Path("models/AASIST-L.pth")

# Exact model_config from AASIST-L.conf
d_args = {
    "architecture": "AASIST",
    "nb_samp": 64600,
    "first_conv": 128,
    "filts": [70, [1, 32], [32, 32], [32, 24], [24, 24]],
    "gat_dims": [24, 32],
    "pool_ratios": [0.4, 0.5, 0.7, 0.5],
    "temperatures": [2.0, 2.0, 100.0, 100.0]
}

# Cached resampler
_target_sr = 16000
_resampler = torchaudio.transforms.Resample(orig_freq=_target_sr, new_freq=_target_sr)

def load_aasist_model(device="cpu"):
    """Load the AASIST-L model."""
    model = Model(d_args=d_args)
    state_dict = torch.load(MODEL_PATH, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model

def predict_aasist_score(model, wav_path, device="cpu", verbose=False):
    """
    Predict spoofing score using AASIST model with robust audio preprocessing.

    Returns:
        dict: {
            "bonafide_prob": float,
            "spoof_prob": float
        }
    """
    nb_samp = d_args["nb_samp"]

    # Load audio
    waveform, sr = torchaudio.load(wav_path)  # [channels, samples]
    if verbose: print(f"[DEBUG] Initial waveform shape: {waveform.shape}, sr={sr}")

    # Convert stereo to mono
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0)
    else:
        waveform = waveform.squeeze(0)
    if verbose: print(f"[DEBUG] After mono conversion: {waveform.shape}")

    # Resample if needed
    if sr != _target_sr:
        resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=_target_sr)
        waveform = resampler(waveform)
        if verbose: print(f"[DEBUG] After resampling: {waveform.shape}")

    # Pad or trim to fixed length
    current_samples = waveform.shape[0]
    if current_samples < nb_samp:
        pad_len = nb_samp - current_samples
        waveform = torch.nn.functional.pad(waveform, (0, pad_len))
    elif current_samples > nb_samp:
        waveform = waveform[:nb_samp]
    if verbose: print(f"[DEBUG] After pad/trim: {waveform.shape}")

    # Add batch dim: [samples] → [batch, samples]
    waveform = waveform.unsqueeze(0).to(device)
    if verbose: print(f"[DEBUG] Final input shape: {waveform.shape}")

    # Inference
    with torch.no_grad():
        model_output = model(waveform)

        # AASIST returns a tuple, second item = logits [batch, 2]
        if isinstance(model_output, tuple) and len(model_output) >= 2:
            logits = model_output[1]
            probs = torch.softmax(logits, dim=1)
            bonafide_prob = probs[0, 0].item()
            spoof_prob = probs[0, 1].item()
        else:
            # Fallback: treat output as raw score
            score_tensor = model_output
            spoof_prob = score_tensor.squeeze().item()
            bonafide_prob = 1.0 - spoof_prob

    return {
        "bonafide_prob": bonafide_prob,
        "spoof_prob": spoof_prob
    }
