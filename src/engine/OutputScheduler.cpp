#include "engine/OutputScheduler.h"
#include "protocol/DeviceManager.h"
#include <spdlog/spdlog.h>
#include <chrono>

#ifndef _WIN32
#include <pthread.h>
#include <sched.h>
#endif

namespace photon {

OutputScheduler::OutputScheduler(MergeBuffer& mergeBuffer, DeviceManager& deviceManager)
    : mergeBuffer_(mergeBuffer), deviceManager_(deviceManager) {}

OutputScheduler::~OutputScheduler() {
    stop();
}

void OutputScheduler::start() {
    if (running_.exchange(true)) return;

    lastFrames_.resize(mergeBuffer_.getUniverseCount());
    for (auto& frame : lastFrames_) frame.fill(0);

    thread_ = std::thread([this] { run(); });
}

void OutputScheduler::stop() {
    running_.store(false);
    if (thread_.joinable()) thread_.join();
}

bool OutputScheduler::isRunning() const {
    return running_.load();
}

void OutputScheduler::setRefreshRate(double hz) {
    refreshHz_.store(hz);
}

double OutputScheduler::getRefreshRate() const {
    return refreshHz_.load();
}

void OutputScheduler::run() {
#ifndef _WIN32
    sched_param param{};
    param.sched_priority = 80;
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &param) != 0) {
        spdlog::warn("Could not set real-time thread priority (run as root for RT scheduling)");
    }
#endif

    spdlog::info("Output scheduler started at {:.0f} Hz", refreshHz_.load());

    using clock = std::chrono::steady_clock;
    auto nextTick = clock::now();

    while (running_.load()) {
        double hz = refreshHz_.load();
        auto interval = std::chrono::microseconds(static_cast<long>(1'000'000.0 / hz));
        nextTick += interval;

        uint16_t universeCount = mergeBuffer_.getUniverseCount();
        if (lastFrames_.size() < universeCount) {
            lastFrames_.resize(universeCount);
        }

        for (uint16_t u = 0; u < universeCount; ++u) {
            std::array<uint8_t, 512> frame{};
            if (mergeBuffer_.tryGetOutput(u, frame)) {
                lastFrames_[u] = frame;
            }

            auto devices = deviceManager_.getDevicesForUniverse(u);
            for (auto& device : devices) {
                if (device->isOpen()) {
                    device->send(u, lastFrames_[u]);
                }
            }
        }

        std::this_thread::sleep_until(nextTick);
    }

    spdlog::info("Output scheduler stopped");
}

} // namespace photon
