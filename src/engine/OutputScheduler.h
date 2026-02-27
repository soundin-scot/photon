#pragma once
#include <array>
#include <atomic>
#include <cstdint>
#include <memory>
#include <thread>
#include <vector>
#include "engine/MergeBuffer.h"

namespace photon {

class DeviceManager;

class OutputScheduler {
public:
    static constexpr double DEFAULT_REFRESH_HZ = 44.0;

    OutputScheduler(MergeBuffer& mergeBuffer, DeviceManager& deviceManager);
    ~OutputScheduler();

    void start();
    void stop();
    bool isRunning() const;

    void setRefreshRate(double hz);
    double getRefreshRate() const;

private:
    void run();

    MergeBuffer& mergeBuffer_;
    DeviceManager& deviceManager_;
    std::thread thread_;
    std::atomic<bool> running_{false};
    std::atomic<double> refreshHz_{DEFAULT_REFRESH_HZ};
    std::vector<std::array<uint8_t, 512>> lastFrames_;
};

} // namespace photon
