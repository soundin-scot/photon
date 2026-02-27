#pragma once
#include <cstdint>

namespace photon {

enum class SourcePriority : uint8_t {
    Background = 0,
    Scene = 1,
    Chase = 2,
    Effect = 3,
    CuePlayback = 4,
    Programmer = 5,
    COUNT
};

} // namespace photon
