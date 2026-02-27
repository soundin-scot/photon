#include "relay/RelayClient.h"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>
#include <chrono>

namespace photon {

using json = nlohmann::json;

RelayClient::RelayClient(const std::string& relayUrl, const std::string& relayToken,
                         ActionQueue<Action>& actionQueue)
    : relayUrl_(relayUrl), relayToken_(relayToken), actionQueue_(actionQueue) {}

RelayClient::~RelayClient() {
    stop();
}

void RelayClient::start() {
    if (running_.exchange(true)) return;

    ws_.setUrl(relayUrl_);
    ws_.setOnMessageCallback([this](const ix::WebSocketMessagePtr& msg) {
        onMessage(msg);
    });

    // Enable automatic reconnection with exponential backoff
    ws_.enableAutomaticReconnection();
    ws_.setMinWaitBetweenReconnectionRetries(1000);
    ws_.setMaxWaitBetweenReconnectionRetries(30000);

    ws_.start();
    spdlog::info("Relay client connecting to {}", relayUrl_);
}

void RelayClient::stop() {
    if (!running_.exchange(false)) return;

    stopHeartbeat();
    ws_.stop();
    spdlog::info("Relay client stopped");
}

void RelayClient::onMessage(const ix::WebSocketMessagePtr& msg) {
    if (msg->type == ix::WebSocketMessageType::Open) {
        spdlog::info("Relay connection opened");
        authenticated_.store(false);
        sendAuth();
    } else if (msg->type == ix::WebSocketMessageType::Message) {
        json data;
        try {
            data = json::parse(msg->str);
        } catch (...) {
            return;
        }

        auto type = data.value("type", "");

        if (type == "auth_ack") {
            authenticated_.store(true);
            spdlog::info("Relay authenticated (instance: {})",
                         data.value("instanceId", "unknown"));
            startHeartbeat();
        } else if (type == "command") {
            // Command from browser client via relay
            if (data.contains("data")) {
                handleCommand(data["data"].dump());
            }
        } else if (type == "heartbeat_ack") {
            // Heartbeat acknowledged
        }
    } else if (msg->type == ix::WebSocketMessageType::Close) {
        spdlog::warn("Relay connection closed: {} {}",
                     msg->closeInfo.code, msg->closeInfo.reason);
        authenticated_.store(false);
        stopHeartbeat();
    } else if (msg->type == ix::WebSocketMessageType::Error) {
        spdlog::error("Relay connection error: {}", msg->errorInfo.reason);
    }
}

void RelayClient::handleCommand(const std::string& data) {
    json cmd;
    try {
        cmd = json::parse(data);
    } catch (...) {
        return;
    }

    auto type = cmd.value("type", "");

    if (type == "set_channel") {
        auto universe = cmd.value("universe", -1);
        auto channel = cmd.value("channel", -1);
        auto value = cmd.value("value", -1);
        if (universe >= 0 && channel >= 0 && value >= 0) {
            actionQueue_.push(action::SetChannel{
                static_cast<uint16_t>(universe),
                static_cast<uint16_t>(channel),
                static_cast<uint8_t>(value)
            });
        }
    } else if (type == "blackout") {
        actionQueue_.push(action::Blackout{});
    }
}

void RelayClient::sendAuth() {
    json auth;
    auth["type"] = "auth";
    auth["relay_token"] = relayToken_;
    ws_.send(auth.dump());
}

void RelayClient::startHeartbeat() {
    stopHeartbeat();
    heartbeatRunning_.store(true);
    heartbeatThread_ = std::thread([this] {
        while (heartbeatRunning_.load()) {
            std::this_thread::sleep_for(std::chrono::seconds(15));
            if (!heartbeatRunning_.load() || !authenticated_.load()) break;
            json hb;
            hb["type"] = "heartbeat";
            ws_.send(hb.dump());
        }
    });
}

void RelayClient::stopHeartbeat() {
    heartbeatRunning_.store(false);
    if (heartbeatThread_.joinable()) heartbeatThread_.join();
}

// BroadcastObserver — forward DMX state to relay
void RelayClient::onDmxState(uint16_t /*universe*/, const std::string& jsonPayload) {
    if (!authenticated_.load()) return;
    ws_.send(jsonPayload);
}

void RelayClient::onUniverseCount(uint16_t count) {
    if (!authenticated_.load()) return;
    json msg;
    msg["type"] = "universes";
    msg["count"] = count;
    ws_.send(msg.dump());
}

} // namespace photon
