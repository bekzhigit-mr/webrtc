<template>
  <div class="video-call-app">
    <h2 class="title">WebRTC Видеозвонок</h2>

    <div class="video-container">
      <video ref="localVideo" autoplay playsinline></video>
      <video ref="remoteVideo" autoplay playsinline></video>
    </div>

    <div class="controls">
      <input v-model="username" placeholder="Введите ваше имя" />
      <button @click="startCall" :disabled="isCalling || loading || !username">📞 Начать звонок</button>
      <button @click="stopCall" :disabled="!isCalling">❌ Завершить звонок</button>
    </div>

    <div class="status">
      <p>📡 status: {{ status }}</p>
      <p v-if="remoteUsername">👤 Собеседник: 👤 {{ remoteUsername }}</p>
      <p v-if="errorMessage" class="error">⚠️ Ошибка: {{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import socket from '@/services/socket';

export default {
  data() {
    return {
      username: '',
      remoteUsername: '',
      status: 'Ожидание подключения',
      errorMessage: '',
      localStream: null,
      peerConnection: null,
      socket: null,
      isCalling: false,
      loading: false,
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:YOUR_TURN_SERVER_ADDRESS",
          username: "YOUR_USERNAME",
          credential: "YOUR_PASSWORD"
        }
      ],
    };
  },
  mounted() {
    this.setupSocket();
  },
  methods: {
    setupSocket() {
      this.socket = io("http://localhost:3000");
      this.socket.on("offer", async ({offer, username}) => {
        try {
          this.remoteUsername = username;
          if (!this.peerConnection) this.createPeerConnection();
          if (this.peerConnection.signalingState !== "stable") {
            console.warn("Invalid state for setting remote description");
            return;
          }
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.socket.emit("answer", {answer, username: this.username});
          this.status = 'На связи';
        } catch (error) {
          this.handleError(error);
        }
      });

      this.socket.on("answer", async ({answer, username}) => {
        try {
          this.remoteUsername = username;
          if (this.peerConnection) {
            if (this.peerConnection.signalingState !== "have-local-offer") {
              console.warn("Unexpected signaling state during answer");
              return;
            }
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            this.status = 'На связи';
          }
        } catch (error) {
          this.handleError(error);
        }
      });

      this.socket.on("ice-candidate", (candidate) => {
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(this.handleError);
        } else {
          console.warn("Remote description is not set yet.");
        }
      });
    },

    createPeerConnection() {
      this.peerConnection = new RTCPeerConnection({iceServers: this.iceServers});
      if (this.localStream) {
        this.localStream.getTracks().forEach(track =>
            this.peerConnection.addTrack(track, this.localStream)
        );
      }
      this.peerConnection.ontrack = (event) => {
        this.$refs.remoteVideo.srcObject = event.streams[0];
      };
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) this.socket.emit("ice-candidate", event.candidate);
      };
    },

    async startCall() {
      try {
        this.loading = true;
        this.localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        this.$refs.localVideo.srcObject = this.localStream;
        this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.socket.emit("offer", {offer, username: this.username});
        this.isCalling = true;
        this.status = 'Звонок инициирован';
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },

    stopCall() {
      if (this.peerConnection) this.peerConnection.close();
      if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.peerConnection = null;
      this.isCalling = false;
      this.remoteUsername = '';
      this.status = 'Звонок завершён';
    },

    handleError(error) {
      console.error(error);
      this.errorMessage = error.message || 'Неизвестная ошибка';
      this.status = 'Ошибка';
    }
  }
};
</script>

<style scoped>
.video-call-app {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.video-container {
  display: flex;
  gap: 10px;
}

video {
  width: 320px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
}

.controls input {
  padding: 8px;
  margin-right: 10px;
}

.controls button {
  padding: 10px 20px;
  margin: 10px;
  cursor: pointer;
}

.error {
  color: red;
}
</style>
