#include "web/WsBroadcaster.h"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>
#include <chrono>

namespace photon {

using json = nlohmann::json;

WsBroadcaster::WsBroadcaster(MergeBuffer& mergeBuffer, double hz)
    : mergeBuffer_(mergeBuffer), hz_(hz) {}

WsBroadcaster::~WsBroadcaster() {
    stop();
}

void WsBroadcaster::addConnection(crow::websocket::connection* conn) {
    {
        std::lock_guard lock(connMutex_);
        connections_.insert(conn);
    }
    spdlog::info("WebSocket client connected (total: {})", connections_.size());
    sendFullState(conn);
}

void WsBroadcaster::removeConnection(crow::websocket::connection* conn) {
    std::lock_guard lock(connMutex_);
    connections_.erase(conn);
    spdlog::info("WebSocket client disconnected (total: {})", connections_.size());
}

void WsBroadcaster::start() {
    if (running_.exchange(true)) return;
    thread_ = std::thread([this] { broadcastLoop(); });
    spdlog::info("WebSocket broadcaster started at {:.0f} Hz", hz_);
}

void WsBroadcaster::stop() {
    running_.store(false);
    if (thread_.joinable()) thread_.join();
}

void WsBroadcaster::broadcastLoop() {
    using clock = std::chrono::steady_clock;
    auto interval = std::chrono::microseconds(static_cast<long>(1'000'000.0 / hz_));
    auto nextTick = clock::now();

    while (running_.load()) {
        nextTick += interval;

        std::lock_guard lock(connMutex_);
        if (!connections_.empty()) {
            for (uint16_t u = 0; u < mergeBuffer_.getUniverseCount(); ++u) {
                if (!mergeBuffer_.isUniverseDirty(u)) continue;
                mergeBuffer_.clearUniverseDirty(u);

                auto output = mergeBuffer_.getOutput(u);

                json msg;
                msg["type"] = "dmx_state";
                msg["universe"] = u;
                msg["channels"] = json::array();
                for (uint16_t ch = 0; ch < 512; ++ch) {
                    msg["channels"].push_back(output[ch]);
                }
                std::string payload = msg.dump();

                for (auto* conn : connections_) {
                    try {
                        conn->send_text(payload);
                    } catch (...) {}
                }
            }
        }

        std::this_thread::sleep_until(nextTick);
    }
}

void WsBroadcaster::sendFullState(crow::websocket::connection* conn) {
    try {
        json universeMsg;
        universeMsg["type"] = "universes";
        universeMsg["count"] = mergeBuffer_.getUniverseCount();
        conn->send_text(universeMsg.dump());

        for (uint16_t u = 0; u < mergeBuffer_.getUniverseCount(); ++u) {
            auto output = mergeBuffer_.getOutput(u);
            json msg;
            msg["type"] = "dmx_state";
            msg["universe"] = u;
            msg["channels"] = json::array();
            for (uint16_t ch = 0; ch < 512; ++ch) {
                msg["channels"].push_back(output[ch]);
            }
            conn->send_text(msg.dump());
        }
    } catch (...) {}
}

} // namespace photon
