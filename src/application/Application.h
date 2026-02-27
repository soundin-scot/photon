#pragma once
#include <atomic>
#include <memory>
#include <thread>
#include "application/Config.h"
#include "engine/ActionQueue.h"
#include "engine/MergeBuffer.h"
#include "engine/OutputScheduler.h"
#include "protocol/DeviceManager.h"
#include "web/WsBroadcaster.h"
#include "web/WebServer.h"

namespace photon {

class Application {
public:
    Application();
    ~Application();

    void start(const Config& config);
    void stop();
    void waitForStop();

private:
    void engineLoop();
    void setupDefaultDevices(const Config& config);

    Config config_;
    std::unique_ptr<MergeBuffer> mergeBuffer_;
    ActionQueue<Action> actionQueue_;
    std::unique_ptr<DeviceManager> deviceManager_;
    std::unique_ptr<OutputScheduler> outputScheduler_;
    std::unique_ptr<WsBroadcaster> wsBroadcaster_;
    std::unique_ptr<WebServer> webServer_;

    std::thread engineThread_;
    std::thread webThread_;
    std::atomic<bool> running_{false};
};

} // namespace photon
