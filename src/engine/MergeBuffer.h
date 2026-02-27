#pragma once
#include <array>
#include <cstdint>
#include <shared_mutex>
#include <vector>
#include "engine/SourcePriority.h"
#include "engine/Universe.h"

namespace photon {

class MergeBuffer {
public:
    explicit MergeBuffer(uint16_t universeCount = 4);

    void setValue(uint16_t universe, uint16_t channel, uint8_t value, SourcePriority priority);
    void clearPriority(uint16_t universe, SourcePriority priority);
    void blackout();

    std::array<uint8_t, 512> getOutput(uint16_t universe) const;
    bool tryGetOutput(uint16_t universe, std::array<uint8_t, 512>& out) const;

    uint16_t getUniverseCount() const;
    bool isUniverseDirty(uint16_t universe) const;
    void clearUniverseDirty(uint16_t universe);

private:
    mutable std::shared_mutex mutex_;
    std::vector<Universe> universes_;
};

} // namespace photon
