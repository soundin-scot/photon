#pragma once
#include <array>
#include <atomic>
#include <cstdint>
#include "engine/SourcePriority.h"

namespace photon {

class Universe {
public:
    static constexpr uint16_t NUM_CHANNELS = 512;

    Universe();

    void setValue(uint16_t channel, uint8_t value, SourcePriority priority);
    void clearPriority(SourcePriority priority);
    void blackout();

    uint8_t getOutputValue(uint16_t channel) const;
    std::array<uint8_t, NUM_CHANNELS> getOutput() const;

    bool isDirty() const;
    void clearDirty();

private:
    static constexpr size_t NUM_PRIORITIES = static_cast<size_t>(SourcePriority::COUNT);

    struct ChannelState {
        std::array<uint8_t, NUM_PRIORITIES> values{};
        std::array<bool, NUM_PRIORITIES> active{};
    };

    std::array<ChannelState, NUM_CHANNELS> channels_{};
    std::atomic<bool> dirty_{false};

    uint8_t mergeChannel(const ChannelState& state) const;
};

} // namespace photon
