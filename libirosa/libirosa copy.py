pip install numpy scipy numba librosa soundfile

# 分析节拍
python libirosa.py input_audio.wav --method beat

# 使用PLP分析
python libirosa.py input_audio.wav --method plp --output beats.npy

