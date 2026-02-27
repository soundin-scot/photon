#pragma once
#include <cstdint>
#include <string>

namespace photon {

struct Config {
    uint16_t webPort = 9090;
    uint16_t universeCount = 4;
    std::string artnetTargetIp = "255.255.255.255";
    uint16_t artnetPort = 6454;
    double outputHz = 44.0;
    double wsBroadcastHz = 15.0;
    std::string frontendDir;

    static Config fromArgs(int argc, char* argv[]);
};

} // namespace photon
