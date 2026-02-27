#pragma once
#include <array>
#include <cstdint>
#include <string>

namespace photon {

class OutputDevice {
public:
    virtual ~OutputDevice() = default;
    virtual bool open() = 0;
    virtual void close() = 0;
    virtual bool isOpen() const = 0;
    virtual void send(uint16_t universe, const std::array<uint8_t, 512>& data) = 0;
    virtual std::string getTypeName() const = 0;
    virtual std::string getDescription() const = 0;
};

} // namespace photon
