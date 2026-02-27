#pragma once
#include <crow.h>
#include "application/Config.h"
#include "engine/ActionQueue.h"
#include "engine/MergeBuffer.h"
#include "protocol/DeviceManager.h"

namespace photon {

class RestApi {
public:
    RestApi(MergeBuffer& mergeBuffer, ActionQueue<Action>& actionQueue,
            DeviceManager& deviceManager, const Config& config);

    void registerRoutes(crow::SimpleApp& app);

private:
    crow::response getConfig();
    crow::response getUniverses();
    crow::response getUniverse(int id);
    crow::response setChannel(const crow::request& req, int universe, int channel);
    crow::response setChannels(const crow::request& req, int universe);
    crow::response postBlackout();
    crow::response getDevices();
    crow::response addDevice(const crow::request& req);
    crow::response removeDevice(const std::string& id);

    MergeBuffer& mergeBuffer_;
    ActionQueue<Action>& actionQueue_;
    DeviceManager& deviceManager_;
    const Config& config_;
};

} // namespace photon
