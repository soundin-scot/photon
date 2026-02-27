#include "engine/MergeBuffer.h"

namespace photon {

MergeBuffer::MergeBuffer(uint16_t universeCount)
    : universes_(universeCount) {}

void MergeBuffer::setValue(uint16_t universe, uint16_t channel, uint8_t value, SourcePriority priority) {
    std::unique_lock lock(mutex_);
    if (universe >= universes_.size()) return;
    universes_[universe].setValue(channel, value, priority);
}

void MergeBuffer::clearPriority(uint16_t universe, SourcePriority priority) {
    std::unique_lock lock(mutex_);
    if (universe >= universes_.size()) return;
    universes_[universe].clearPriority(priority);
}

void MergeBuffer::blackout() {
    std::unique_lock lock(mutex_);
    for (auto& u : universes_) u.blackout();
}

std::array<uint8_t, 512> MergeBuffer::getOutput(uint16_t universe) const {
    std::shared_lock lock(mutex_);
    if (universe >= universes_.size()) return {};
    return universes_[universe].getOutput();
}

bool MergeBuffer::tryGetOutput(uint16_t universe, std::array<uint8_t, 512>& out) const {
    std::shared_lock lock(mutex_, std::try_to_lock);
    if (!lock.owns_lock()) return false;
    if (universe >= universes_.size()) return false;
    out = universes_[universe].getOutput();
    return true;
}

uint16_t MergeBuffer::getUniverseCount() const {
    return static_cast<uint16_t>(universes_.size());
}

bool MergeBuffer::isUniverseDirty(uint16_t universe) const {
    std::shared_lock lock(mutex_);
    if (universe >= universes_.size()) return false;
    return universes_[universe].isDirty();
}

void MergeBuffer::clearUniverseDirty(uint16_t universe) {
    std::shared_lock lock(mutex_);
    if (universe >= universes_.size()) return;
    universes_[universe].clearDirty();
}

} // namespace photon
