#include "web/RestApi.h"
#include "protocol/ArtNetSender.h"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>

namespace photon {

using json = nlohmann::json;

RestApi::RestApi(MergeBuffer& mergeBuffer, ActionQueue<Action>& actionQueue,
                 DeviceManager& deviceManager, const Config& config)
    : mergeBuffer_(mergeBuffer), actionQueue_(actionQueue),
      deviceManager_(deviceManager), config_(config) {}

void RestApi::registerRoutes(crow::SimpleApp& app) {
    CROW_ROUTE(app, "/api/config").methods("GET"_method)
    ([this] { return getConfig(); });

    CROW_ROUTE(app, "/api/universes").methods("GET"_method)
    ([this] { return getUniverses(); });

    CROW_ROUTE(app, "/api/universes/<int>").methods("GET"_method)
    ([this](int id) { return getUniverse(id); });

    CROW_ROUTE(app, "/api/universes/<int>/channels/<int>").methods("PUT"_method)
    ([this](const crow::request& req, int universe, int channel) {
        return setChannel(req, universe, channel);
    });

    CROW_ROUTE(app, "/api/universes/<int>/channels").methods("PUT"_method)
    ([this](const crow::request& req, int universe) {
        return setChannels(req, universe);
    });

    CROW_ROUTE(app, "/api/blackout").methods("POST"_method)
    ([this] { return postBlackout(); });

    CROW_ROUTE(app, "/api/devices").methods("GET"_method)
    ([this] { return getDevices(); });

    CROW_ROUTE(app, "/api/devices").methods("POST"_method)
    ([this](const crow::request& req) { return addDevice(req); });

    CROW_ROUTE(app, "/api/devices/<string>").methods("DELETE"_method)
    ([this](const std::string& id) { return removeDevice(id); });
}

crow::response RestApi::getConfig() {
    json j;
    j["universeCount"] = config_.universeCount;
    j["webPort"] = config_.webPort;
    j["artnetTargetIp"] = config_.artnetTargetIp;
    j["artnetPort"] = config_.artnetPort;
    j["outputHz"] = config_.outputHz;
    j["wsBroadcastHz"] = config_.wsBroadcastHz;
    crow::response res(j.dump());
    res.set_header("Content-Type", "application/json");
    return res;
}

crow::response RestApi::getUniverses() {
    json arr = json::array();
    for (uint16_t u = 0; u < mergeBuffer_.getUniverseCount(); ++u) {
        json uni;
        uni["id"] = u;
        auto output = mergeBuffer_.getOutput(u);
        uni["channels"] = json::array();
        for (auto v : output) uni["channels"].push_back(v);
        arr.push_back(uni);
    }
    crow::response res(arr.dump());
    res.set_header("Content-Type", "application/json");
    return res;
}

crow::response RestApi::getUniverse(int id) {
    if (id < 0 || id >= mergeBuffer_.getUniverseCount()) {
        return crow::response(404, "Universe not found");
    }
    json j;
    j["id"] = id;
    auto output = mergeBuffer_.getOutput(static_cast<uint16_t>(id));
    j["channels"] = json::array();
    for (auto v : output) j["channels"].push_back(v);
    crow::response res(j.dump());
    res.set_header("Content-Type", "application/json");
    return res;
}

crow::response RestApi::setChannel(const crow::request& req, int universe, int channel) {
    if (universe < 0 || universe >= mergeBuffer_.getUniverseCount())
        return crow::response(404, "Universe not found");
    if (channel < 0 || channel >= 512)
        return crow::response(400, "Channel out of range (0-511)");

    try {
        auto body = json::parse(req.body);
        uint8_t value = body.at("value").get<uint8_t>();
        actionQueue_.push(action::SetChannel{
            static_cast<uint16_t>(universe),
            static_cast<uint16_t>(channel),
            value
        });
        return crow::response(200, R"({"ok":true})");
    } catch (const std::exception& e) {
        return crow::response(400, std::string(R"({"error":")") + e.what() + "\"}");
    }
}

crow::response RestApi::setChannels(const crow::request& req, int universe) {
    if (universe < 0 || universe >= mergeBuffer_.getUniverseCount())
        return crow::response(404, "Universe not found");

    try {
        auto body = json::parse(req.body);
        auto& channels = body.at("channels");
        for (auto& [key, val] : channels.items()) {
            uint16_t ch = static_cast<uint16_t>(std::stoi(key));
            uint8_t v = val.get<uint8_t>();
            actionQueue_.push(action::SetChannel{
                static_cast<uint16_t>(universe), ch, v
            });
        }
        return crow::response(200, R"({"ok":true})");
    } catch (const std::exception& e) {
        return crow::response(400, std::string(R"({"error":")") + e.what() + "\"}");
    }
}

crow::response RestApi::postBlackout() {
    actionQueue_.push(action::Blackout{});
    spdlog::info("Blackout triggered via REST");
    return crow::response(200, R"({"ok":true})");
}

crow::response RestApi::getDevices() {
    json arr = json::array();
    for (const auto& d : deviceManager_.getAllDevices()) {
        json dev;
        dev["id"] = d.id;
        dev["type"] = d.device->getTypeName();
        dev["description"] = d.device->getDescription();
        dev["universe"] = d.universe;
        dev["open"] = d.device->isOpen();
        arr.push_back(dev);
    }
    crow::response res(arr.dump());
    res.set_header("Content-Type", "application/json");
    return res;
}

crow::response RestApi::addDevice(const crow::request& req) {
    try {
        auto body = json::parse(req.body);
        std::string type = body.at("type").get<std::string>();
        uint16_t universe = body.value("universe", 0);

        if (type == "artnet") {
            std::string ip = body.value("ip", "255.255.255.255");
            uint16_t port = body.value("port", 6454);
            auto device = std::make_shared<ArtNetSender>(ip, port);
            std::string id = deviceManager_.addDevice(device, universe);
            json j;
            j["id"] = id;
            j["ok"] = true;
            crow::response res(201, j.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }

        return crow::response(400, R"({"error":"Unknown device type"})");
    } catch (const std::exception& e) {
        return crow::response(400, std::string(R"({"error":")") + e.what() + "\"}");
    }
}

crow::response RestApi::removeDevice(const std::string& id) {
    deviceManager_.removeDevice(id);
    return crow::response(200, R"({"ok":true})");
}

} // namespace photon
