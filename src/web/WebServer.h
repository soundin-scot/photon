#pragma once
#include <crow.h>
#include <string>
#include "application/Config.h"
#include "engine/ActionQueue.h"
#include "engine/MergeBuffer.h"
#include "protocol/DeviceManager.h"
#include "web/RestApi.h"
#include "web/WsBroadcaster.h"

namespace photon {

class WebServer {
public:
    WebServer(MergeBuffer& mergeBuffer, ActionQueue<Action>& actionQueue,
              DeviceManager& deviceManager, WsBroadcaster& wsBroadcaster,
              const Config& config);

    void start();
    void stop();

private:
    void setupWebSocket();
    void setupStaticFiles();

    crow::SimpleApp app_;
    RestApi restApi_;
    WsBroadcaster& wsBroadcaster_;
    const Config& config_;
    MergeBuffer& mergeBuffer_;
    ActionQueue<Action>& actionQueue_;
};

} // namespace photon
