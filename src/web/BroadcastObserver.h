#pragma once
#include <cstdint>
#include <string>

namespace photon {

class BroadcastObserver {
public:
    virtual ~BroadcastObserver() = default;

    virtual void onDmxState(uint16_t universe, const std::string& jsonPayload) = 0;
    virtual void onUniverseCount(uint16_t count) = 0;
};

} // namespace photon
