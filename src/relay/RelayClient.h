#pragma once
#include <atomic>
#include <string>
#include <thread>
#include <functional>
#include <ixwebsocket/IXWebSocket.h>
#include "web/BroadcastObserver.h"
#include "engine/ActionQueue.h"

namespace photon {

class RelayClient : public BroadcastObserver {
public:
    RelayClient(const std::string& relayUrl, const std::string& relayToken,
                ActionQueue<Action>& actionQueue);
    ~RelayClient();

    void start();
    void stop();

    // BroadcastObserver interface
    void onDmxState(uint16_t universe, const std::string& jsonPayload) override;
    void onUniverseCount(uint16_t count) override;

private:
    void onMessage(const ix::WebSocketMessagePtr& msg);
    void handleCommand(const std::string& data);
    void sendAuth();
    void startHeartbeat();
    void stopHeartbeat();

    std::string relayUrl_;
    std::string relayToken_;
    ActionQueue<Action>& actionQueue_;

    ix::WebSocket ws_;
    std::atomic<bool> running_{false};
    std::atomic<bool> authenticated_{false};

    std::thread heartbeatThread_;
    std::atomic<bool> heartbeatRunning_{false};
};

} // namespace photon
