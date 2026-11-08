export const requestRecordingPermissionsAsync = async () => ({ granted: true, status: 'granted' });
export const getRecordingPermissionsAsync = async () => ({ granted: true, status: 'granted' });
export const setAudioModeAsync = async () => {};
export const setIsAudioActiveAsync = async () => {};

export const RecordingPresets = {
  HIGH_QUALITY: {},
  LOW_QUALITY: {},
};

export class AudioRecorder {
  isRecording = false;
  currentTime = 5;
  uri = 'file:///mock/voice_note.m4a';

  prepareToRecordAsync = async () => {};
  record = () => { this.isRecording = true; };
  stop = async () => { this.isRecording = false; };
  getStatus = () => ({ canRecord: true, isRecording: this.isRecording, durationMillis: 5000 });
}

export function useAudioRecorder() {
  return new AudioRecorder();
}

export function useAudioPlayer() {
  return {
    play: () => {},
    pause: () => {},
    currentTime: 0,
    duration: 5,
  };
}

export function useAudioPlayerStatus() {
  return {
    playing: false,
    currentTime: 0,
    duration: 5,
  };
}

export default {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  RecordingPresets,
  AudioRecorder,
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
};

