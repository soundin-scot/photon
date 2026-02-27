#include "engine/Universe.h"

namespace photon {

Universe::Universe() {
    for (auto& ch : channels_) {
        ch.values.fill(0);
        ch.active.fill(false);
    }
}

void Universe::setValue(uint16_t channel, uint8_t value, SourcePriority priority) {
    if (channel >= NUM_CHANNELS) return;
    auto idx = static_cast<size_t>(priority);
    channels_[channel].values[idx] = value;
    channels_[channel].active[idx] = true;
    dirty_.store(true, std::memory_order_relaxed);
}

void Universe::clearPriority(SourcePriority priority) {
    auto idx = static_cast<size_t>(priority);
    for (auto& ch : channels_) {
        ch.active[idx] = false;
        ch.values[idx] = 0;
    }
    dirty_.store(true, std::memory_order_relaxed);
}

void Universe::blackout() {
    for (auto& ch : channels_) {
        ch.values.fill(0);
        ch.active.fill(false);
    }
    dirty_.store(true, std::memory_order_relaxed);
}

uint8_t Universe::getOutputValue(uint16_t channel) const {
    if (channel >= NUM_CHANNELS) return 0;
    return mergeChannel(channels_[channel]);
}

std::array<uint8_t, Universe::NUM_CHANNELS> Universe::getOutput() const {
    std::array<uint8_t, NUM_CHANNELS> output{};
    for (uint16_t i = 0; i < NUM_CHANNELS; ++i) {
        output[i] = mergeChannel(channels_[i]);
    }
    return output;
}

bool Universe::isDirty() const {
    return dirty_.load(std::memory_order_relaxed);
}

void Universe::clearDirty() {
    dirty_.store(false, std::memory_order_relaxed);
}

uint8_t Universe::mergeChannel(const ChannelState& state) const {
    for (int p = NUM_PRIORITIES - 1; p >= 0; --p) {
        if (state.active[p]) return state.values[p];
    }
    return 0;
}

} // namespace photon
