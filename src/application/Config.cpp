#include "application/Config.h"
#include <cstdlib>
#include <iostream>
#include <string>

namespace photon {

Config Config::fromArgs(int argc, char* argv[]) {
    Config cfg;

#ifdef PHOTON_FRONTEND_DIR
    cfg.frontendDir = PHOTON_FRONTEND_DIR;
#endif

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];

        if (arg == "--help" || arg == "-h") {
            std::cout << "Photon — Open-source real-time lighting engine\n\n"
                      << "Usage: photon [options]\n\n"
                      << "Options:\n"
                      << "  --port N            Web UI port (default: 9090)\n"
                      << "  --universes N       Number of DMX universes (default: 4)\n"
                      << "  --artnet-ip IP      Art-Net target IP (default: 255.255.255.255)\n"
                      << "  --artnet-port N     Art-Net UDP port (default: 6454)\n"
                      << "  --frontend-dir PATH Path to frontend dist/ directory\n"
                      << "  --help              Show this help\n";
            std::exit(0);
        }

        if (i + 1 < argc) {
            if (arg == "--port") cfg.webPort = static_cast<uint16_t>(std::stoi(argv[++i]));
            else if (arg == "--universes") cfg.universeCount = static_cast<uint16_t>(std::stoi(argv[++i]));
            else if (arg == "--artnet-ip") cfg.artnetTargetIp = argv[++i];
            else if (arg == "--artnet-port") cfg.artnetPort = static_cast<uint16_t>(std::stoi(argv[++i]));
            else if (arg == "--frontend-dir") cfg.frontendDir = argv[++i];
        }
    }

    return cfg;
}

} // namespace photon
