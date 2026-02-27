#pragma once
#include <atomic>
#include <mutex>
#include <set>
#include <thread>
#include <vector>
#include <crow.h>
#include "engine/MergeBuffer.h"
#include "web/BroadcastObserver.h"

namespace photon {

class WsBroadcaster {
public:
    explicit WsBroadcaster(MergeBuffer& mergeBuffer, double hz = 15.0);
    ~WsBroadcaster();

    void addConnection(crow::websocket::connection* conn);
    void removeConnection(crow::websocket::connection* conn);

    void addObserver(BroadcastObserver* observer);
    void removeObserver(BroadcastObserver* observer);

    void start();
    void stop();

private:
    void broadcastLoop();
    void sendFullState(crow::websocket::connection* conn);

    MergeBuffer& mergeBuffer_;
    double hz_;

    std::mutex connMutex_;
    std::set<crow::websocket::connection*> connections_;

    std::mutex observerMutex_;
    std::vector<BroadcastObserver*> observers_;

    std::thread thread_;
    std::atomic<bool> running_{false};
};

} // namespace photon
