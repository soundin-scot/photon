#pragma once
#include "protocol/OutputDevice.h"
#include <array>
#include <cstdint>
#include <string>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <netinet/in.h>
#endif

namespace photon {

class ArtNetSender : public OutputDevice {
public:
    static constexpr uint16_t ARTNET_PORT = 6454;

    explicit ArtNetSender(const std::string& targetIp = "255.255.255.255",
                          uint16_t port = ARTNET_PORT);
    ~ArtNetSender() override;

    bool open() override;
    void close() override;
    bool isOpen() const override;
    void send(uint16_t universe, const std::array<uint8_t, 512>& data) override;
    std::string getTypeName() const override;
    std::string getDescription() const override;

    const std::string& getTargetIp() const { return targetIp_; }
    uint16_t getPort() const { return port_; }

private:
    void buildPacket(uint16_t universe, const std::array<uint8_t, 512>& data);

    std::string targetIp_;
    uint16_t port_;
    int socket_{-1};
    uint8_t sequence_{1};
    std::array<uint8_t, 530> packet_{};
    struct sockaddr_in destAddr_{};
};

} // namespace photon
