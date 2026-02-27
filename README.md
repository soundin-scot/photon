# Photon

**Open-source real-time lighting engine**

Real-time lighting middleware that bridges creative visual tools (TouchDesigner, Unreal Engine, Resolume) and DMX/Art-Net hardware output. The missing link in the modern visual effects pipeline.

## Build

```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
```

## Run

```bash
./photon --port 9090
```

Open `http://localhost:9090` in your browser. Move faders to control DMX output via Art-Net.

### Options

| Flag | Default | Description |
|---|---|---|
| `--port N` | 9090 | Web UI port |
| `--universes N` | 4 | Number of DMX universes |
| `--artnet-ip IP` | 255.255.255.255 | Art-Net target IP (broadcast) |
| `--artnet-port N` | 6454 | Art-Net UDP port |
| `--frontend-dir PATH` | (bundled) | Frontend static files directory |

## Architecture

```
Web UI (React + TypeScript + Vite)
        │ HTTP REST + WebSocket
C++ Core Engine
  ├── Merge Buffer (HTP/LTP per channel)
  ├── Output Scheduler (44Hz DMX refresh)
  ├── Art-Net / sACN / USB DMX output
  └── Input: MIDI / OSC / Art-Net Rx
```

## License

GPLv3 — see [LICENSE](LICENSE).

Part of the [soundin](https://github.com/soundin) organization.
