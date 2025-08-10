from app.aasist_utils import load_aasist_model, predict_aasist_score

model = load_aasist_model(device="cpu")
score = predict_aasist_score(model, "uploads/becf05d84e2d4a55a21eee6b0d255838.wav", device="cpu")
print("Spoof score:", score)