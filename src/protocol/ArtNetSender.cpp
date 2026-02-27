#include "protocol/ArtNetSender.h"
#include <spdlog/spdlog.h>
#include <cstring>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

namespace photon {

ArtNetSender::ArtNetSender(const std::string& targetIp, uint16_t port)
    : targetIp_(targetIp), port_(port) {}

ArtNetSender::~ArtNetSender() {
    close();
}

bool ArtNetSender::open() {
    if (socket_ >= 0) return true;

    socket_ = ::socket(AF_INET, SOCK_DGRAM, 0);
    if (socket_ < 0) {
        spdlog::error("Art-Net: failed to create UDP socket");
        return false;
    }

    int broadcastEnable = 1;
    setsockopt(socket_, SOL_SOCKET, SO_BROADCAST,
               reinterpret_cast<const char*>(&broadcastEnable),
               sizeof(broadcastEnable));

    std::memset(&destAddr_, 0, sizeof(destAddr_));
    destAddr_.sin_family = AF_INET;
    destAddr_.sin_port = htons(port_);
    inet_pton(AF_INET, targetIp_.c_str(), &destAddr_.sin_addr);

    spdlog::info("Art-Net: opened sender to {}:{}", targetIp_, port_);
    return true;
}

void ArtNetSender::close() {
    if (socket_ >= 0) {
#ifdef _WIN32
        closesocket(socket_);
#else
        ::close(socket_);
#endif
        socket_ = -1;
        spdlog::info("Art-Net: sender closed");
    }
}

bool ArtNetSender::isOpen() const {
    return socket_ >= 0;
}

void ArtNetSender::send(uint16_t universe, const std::array<uint8_t, 512>& data) {
    if (socket_ < 0) return;

    buildPacket(universe, data);

    ::sendto(socket_,
             reinterpret_cast<const char*>(packet_.data()),
             static_cast<int>(packet_.size()),
             0,
             reinterpret_cast<const struct sockaddr*>(&destAddr_),
             sizeof(destAddr_));
}

std::string ArtNetSender::getTypeName() const {
    return "Art-Net";
}

std::string ArtNetSender::getDescription() const {
    return "Art-Net to " + targetIp_ + ":" + std::to_string(port_);
}

void ArtNetSender::buildPacket(uint16_t universe, const std::array<uint8_t, 512>& data) {
    // Art-Net header: "Art-Net\0"
    std::memcpy(packet_.data(), "Art-Net\0", 8);
    // OpCode: OpDmx (0x5000) little-endian
    packet_[8] = 0x00;
    packet_[9] = 0x50;
    // Protocol version 14
    packet_[10] = 0x00;
    packet_[11] = 14;
    // Sequence (1-255, 0 disables)
    packet_[12] = sequence_;
    sequence_ = (sequence_ == 255) ? 1 : sequence_ + 1;
    // Physical port
    packet_[13] = 0;
    // Universe: SubUni (low byte) + Net (high 7 bits)
    packet_[14] = static_cast<uint8_t>(universe & 0xFF);
    packet_[15] = static_cast<uint8_t>((universe >> 8) & 0x7F);
    // Length: 512 big-endian
    packet_[16] = 0x02;
    packet_[17] = 0x00;
    // DMX data
    std::memcpy(packet_.data() + 18, data.data(), 512);
}

} // namespace photon
